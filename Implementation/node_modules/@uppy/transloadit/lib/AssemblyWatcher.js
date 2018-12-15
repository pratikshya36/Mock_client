function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Emitter = require('component-emitter');

/**
 * Track completion of multiple assemblies.
 *
 * Emits 'assembly-complete' when an assembly completes.
 * Emits 'assembly-error' when an assembly fails.
 * Exposes a `.promise` property that resolves when all assemblies have
 * completed (or failed).
 */

var TransloaditAssemblyWatcher = function (_Emitter) {
  _inherits(TransloaditAssemblyWatcher, _Emitter);

  function TransloaditAssemblyWatcher(uppy, assemblyIDs) {
    _classCallCheck(this, TransloaditAssemblyWatcher);

    var _this = _possibleConstructorReturn(this, _Emitter.call(this));

    _this._uppy = uppy;
    _this._assemblyIDs = assemblyIDs;
    _this._remaining = assemblyIDs.length;

    _this.promise = new Promise(function (resolve, reject) {
      _this._resolve = resolve;
      _this._reject = reject;
    });

    _this._onAssemblyComplete = _this._onAssemblyComplete.bind(_this);
    _this._onAssemblyError = _this._onAssemblyError.bind(_this);
    _this._onImportError = _this._onImportError.bind(_this);

    _this._addListeners();
    return _this;
  }

  /**
   * Are we watching this assembly ID?
   */


  TransloaditAssemblyWatcher.prototype._watching = function _watching(id) {
    return this._assemblyIDs.indexOf(id) !== -1;
  };

  TransloaditAssemblyWatcher.prototype._onAssemblyComplete = function _onAssemblyComplete(assembly) {
    if (!this._watching(assembly.assembly_id)) {
      return;
    }

    this._uppy.log('[Transloadit] AssemblyWatcher: Got Assembly finish ' + assembly.assembly_id);

    this.emit('assembly-complete', assembly.assembly_id);

    this._checkAllComplete();
  };

  TransloaditAssemblyWatcher.prototype._onAssemblyError = function _onAssemblyError(assembly, error) {
    if (!this._watching(assembly.assembly_id)) {
      return;
    }

    this._uppy.log('[Transloadit] AssemblyWatcher: Got Assembly error ' + assembly.assembly_id);
    this._uppy.log(error);

    this.emit('assembly-error', assembly.assembly_id, error);

    this._checkAllComplete();
  };

  TransloaditAssemblyWatcher.prototype._onImportError = function _onImportError(assembly, fileID, error) {
    if (!this._watching(assembly.assembly_id)) {
      return;
    }

    // Not sure if we should be doing something when it's just one file failing.
    // ATM, the only options are 1) ignoring or 2) failing the entire upload.
    // I think failing the upload is better than silently ignoring.
    // In the future we should maybe have a way to resolve uploads with some failures,
    // like returning an object with `{ successful, failed }` uploads.
    this._onAssemblyError(assembly, error);
  };

  TransloaditAssemblyWatcher.prototype._checkAllComplete = function _checkAllComplete() {
    this._remaining -= 1;
    if (this._remaining === 0) {
      // We're done, these listeners can be removed
      this._removeListeners();
      this._resolve();
    }
  };

  TransloaditAssemblyWatcher.prototype._removeListeners = function _removeListeners() {
    this._uppy.off('transloadit:complete', this._onAssemblyComplete);
    this._uppy.off('transloadit:assembly-error', this._onAssemblyError);
    this._uppy.off('transloadit:import-error', this._onImportError);
  };

  TransloaditAssemblyWatcher.prototype._addListeners = function _addListeners() {
    this._uppy.on('transloadit:complete', this._onAssemblyComplete);
    this._uppy.on('transloadit:assembly-error', this._onAssemblyError);
    this._uppy.on('transloadit:import-error', this._onImportError);
  };

  return TransloaditAssemblyWatcher;
}(Emitter);

module.exports = TransloaditAssemblyWatcher;