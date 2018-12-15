var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('@uppy/core'),
    Plugin = _require.Plugin;

var Translator = require('@uppy/utils/lib/Translator');

var _require2 = require('preact'),
    h = _require2.h;

var _require3 = require('@uppy/companion-client'),
    RequestClient = _require3.RequestClient;

var UrlUI = require('./UrlUI.js');
var toArray = require('@uppy/utils/lib/toArray');

/**
 * Url
 *
 */
module.exports = function (_Plugin) {
  _inherits(Url, _Plugin);

  function Url(uppy, opts) {
    _classCallCheck(this, Url);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.id = _this.opts.id || 'Url';
    _this.title = _this.opts.title || 'Link';
    _this.type = 'acquirer';
    _this.icon = function () {
      return h(
        'svg',
        { 'aria-hidden': 'true', width: '23', height: '23', viewBox: '0 0 23 23', xmlns: 'http://www.w3.org/2000/svg' },
        h('path', { d: 'M20.485 11.236l-2.748 2.737c-.184.182-.367.365-.642.547-1.007.73-2.107 1.095-3.298 1.095-1.65 0-3.298-.73-4.398-2.19-.275-.365-.183-1.003.183-1.277.367-.273 1.008-.182 1.283.183 1.191 1.642 3.482 1.915 5.13.73a.714.714 0 0 0 .367-.365l2.75-2.737c1.373-1.46 1.373-3.74-.093-5.108a3.72 3.72 0 0 0-5.13 0L12.33 6.4a.888.888 0 0 1-1.283 0 .88.88 0 0 1 0-1.277l1.558-1.55a5.38 5.38 0 0 1 7.605 0c2.29 2.006 2.382 5.564.274 7.662zm-8.979 6.294L9.95 19.081a3.72 3.72 0 0 1-5.13 0c-1.467-1.368-1.467-3.74-.093-5.108l2.75-2.737.366-.365c.824-.547 1.74-.82 2.748-.73 1.008.183 1.833.639 2.382 1.46.275.365.917.456 1.283.182.367-.273.458-.912.183-1.277-.916-1.186-2.199-1.915-3.573-2.098-1.374-.273-2.84.091-4.031 1.004l-.55.547-2.749 2.737c-2.107 2.189-2.015 5.655.092 7.753C4.727 21.453 6.101 22 7.475 22c1.374 0 2.749-.547 3.848-1.55l1.558-1.551a.88.88 0 0 0 0-1.278c-.367-.364-1.008-.456-1.375-.09z', fill: '#FF814F', 'fill-rule': 'nonzero' })
      );
    };

    // Set default options and locale
    var defaultLocale = {
      strings: {
        import: 'Import',
        enterUrlToImport: 'Enter URL to import a file',
        failedToFetch: 'Companion failed to fetch this URL, please make sure it’s correct',
        enterCorrectUrl: 'Incorrect URL: Please make sure you are entering a direct link to a file'
      }
    };

    var defaultOptions = {
      locale: defaultLocale
    };

    _this.opts = _extends({}, defaultOptions, opts);

    // i18n
    _this.translator = new Translator([defaultLocale, _this.uppy.locale, _this.opts.locale]);
    _this.i18n = _this.translator.translate.bind(_this.translator);
    _this.i18nArray = _this.translator.translateArray.bind(_this.translator);

    _this.hostname = _this.opts.serverUrl;

    if (!_this.hostname) {
      throw new Error('Companion hostname is required, please consult https://uppy.io/docs/companion');
    }

    // Bind all event handlers for referencability
    _this.getMeta = _this.getMeta.bind(_this);
    _this.addFile = _this.addFile.bind(_this);
    _this.handleDrop = _this.handleDrop.bind(_this);
    _this.handleDragOver = _this.handleDragOver.bind(_this);
    _this.handleDragLeave = _this.handleDragLeave.bind(_this);

    _this.handlePaste = _this.handlePaste.bind(_this);

    _this.client = new RequestClient(uppy, {
      serverUrl: _this.opts.serverUrl,
      serverHeaders: _this.opts.serverHeaders
    });
    return _this;
  }

  Url.prototype.getFileNameFromUrl = function getFileNameFromUrl(url) {
    return url.substring(url.lastIndexOf('/') + 1);
  };

  Url.prototype.checkIfCorrectURL = function checkIfCorrectURL(url) {
    if (!url) return false;

    var protocol = url.match(/^([a-z0-9]+):\/\//)[1];
    if (protocol !== 'http' && protocol !== 'https') {
      return false;
    }

    return true;
  };

  Url.prototype.addProtocolToURL = function addProtocolToURL(url) {
    var protocolRegex = /^[a-z0-9]+:\/\//;
    var defaultProtocol = 'http://';
    if (protocolRegex.test(url)) {
      return url;
    }

    return defaultProtocol + url;
  };

  Url.prototype.getMeta = function getMeta(url) {
    var _this2 = this;

    return this.client.post('url/meta', { url: url }).then(function (res) {
      if (res.error) {
        _this2.uppy.log('[URL] Error:');
        _this2.uppy.log(res.error);
        throw new Error('Failed to fetch the file');
      }
      return res;
    });
  };

  Url.prototype.addFile = function addFile(url) {
    var _this3 = this;

    url = this.addProtocolToURL(url);
    if (!this.checkIfCorrectURL(url)) {
      this.uppy.log('[URL] Incorrect URL entered: ' + url);
      this.uppy.info(this.i18n('enterCorrectUrl'), 'error', 4000);
      return;
    }

    return this.getMeta(url).then(function (meta) {
      var tagFile = {
        source: _this3.id,
        name: _this3.getFileNameFromUrl(url),
        type: meta.type,
        data: {
          size: meta.size
        },
        isRemote: true,
        body: {
          url: url
        },
        remote: {
          serverUrl: _this3.opts.serverUrl,
          url: _this3.hostname + '/url/get',
          body: {
            fileId: url,
            url: url
          },
          providerOptions: _this3.client.opts
        }
      };
      return tagFile;
    }).then(function (tagFile) {
      _this3.uppy.log('[Url] Adding remote file');
      try {
        _this3.uppy.addFile(tagFile);
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    }).then(function () {
      // Close the Dashboard panel if plugin is installed
      // into Dashboard (could be other parent UI plugin)
      // if (this.parent && this.parent.hideAllPanels) {
      //   this.parent.hideAllPanels()
      // }
    }).catch(function (err) {
      _this3.uppy.log(err);
      _this3.uppy.info({
        message: _this3.i18n('failedToFetch'),
        details: err
      }, 'error', 4000);
    });
  };

  Url.prototype.handleDrop = function handleDrop(e) {
    var _this4 = this;

    e.preventDefault();
    if (e.dataTransfer.items) {
      var items = toArray(e.dataTransfer.items);
      items.forEach(function (item) {
        if (item.kind === 'string' && item.type === 'text/uri-list') {
          item.getAsString(function (url) {
            _this4.uppy.log('[URL] Adding file from dropped url: ' + url);
            _this4.addFile(url);
          });
        }
      });
    }
  };

  Url.prototype.handleDragOver = function handleDragOver(e) {
    e.preventDefault();
    this.el.classList.add('drag');
  };

  Url.prototype.handleDragLeave = function handleDragLeave(e) {
    e.preventDefault();
    this.el.classList.remove('drag');
  };

  Url.prototype.handlePaste = function handlePaste(e) {
    var _this5 = this;

    if (!e.clipboardData.items) {
      return;
    }
    var items = toArray(e.clipboardData.items);

    // When a file is pasted, it appears as two items: file name string, then
    // the file itself; Url then treats file name string as URL, which is wrong.
    // This makes sure Url ignores paste event if it contains an actual file
    var hasFiles = items.filter(function (item) {
      return item.kind === 'file';
    }).length > 0;
    if (hasFiles) return;

    items.forEach(function (item) {
      if (item.kind === 'string' && item.type === 'text/plain') {
        item.getAsString(function (url) {
          _this5.uppy.log('[URL] Adding file from pasted url: ' + url);
          _this5.addFile(url);
        });
      }
    });
  };

  Url.prototype.render = function render(state) {
    return h(UrlUI, {
      i18n: this.i18n,
      addFile: this.addFile });
  };

  Url.prototype.onMount = function onMount() {
    if (this.el) {
      this.el.addEventListener('drop', this.handleDrop);
      this.el.addEventListener('dragover', this.handleDragOver);
      this.el.addEventListener('dragleave', this.handleDragLeave);
      this.el.addEventListener('paste', this.handlePaste);
    }
  };

  Url.prototype.install = function install() {
    var target = this.opts.target;
    if (target) {
      this.mount(target, this);
    }
  };

  Url.prototype.uninstall = function uninstall() {
    if (this.el) {
      this.el.removeEventListener('drop', this.handleDrop);
      this.el.removeEventListener('dragover', this.handleDragOver);
      this.el.removeEventListener('dragleave', this.handleDragLeave);
      this.el.removeEventListener('paste', this.handlePaste);
    }

    this.unmount();
  };

  return Url;
}(Plugin);