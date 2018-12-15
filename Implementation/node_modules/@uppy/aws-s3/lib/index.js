var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var resolveUrl = require('resolve-url');

var _require = require('@uppy/core'),
    Plugin = _require.Plugin;

var Translator = require('@uppy/utils/lib/Translator');
var limitPromises = require('@uppy/utils/lib/limitPromises');

var _require2 = require('@uppy/companion-client'),
    RequestClient = _require2.RequestClient;

var XHRUpload = require('@uppy/xhr-upload');

function isXml(xhr) {
  var contentType = xhr.headers ? xhr.headers['content-type'] : xhr.getResponseHeader('Content-Type');
  return typeof contentType === 'string' && contentType.toLowerCase() === 'application/xml';
}

function getXmlValue(source, key) {
  var start = source.indexOf('<' + key + '>');
  var end = source.indexOf('</' + key + '>', start);
  return start !== -1 && end !== -1 ? source.slice(start + key.length + 2, end) : '';
}

function assertServerError(res) {
  if (res && res.error) {
    var error = new Error(res.message);
    _extends(error, res.error);
    throw error;
  }
  return res;
}

module.exports = function (_Plugin) {
  _inherits(AwsS3, _Plugin);

  function AwsS3(uppy, opts) {
    _classCallCheck(this, AwsS3);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.type = 'uploader';
    _this.id = 'AwsS3';
    _this.title = 'AWS S3';

    var defaultLocale = {
      strings: {
        preparingUpload: 'Preparing upload...'
      }
    };

    var defaultOptions = {
      timeout: 30 * 1000,
      limit: 0,
      getUploadParameters: _this.getUploadParameters.bind(_this),
      locale: defaultLocale
    };

    _this.opts = _extends({}, defaultOptions, opts);

    // i18n
    _this.translator = new Translator([defaultLocale, _this.uppy.locale, _this.opts.locale]);
    _this.i18n = _this.translator.translate.bind(_this.translator);
    _this.i18nArray = _this.translator.translateArray.bind(_this.translator);

    _this.client = new RequestClient(uppy, opts);

    _this.prepareUpload = _this.prepareUpload.bind(_this);

    if (typeof _this.opts.limit === 'number' && _this.opts.limit !== 0) {
      _this.limitRequests = limitPromises(_this.opts.limit);
    } else {
      _this.limitRequests = function (fn) {
        return fn;
      };
    }
    return _this;
  }

  AwsS3.prototype.getUploadParameters = function getUploadParameters(file) {
    if (!this.opts.serverUrl) {
      throw new Error('Expected a `serverUrl` option containing a Companion address.');
    }

    var filename = encodeURIComponent(file.name);
    var type = encodeURIComponent(file.type);
    return this.client.get('s3/params?filename=' + filename + '&type=' + type).then(assertServerError);
  };

  AwsS3.prototype.validateParameters = function validateParameters(file, params) {
    var valid = (typeof params === 'undefined' ? 'undefined' : _typeof(params)) === 'object' && params && typeof params.url === 'string' && (_typeof(params.fields) === 'object' || params.fields == null) && (params.method == null || /^(put|post)$/i.test(params.method));

    if (!valid) {
      var err = new TypeError('AwsS3: got incorrect result from \'getUploadParameters()\' for file \'' + file.name + '\', expected an object \'{ url, method, fields, headers }\'.\nSee https://uppy.io/docs/aws-s3/#getUploadParameters-file for more on the expected format.');
      console.error(err);
      throw err;
    }

    return params;
  };

  AwsS3.prototype.prepareUpload = function prepareUpload(fileIDs) {
    var _this2 = this;

    fileIDs.forEach(function (id) {
      var file = _this2.uppy.getFile(id);
      _this2.uppy.emit('preprocess-progress', file, {
        mode: 'determinate',
        message: _this2.i18n('preparingUpload'),
        value: 0
      });
    });

    var getUploadParameters = this.limitRequests(this.opts.getUploadParameters);

    return Promise.all(fileIDs.map(function (id) {
      var file = _this2.uppy.getFile(id);
      var paramsPromise = Promise.resolve().then(function () {
        return getUploadParameters(file);
      });
      return paramsPromise.then(function (params) {
        return _this2.validateParameters(file, params);
      }).then(function (params) {
        _this2.uppy.emit('preprocess-progress', file, {
          mode: 'determinate',
          message: _this2.i18n('preparingUpload'),
          value: 1
        });
        return params;
      }).catch(function (error) {
        _this2.uppy.emit('upload-error', file, error);
      });
    })).then(function (responses) {
      var updatedFiles = {};
      fileIDs.forEach(function (id, index) {
        var file = _this2.uppy.getFile(id);
        if (file.error) {
          return;
        }

        var _responses$index = responses[index],
            _responses$index$meth = _responses$index.method,
            method = _responses$index$meth === undefined ? 'post' : _responses$index$meth,
            url = _responses$index.url,
            fields = _responses$index.fields,
            headers = _responses$index.headers;

        var xhrOpts = {
          method: method,
          formData: method.toLowerCase() === 'post',
          endpoint: url,
          metaFields: Object.keys(fields)
        };

        if (headers) {
          xhrOpts.headers = headers;
        }

        var updatedFile = _extends({}, file, {
          meta: _extends({}, file.meta, fields),
          xhrUpload: xhrOpts
        });

        updatedFiles[id] = updatedFile;
      });

      _this2.uppy.setState({
        files: _extends({}, _this2.uppy.getState().files, updatedFiles)
      });

      fileIDs.forEach(function (id) {
        var file = _this2.uppy.getFile(id);
        _this2.uppy.emit('preprocess-complete', file);
      });
    });
  };

  AwsS3.prototype.install = function install() {
    var log = this.uppy.log;

    this.uppy.addPreProcessor(this.prepareUpload);

    var warnedSuccessActionStatus = false;
    this.uppy.use(XHRUpload, {
      fieldName: 'file',
      responseUrlFieldName: 'location',
      timeout: this.opts.timeout,
      limit: this.opts.limit,
      responseType: 'text',
      // Get the response data from a successful XMLHttpRequest instance.
      // `content` is the S3 response as a string.
      // `xhr` is the XMLHttpRequest instance.
      getResponseData: function getResponseData(content, xhr) {
        var opts = this;

        // If no response, we've hopefully done a PUT request to the file
        // in the bucket on its full URL.
        if (!isXml(xhr)) {
          if (opts.method.toUpperCase() === 'POST') {
            if (!warnedSuccessActionStatus) {
              log('[AwsS3] No response data found, make sure to set the success_action_status AWS SDK option to 201. See https://uppy.io/docs/aws-s3/#POST-Uploads', 'warning');
              warnedSuccessActionStatus = true;
            }
            // The responseURL won't contain the object key. Give up.
            return { location: null };
          }

          // responseURL is not available in older browsers.
          if (!xhr.responseURL) {
            return { location: null };
          }

          // Trim the query string because it's going to be a bunch of presign
          // parameters for a PUT request—doing a GET request with those will
          // always result in an error
          return { location: xhr.responseURL.replace(/\?.*$/, '') };
        }

        return {
          // Some S3 alternatives do not reply with an absolute URL.
          // Eg DigitalOcean Spaces uses /$bucketName/xyz
          location: resolveUrl(xhr.responseURL, getXmlValue(content, 'Location')),
          bucket: getXmlValue(content, 'Bucket'),
          key: getXmlValue(content, 'Key'),
          etag: getXmlValue(content, 'ETag')
        };
      },


      // Get the error data from a failed XMLHttpRequest instance.
      // `content` is the S3 response as a string.
      // `xhr` is the XMLHttpRequest instance.
      getResponseError: function getResponseError(content, xhr) {
        // If no response, we don't have a specific error message, use the default.
        if (!isXml(xhr)) {
          return;
        }
        var error = getXmlValue(content, 'Message');
        return new Error(error);
      }
    });
  };

  AwsS3.prototype.uninstall = function uninstall() {
    var uploader = this.uppy.getPlugin('XHRUpload');
    this.uppy.removePlugin(uploader);

    this.uppy.removePreProcessor(this.prepareUpload);
  };

  return AwsS3;
}(Plugin);