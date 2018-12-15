var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var io = requireSocketIo;
var Emitter = require('component-emitter');
var parseUrl = require('./parseUrl');

// Lazy load socket.io to avoid a console error
// in IE 10 when the Transloadit plugin is not used.
// (The console.error call comes from `buffer`. I
// think we actually don't use that part of socket.io
// at all…)
var socketIo = void 0;
function requireSocketIo() {
  if (!socketIo) {
    socketIo = require('socket.io-client');
  }
  return socketIo;
}

var ASSEMBLY_UPLOADING = 'ASSEMBLY_UPLOADING';
var ASSEMBLY_EXECUTING = 'ASSEMBLY_EXECUTING';
var ASSEMBLY_COMPLETED = 'ASSEMBLY_COMPLETED';

var statusOrder = [ASSEMBLY_UPLOADING, ASSEMBLY_EXECUTING, ASSEMBLY_COMPLETED];

/**
 * Check that an assembly status is equal to or larger than some desired status.
 * It checks for things that are larger so that a comparison like this works,
 * when the old assembly status is UPLOADING but the new is FINISHED:
 *
 * !isStatus(oldStatus, ASSEMBLY_EXECUTING) && isStatus(newState, ASSEMBLY_EXECUTING)
 *
 * …so that we can emit the 'executing' event even if the execution step was so
 * fast that we missed it.
 */
function isStatus(status, test) {
  return statusOrder.indexOf(status) >= statusOrder.indexOf(test);
}

