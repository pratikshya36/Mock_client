var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var MB = 1024 * 1024;

var defaultOptions = {
  limit: 1,
  onStart: function onStart() {},
  onProgress: function onProgress() {},
  onPartComplete: function onPartComplete() {},
  onSuccess: function onSuccess() {},
  onError: function onError(err) {
    throw err;
  }
};

function remove(arr, el) {
  var i = arr.indexOf(el);
  if (i !== -1) arr.splice(i, 1);
}

var MultipartUploader = function () {
  function MultipartUploader(file, options) {
    _classCallCheck(this, MultipartUploader);

    this.options = _extends({}, defaultOptions, options);
    this.file = file;

    this.key = this.options.key || null;
    this.uploadId = this.options.uploadId || null;
    this.parts = this.options.parts || [];

    this.isPaused = false;
    this.chunks = null;
    this.chunkState = null;
    this.uploading = [];

    this._initChunks();
  }

  MultipartUploader.prototype._initChunks = function _initChunks() {
    var chunks = [];
    var chunkSize = Math.max(Math.ceil(this.file.size / 10000), 5 * MB);

    for (var i = 0; i < this.file.size; i += chunkSize) {
      var end = Math.min(this.file.size, i + chunkSize);
      chunks.push(this.file.slice(i, end));
    }

    this.chunks = chunks;
    this.chunkState = chunks.map(function () {
      return {
        uploaded: 0,
        busy: false,
        done: false
      };
    });
  };

  MultipartUploader.prototype._createUpload = function _createUpload() {
    var _this = this;

    return Promise.resolve().then(function () {
      return _this.options.createMultipartUpload();
    }).then(function (result) {
      var valid = (typeof result === 'undefined' ? 'undefined' : _typeof(result)) === 'object' && result && typeof result.uploadId === 'string' && typeof result.key === 'string';
      if (!valid) {
        throw new TypeError('AwsS3/Multipart: Got incorrect result from \'createMultipartUpload()\', expected an object \'{ uploadId, key }\'.');
      }
      return result;
    }).then(function (result) {
      _this.key = result.key;
      _this.uploadId = result.uploadId;

      _this.options.onStart(result);
    }).then(function () {
      _this._uploadParts();
    }).catch(function (err) {
      _this._onError(err);
    });
  };

  MultipartUploader.prototype._resumeUpload = function _resumeUpload() {
    var _this2 = this;

    return Promise.resolve().then(function () {
      return _this2.options.listParts({
        uploadId: _this2.uploadId,
        key: _this2.key
      });
    }).then(function (parts) {
      parts.forEach(function (part) {
        var i = part.PartNumber - 1;
        _this2.chunkState[i] = {
          uploaded: part.Size,
          etag: part.ETag,
          done: true

          // Only add if we did not yet know about this part.
        };if (!_this2.parts.some(function (p) {
          return p.PartNumber === part.PartNumber;
        })) {
          _this2.parts.push({
            PartNumber: part.PartNumber,
            ETag: part.ETag
          });
        }
      });
      _this2._uploadParts();
    }).catch(function (err) {
      _this2._onError(err);
    });
  };

  MultipartUploader.prototype._uploadParts = function _uploadParts() {
    var _this3 = this;

    if (this.isPaused) return;

    var need = this.options.limit - this.uploading.length;
    if (need === 0) return;

    // All parts are uploaded.
    if (this.chunkState.every(function (state) {
      return state.done;
    })) {
      this._completeUpload();
      return;
    }

    var candidates = [];
    for (var i = 0; i < this.chunkState.length; i++) {
      var state = this.chunkState[i];
      if (state.done || state.busy) continue;

      candidates.push(i);
      if (candidates.length >= need) {
        break;
      }
    }

    candidates.forEach(function (index) {
      _this3._uploadPart(index);
    });
  };

  MultipartUploader.prototype._uploadPart = function _uploadPart(index) {
    var _this4 = this;

    var body = this.chunks[index];
    this.chunkState[index].busy = true;

    return Promise.resolve().then(function () {
      return _this4.options.prepareUploadPart({
        key: _this4.key,
        uploadId: _this4.uploadId,
        body: body,
        number: index + 1
      });
    }).then(function (result) {
      var valid = (typeof result === 'undefined' ? 'undefined' : _typeof(result)) === 'object' && result && typeof result.url === 'string';
      if (!valid) {
        throw new TypeError('AwsS3/Multipart: Got incorrect result from \'prepareUploadPart()\', expected an object \'{ url }\'.');
      }
      return result;
    }).then(function (_ref) {
      var url = _ref.url;

      _this4._uploadPartBytes(index, url);
    }, function (err) {
      _this4._onError(err);
    });
  };

  MultipartUploader.prototype._onPartProgress = function _onPartProgress(index, sent, total) {
    this.chunkState[index].uploaded = sent;

    var totalUploaded = this.chunkState.reduce(function (n, c) {
      return n + c.uploaded;
    }, 0);
    this.options.onProgress(totalUploaded, this.file.size);
  };

  MultipartUploader.prototype._onPartComplete = function _onPartComplete(index, etag) {
    this.chunkState[index].etag = etag;
    this.chunkState[index].done = true;

    var part = {
      PartNumber: index + 1,
      ETag: etag
    };
    this.parts.push(part);

    this.options.onPartComplete(part);

    this._uploadParts();
  };

  MultipartUploader.prototype._uploadPartBytes = function _uploadPartBytes(index, url) {
    var _this5 = this;

    var body = this.chunks[index];
    var xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.responseType = 'text';

    this.uploading.push(xhr);

    xhr.upload.addEventListener('progress', function (ev) {
      if (!ev.lengthComputable) return;

      _this5._onPartProgress(index, ev.loaded, ev.total);
    });

    xhr.addEventListener('abort', function (ev) {
      remove(_this5.uploading, ev.target);
      _this5.chunkState[index].busy = false;
    });

    xhr.addEventListener('load', function (ev) {
      remove(_this5.uploading, ev.target);
      _this5.chunkState[index].busy = false;

      if (ev.target.status < 200 || ev.target.status >= 300) {
        _this5._onError(new Error('Non 2xx'));
        return;
      }

      _this5._onPartProgress(index, body.size, body.size);

      // NOTE This must be allowed by CORS.
      var etag = ev.target.getResponseHeader('ETag');
      if (etag === null) {
        _this5._onError(new Error('AwsS3/Multipart: Could not read the ETag header. This likely means CORS is not configured correctly on the S3 Bucket. Seee https://uppy.io/docs/aws-s3-multipart#S3-Bucket-Configuration for instructions.'));
        return;
      }

      _this5._onPartComplete(index, etag);
    });

    xhr.addEventListener('error', function (ev) {
      remove(_this5.uploading, ev.target);
      _this5.chunkState[index].busy = false;

      var error = new Error('Unknown error');
      error.source = ev.target;
      _this5._onError(error);
    });

    xhr.send(body);
  };

  MultipartUploader.prototype._completeUpload = function _completeUpload() {
    var _this6 = this;

    // Parts may not have completed uploading in sorted order, if limit > 1.
    this.parts.sort(function (a, b) {
      return a.PartNumber - b.PartNumber;
    });

    return Promise.resolve().then(function () {
      return _this6.options.completeMultipartUpload({
        key: _this6.key,
        uploadId: _this6.uploadId,
        parts: _this6.parts
      });
    }).then(function (result) {
      _this6.options.onSuccess(result);
    }, function (err) {
      _this6._onError(err);
    });
  };

  MultipartUploader.prototype._abortUpload = function _abortUpload() {
    this.uploading.slice().forEach(function (xhr) {
      xhr.abort();
    });
    this.options.abortMultipartUpload({
      key: this.key,
      uploadId: this.uploadId
    });
    this.uploading = [];
  };

  MultipartUploader.prototype._onError = function _onError(err) {
    this.options.onError(err);
  };

  MultipartUploader.prototype.start = function start() {
    this.isPaused = false;
    if (this.uploadId) {
      this._resumeUpload();
    } else {
      this._createUpload();
    }
  };

  MultipartUploader.prototype.pause = function pause() {
    var inProgress = this.uploading.slice();
    inProgress.forEach(function (xhr) {
      xhr.abort();
    });
    this.isPaused = true;
  };

  MultipartUploader.prototype.abort = function abort() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var really = opts.really || false;

    if (!really) return this.pause();

    this._abortUpload();
  };

  return MultipartUploader;
}();

module.exports = MultipartUploader;