var TransloaditAssembly = function (_Emitter) {
  _inherits(TransloaditAssembly, _Emitter);

  function TransloaditAssembly(assembly) {
    _classCallCheck(this, TransloaditAssembly);

    // The current assembly status.
    var _this = _possibleConstructorReturn(this, _Emitter.call(this));

    _this.status = assembly;
    // The socket.io connection.
    _this.socket = null;
    // The interval timer for full status updates.
    _this.pollInterval = null;
    // Whether this assembly has been closed (finished or errored)
    _this.closed = false;
    return _this;
  }

  TransloaditAssembly.prototype.connect = function connect() {
    this._connectSocket();
    this._beginPolling();
  };

  TransloaditAssembly.prototype._onFinished = function _onFinished() {
    this.emit('finished');
    this.close();
  };

  TransloaditAssembly.prototype._connectSocket = function _connectSocket() {
    var _this2 = this;

    var parsed = parseUrl(this.status.websocket_url);
    var socket = io().connect(parsed.origin, {
      transports: ['websocket'],
      path: parsed.pathname
    });

    socket.on('connect', function () {
      socket.emit('assembly_connect', {
        id: _this2.status.assembly_id
      });

      _this2.emit('connect');
    });
    socket.on('error', function () {
      socket.disconnect();
      _this2.socket = null;
    });

    socket.on('assembly_finished', function () {
      _this2._onFinished();
    });

    socket.on('assembly_upload_finished', function (file) {
      _this2.emit('upload', file);
      _this2._fetchStatus({ diff: false });
    });

    socket.on('assembly_uploading_finished', function () {
      _this2.emit('executing');
      _this2._fetchStatus({ diff: false });
    });

    socket.on('assembly_upload_meta_data_extracted', function () {
      _this2.emit('metadata');
      _this2._fetchStatus({ diff: false });
    });

    socket.on('assembly_result_finished', function (stepName, result) {
      _this2.emit('result', stepName, result);
      _this2._fetchStatus({ diff: false });
    });

    socket.on('assembly_error', function (err) {
      _this2._onError(err);
      _this2._fetchStatus({ diff: false });
    });

    this.socket = socket;
  };

  TransloaditAssembly.prototype._onError = function _onError(err) {
    this.emit('error', _extends(new Error(err.message), err));
  };

  /**
   * Begin polling for assembly status changes. This sends a request to the
   * assembly status endpoint every so often, if the socket is not connected.
   * If the socket connection fails or takes a long time, we won't miss any
   * events.
   */


  TransloaditAssembly.prototype._beginPolling = function _beginPolling() {
    var _this3 = this;

    this.pollInterval = setInterval(function () {
      if (!_this3.socket || !_this3.socket.connected) {
        _this3._fetchStatus();
      }
    }, 2000);
  };

  /**
   * Reload assembly status. Useful if the socket doesn't work.
   *
   * Pass `diff: false` to avoid emitting diff events, instead only emitting
   * 'status'.
   */


  TransloaditAssembly.prototype._fetchStatus = function _fetchStatus() {
    var _this4 = this;

    var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        _ref$diff = _ref.diff,
        diff = _ref$diff === undefined ? true : _ref$diff;

    return fetch(this.status.assembly_ssl_url).then(function (response) {
      return response.json();
    }).then(function (status) {
      // Avoid updating if we closed during this request's lifetime.
      if (_this4.closed) return;
      _this4.emit('status', status);

      if (diff) {
        _this4.updateStatus(status);
      } else {
        _this4.status = status;
      }
    });
  };

  TransloaditAssembly.prototype.update = function update() {
    return this._fetchStatus({ diff: true });
  };

  /**
   * Update this assembly's status with a full new object. Events will be
   * emitted for status changes, new files, and new results.
   *
   * @param {Object} next The new assembly status object.
   */


  TransloaditAssembly.prototype.updateStatus = function updateStatus(next) {
    this._diffStatus(this.status, next);
    this.status = next;
  };

  /**
   * Diff two assembly statuses, and emit the events necessary to go from `prev`
   * to `next`.
   *
   * @param {Object} prev The previous assembly status.
   * @param {Object} next The new assembly status.
   */


  TransloaditAssembly.prototype._diffStatus = function _diffStatus(prev, next) {
    var _this5 = this;

    var prevStatus = prev.ok;
    var nextStatus = next.ok;

    if (next.error && !prev.error) {
      return this._onError(next);
    }

    // Desired emit order:
    //  - executing
    //  - (n × upload)
    //  - metadata
    //  - (m × result)
    //  - finished
    // The below checks run in this order, that way even if we jump from
    // UPLOADING straight to FINISHED all the events are emitted as expected.

    var nowExecuting = isStatus(nextStatus, ASSEMBLY_EXECUTING) && !isStatus(prevStatus, ASSEMBLY_EXECUTING);
    if (nowExecuting) {
      // Without WebSockets, this is our only way to tell if uploading finished.
      // Hence, we emit this just before the 'upload's and before the 'metadata'
      // event for the most intuitive ordering, corresponding to the _usual_
      // ordering (if not guaranteed) that you'd get on the WebSocket.
      this.emit('executing');
    }

    // Find new uploaded files.
    Object.keys(next.uploads).filter(function (upload) {
      return !prev.uploads.hasOwnProperty(upload);
    }).map(function (upload) {
      return next.uploads[upload];
    }).forEach(function (upload) {
      _this5.emit('upload', upload);
    });

    if (nowExecuting) {
      this.emit('metadata');
    }

    // Find new results.
    Object.keys(next.results).forEach(function (stepName) {
      var nextResults = next.results[stepName];
      var prevResults = prev.results[stepName];

      nextResults.filter(function (n) {
        return !prevResults || !prevResults.some(function (p) {
          return p.id === n.id;
        });
      }).forEach(function (result) {
        _this5.emit('result', stepName, result);
      });
    });

    if (isStatus(nextStatus, ASSEMBLY_COMPLETED) && !isStatus(prevStatus, ASSEMBLY_COMPLETED)) {
      this.emit('finished');
    }
  };

  /**
   * Stop updating this assembly.
   */


  TransloaditAssembly.prototype.close = function close() {
    this.closed = true;
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    clearInterval(this.pollInterval);
  };

  return TransloaditAssembly;
}(Emitter);

module.exports = TransloaditAssembly;