var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Translator = require('@uppy/utils/lib/Translator');

var _require = require('@uppy/core'),
    Plugin = _require.Plugin;

var Tus = require('@uppy/tus');
var Assembly = require('./Assembly');
var Client = require('./Client');
var AssemblyOptions = require('./AssemblyOptions');
var AssemblyWatcher = require('./AssemblyWatcher');

function defaultGetAssemblyOptions(file, options) {
  return {
    params: options.params,
    signature: options.signature,
    fields: options.fields
  };
}

var COMPANION = 'https://api2.transloadit.com/companion';
// Regex matching acceptable postMessage() origins for authentication feedback from companion.
var ALLOWED_COMPANION_PATTERN = /\.transloadit\.com$/;
// Regex used to check if a Companion address is run by Transloadit.
var TL_COMPANION = /https?:\/\/api2(?:-\w+)?\.transloadit\.com\/companion/;
var TL_UPPY_SERVER = /https?:\/\/api2(?:-\w+)?\.transloadit\.com\/uppy-server/;

/**
 * Upload files to Transloadit using Tus.
 */
module.exports = function (_Plugin) {
  _inherits(Transloadit, _Plugin);

  function Transloadit(uppy, opts) {
    _classCallCheck(this, Transloadit);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.type = 'uploader';
    _this.id = 'Transloadit';
    _this.title = 'Transloadit';

    var defaultLocale = {
      strings: {
        creatingAssembly: 'Preparing upload...',
        creatingAssemblyFailed: 'Transloadit: Could not create Assembly',
        encoding: 'Encoding...'
      }
    };

    var defaultOptions = {
      service: 'https://api2.transloadit.com',
      waitForEncoding: false,
      waitForMetadata: false,
      alwaysRunAssembly: false,
      importFromUploadURLs: false,
      signature: null,
      params: null,
      fields: {},
      getAssemblyOptions: defaultGetAssemblyOptions,
      locale: defaultLocale
    };

    _this.opts = _extends({}, defaultOptions, opts);

    // i18n
    _this.translator = new Translator([defaultLocale, _this.uppy.locale, _this.opts.locale]);
    _this.i18n = _this.translator.translate.bind(_this.translator);
    _this.i18nArray = _this.translator.translateArray.bind(_this.translator);

    _this._prepareUpload = _this._prepareUpload.bind(_this);
    _this._afterUpload = _this._afterUpload.bind(_this);
    _this._handleError = _this._handleError.bind(_this);
    _this._onFileUploadURLAvailable = _this._onFileUploadURLAvailable.bind(_this);
    _this._onRestored = _this._onRestored.bind(_this);
    _this._getPersistentData = _this._getPersistentData.bind(_this);

    var hasCustomAssemblyOptions = _this.opts.getAssemblyOptions !== defaultOptions.getAssemblyOptions;
    if (_this.opts.params) {
      AssemblyOptions.validateParams(_this.opts.params);
    } else if (!hasCustomAssemblyOptions) {
      // Throw the same error that we'd throw if the `params` returned from a
      // `getAssemblyOptions()` function is null.
      AssemblyOptions.validateParams(null);
    }

    _this.client = new Client({
      service: _this.opts.service
    });
    // Contains Assembly instances for in-progress Assemblies.
    _this.activeAssemblies = {};
    return _this;
  }

  /**
   * Attach metadata to files to configure the Tus plugin to upload to Transloadit.
   * Also use Transloadit's Companion
   *
   * See: https://github.com/tus/tusd/wiki/Uploading-to-Transloadit-using-tus#uploading-using-tus
   *
   * @param {Object} file
   * @param {Object} status
   */


  Transloadit.prototype._attachAssemblyMetadata = function _attachAssemblyMetadata(file, status) {
    // Add the metadata parameters Transloadit needs.
    var meta = _extends({}, file.meta, {
      assembly_url: status.assembly_url,
      filename: file.name,
      fieldname: 'file'
      // Add Assembly-specific Tus endpoint.
    });var tus = _extends({}, file.tus, {
      endpoint: status.tus_url

      // Set Companion location. We only add this, if 'file' has the attribute
      // remote, because this is the criteria to identify remote files.
      // We only replace the hostname for Transloadit's companions, so that
      // people can also self-host them while still using Transloadit for encoding.
    });var remote = file.remote;
    if (file.remote && TL_UPPY_SERVER.test(file.remote.serverUrl)) {
      var err = new Error('The https://api2.transloadit.com/uppy-server endpoint was renamed to ' + 'https://api2.transloadit.com/companion, please update your `serverUrl` ' + 'options accordingly.');
      // Explicitly log this error here because it is caught by the `createAssembly`
      // Promise further along.
      // That's fine, but createAssembly only shows the informer, we need something a
      // little more noisy.
      this.uppy.log(err);
      throw err;
    }

    if (file.remote && TL_COMPANION.test(file.remote.serverUrl)) {
      var newHost = status.companion_url.replace(/\/$/, '');
      var path = file.remote.url.replace(file.remote.serverUrl, '').replace(/^\//, '');

      remote = _extends({}, file.remote, {
        serverUrl: newHost,
        url: newHost + '/' + path
      });
    }

    // Store the Assembly ID this file is in on the file under the `transloadit` key.
    var newFile = _extends({}, file, {
      transloadit: {
        assembly: status.assembly_id
      }
      // Only configure the Tus plugin if we are uploading straight to Transloadit (the default).
    });if (!this.opts.importFromUploadURLs) {
      _extends(newFile, { meta: meta, tus: tus, remote: remote });
    }
    return newFile;
  };

  Transloadit.prototype._createAssembly = function _createAssembly(fileIDs, uploadID, options) {
    var _this2 = this;

    this.uppy.log('[Transloadit] create Assembly');

    return this.client.createAssembly({
      params: options.params,
      fields: options.fields,
      expectedFiles: fileIDs.length,
      signature: options.signature
    }).then(function (newAssembly) {
      var _extends2, _extends3;

      var assembly = new Assembly(newAssembly);
      var status = assembly.status;

      var _getPluginState = _this2.getPluginState(),
          assemblies = _getPluginState.assemblies,
          uploadsAssemblies = _getPluginState.uploadsAssemblies;

      _this2.setPluginState({
        // Store the Assembly status.
        assemblies: _extends({}, assemblies, (_extends2 = {}, _extends2[status.assembly_id] = status, _extends2)),
        // Store the list of Assemblies related to this upload.
        uploadsAssemblies: _extends({}, uploadsAssemblies, (_extends3 = {}, _extends3[uploadID] = [].concat(uploadsAssemblies[uploadID], [status.assembly_id]), _extends3))
      });

      var _uppy$getState = _this2.uppy.getState(),
          files = _uppy$getState.files;

      var updatedFiles = {};
      fileIDs.forEach(function (id) {
        updatedFiles[id] = _this2._attachAssemblyMetadata(_this2.uppy.getFile(id), status);
      });
      _this2.uppy.setState({
        files: _extends({}, files, updatedFiles)
      });

      _this2.uppy.emit('transloadit:assembly-created', status, fileIDs);

      _this2._connectAssembly(assembly);

      _this2.uppy.log('[Transloadit] Created Assembly ' + status.assembly_id);
      return assembly;
    }).catch(function (err) {
      err.message = _this2.i18n('creatingAssemblyFailed') + ': ' + err.message;

      // Reject the promise.
      throw err;
    });
  };

  Transloadit.prototype._shouldWaitAfterUpload = function _shouldWaitAfterUpload() {
    return this.opts.waitForEncoding || this.opts.waitForMetadata;
  };

  /**
   * Used when `importFromUploadURLs` is enabled: reserves all files in
   * the Assembly.
   */


  Transloadit.prototype._reserveFiles = function _reserveFiles(assembly, fileIDs) {
    var _this3 = this;

    return Promise.all(fileIDs.map(function (fileID) {
      var file = _this3.uppy.getFile(fileID);
      return _this3.client.reserveFile(assembly, file);
    }));
  };

  /**
   * Used when `importFromUploadURLs` is enabled: adds files to the Assembly
   * once they have been fully uploaded.
   */


  Transloadit.prototype._onFileUploadURLAvailable = function _onFileUploadURLAvailable(file) {
    var _this4 = this;

    if (!file || !file.transloadit || !file.transloadit.assembly) {
      return;
    }

    var _getPluginState2 = this.getPluginState(),
        assemblies = _getPluginState2.assemblies;

    var assembly = assemblies[file.transloadit.assembly];

    this.client.addFile(assembly, file).catch(function (err) {
      _this4.uppy.log(err);
      _this4.uppy.emit('transloadit:import-error', assembly, file.id, err);
    });
  };

  Transloadit.prototype._findFile = function _findFile(uploadedFile) {
    var files = this.uppy.getFiles();
    for (var i = 0; i < files.length; i++) {
      var file = files[i];
      // Completed file upload.
      if (file.uploadURL === uploadedFile.tus_upload_url) {
        return file;
      }
      // In-progress file upload.
      if (file.tus && file.tus.uploadUrl === uploadedFile.tus_upload_url) {
        return file;
      }
      if (!uploadedFile.is_tus_file) {
        // Fingers-crossed check for non-tus uploads, eg imported from S3.
        if (file.name === uploadedFile.name && file.size === uploadedFile.size) {
          return file;
        }
      }
    }
  };

  Transloadit.prototype._onFileUploadComplete = function _onFileUploadComplete(assemblyId, uploadedFile) {
    var _extends4;

    var state = this.getPluginState();
    var file = this._findFile(uploadedFile);
    if (!file) {
      this.uppy.log('[Transloadit] Couldn’t file the file, it was likely removed in the process');
      return;
    }
    this.setPluginState({
      files: _extends({}, state.files, (_extends4 = {}, _extends4[uploadedFile.id] = {
        assembly: assemblyId,
        id: file.id,
        uploadedFile: uploadedFile
      }, _extends4))
    });
    this.uppy.emit('transloadit:upload', uploadedFile, this.getAssembly(assemblyId));
  };

  /**
   * Callback when a new Assembly result comes in.
   *
   * @param {string} assemblyId
   * @param {string} stepName
   * @param {Object} result
   */


  Transloadit.prototype._onResult = function _onResult(assemblyId, stepName, result) {
    var state = this.getPluginState();
    var file = state.files[result.original_id];
    // The `file` may not exist if an import robot was used instead of a file upload.
    result.localId = file ? file.id : null;

    var entry = {
      result: result,
      stepName: stepName,
      id: result.id,
      assembly: assemblyId
    };

    this.setPluginState({
      results: [].concat(state.results, [entry])
    });
    this.uppy.emit('transloadit:result', stepName, result, this.getAssembly(assemblyId));
  };

  /**
   * When an Assembly has finished processing, get the final state
   * and emit it.
   *
   * @param {Object} status
   */


  Transloadit.prototype._onAssemblyFinished = function _onAssemblyFinished(status) {
    var _this5 = this;

    var url = status.assembly_ssl_url;
    this.client.getAssemblyStatus(url).then(function (finalStatus) {
      var _extends5;

      var state = _this5.getPluginState();
      _this5.setPluginState({
        assemblies: _extends({}, state.assemblies, (_extends5 = {}, _extends5[finalStatus.assembly_id] = finalStatus, _extends5))
      });
      _this5.uppy.emit('transloadit:complete', finalStatus);
    });
  };

  /**
   * Custom state serialization for the Golden Retriever plugin.
   * It will pass this back to the `_onRestored` function.
   *
   * @param {function} setData
   */


  Transloadit.prototype._getPersistentData = function _getPersistentData(setData) {
    var _setData;

    var state = this.getPluginState();
    var assemblies = state.assemblies;
    var uploadsAssemblies = state.uploadsAssemblies;

    setData((_setData = {}, _setData[this.id] = {
      assemblies: assemblies,
      uploadsAssemblies: uploadsAssemblies
    }, _setData));
  };

  Transloadit.prototype._onRestored = function _onRestored(pluginData) {
    var _this6 = this;

    var savedState = pluginData && pluginData[this.id] ? pluginData[this.id] : {};
    var previousAssemblies = savedState.assemblies || {};
    var uploadsAssemblies = savedState.uploadsAssemblies || {};

    if (Object.keys(uploadsAssemblies).length === 0) {
      // Nothing to restore.
      return;
    }

    // Convert loaded Assembly statuses to a Transloadit plugin state object.
    var restoreState = function restoreState(assemblies) {
      var files = {};
      var results = [];
      Object.keys(assemblies).forEach(function (id) {
        var status = assemblies[id];

        status.uploads.forEach(function (uploadedFile) {
          var file = _this6._findFile(uploadedFile);
          files[uploadedFile.id] = {
            id: file.id,
            assembly: id,
            uploadedFile: uploadedFile
          };
        });

        var state = _this6.getPluginState();
        Object.keys(status.results).forEach(function (stepName) {
          status.results[stepName].forEach(function (result) {
            var file = state.files[result.original_id];
            result.localId = file ? file.id : null;
            results.push({
              id: result.id,
              result: result,
              stepName: stepName,
              assembly: id
            });
          });
        });
      });

      _this6.setPluginState({
        assemblies: assemblies,
        files: files,
        results: results,
        uploadsAssemblies: uploadsAssemblies
      });
    };

    // Set up the Assembly instances for existing Assemblies.
    var restoreAssemblies = function restoreAssemblies() {
      var _getPluginState3 = _this6.getPluginState(),
          assemblies = _getPluginState3.assemblies;

      Object.keys(assemblies).forEach(function (id) {
        var assembly = new Assembly(assemblies[id]);
        _this6._connectAssembly(assembly);
      });
    };

    // Force-update all Assemblies to check for missed events.
    var updateAssemblies = function updateAssemblies() {
      var _getPluginState4 = _this6.getPluginState(),
          assemblies = _getPluginState4.assemblies;

      return Promise.all(Object.keys(assemblies).map(function (id) {
        return _this6.activeAssemblies[id].update();
      }));
    };

    // Restore all Assembly state.
    this.restored = Promise.resolve().then(function () {
      restoreState(previousAssemblies);
      restoreAssemblies();
      return updateAssemblies();
    });

    this.restored.then(function () {
      _this6.restored = null;
    });
  };

  Transloadit.prototype._connectAssembly = function _connectAssembly(assembly) {
    var _this7 = this;

    var status = assembly.status;

    var id = status.assembly_id;
    this.activeAssemblies[id] = assembly;

    // Sync local `assemblies` state
    assembly.on('status', function (newStatus) {
      var _extends6;

      var _getPluginState5 = _this7.getPluginState(),
          assemblies = _getPluginState5.assemblies;

      _this7.setPluginState({
        assemblies: _extends({}, assemblies, (_extends6 = {}, _extends6[id] = newStatus, _extends6))
      });
    });

    assembly.on('upload', function (file) {
      _this7._onFileUploadComplete(id, file);
    });
    assembly.on('error', function (error) {
      _this7.uppy.emit('transloadit:assembly-error', assembly.status, error);
    });

    assembly.on('executing', function () {
      _this7.uppy.emit('transloadit:assembly-executing', assembly.status);
    });

    if (this.opts.waitForEncoding) {
      assembly.on('result', function (stepName, result) {
        _this7._onResult(id, stepName, result);
      });
    }

    if (this.opts.waitForEncoding) {
      assembly.on('finished', function () {
        _this7._onAssemblyFinished(assembly.status);
      });
    } else if (this.opts.waitForMetadata) {
      assembly.on('metadata', function () {
        _this7._onAssemblyFinished(assembly.status);
      });
    }

    // No need to connect to the socket if the Assembly has completed by now.
    if (assembly.ok === 'ASSEMBLY_COMPLETE') {
      return assembly;
    }

    // TODO Do we still need this for anything…?
    // eslint-disable-next-line no-unused-vars
    var connected = new Promise(function (resolve, reject) {
      assembly.once('connect', resolve);
      assembly.once('status', resolve);
      assembly.once('error', reject);
    }).then(function () {
      _this7.uppy.log('[Transloadit] Socket is ready');
    });

    assembly.connect();
    return assembly;
  };

  Transloadit.prototype._prepareUpload = function _prepareUpload(fileIDs, uploadID) {
    var _this8 = this,
        _extends7;

    // Only use files without errors
    fileIDs = fileIDs.filter(function (file) {
      return !file.error;
    });

    fileIDs.forEach(function (fileID) {
      var file = _this8.uppy.getFile(fileID);
      _this8.uppy.emit('preprocess-progress', file, {
        mode: 'indeterminate',
        message: _this8.i18n('creatingAssembly')
      });
    });

    var createAssembly = function createAssembly(_ref) {
      var fileIDs = _ref.fileIDs,
          options = _ref.options;

      return _this8._createAssembly(fileIDs, uploadID, options).then(function (assembly) {
        if (_this8.opts.importFromUploadURLs) {
          return _this8._reserveFiles(assembly, fileIDs);
        }
      }).then(function () {
        fileIDs.forEach(function (fileID) {
          var file = _this8.uppy.getFile(fileID);
          _this8.uppy.emit('preprocess-complete', file);
        });
      }).catch(function (err) {
        fileIDs.forEach(function (fileID) {
          var file = _this8.uppy.getFile(fileID);
          // Clear preprocessing state when the Assembly could not be created,
          // otherwise the UI gets confused about the lingering progress keys
          _this8.uppy.emit('preprocess-complete', file);
          _this8.uppy.emit('upload-error', file, err);
        });
        throw err;
      });
    };

    var _getPluginState6 = this.getPluginState(),
        uploadsAssemblies = _getPluginState6.uploadsAssemblies;

    this.setPluginState({
      uploadsAssemblies: _extends({}, uploadsAssemblies, (_extends7 = {}, _extends7[uploadID] = [], _extends7))
    });

    var files = fileIDs.map(function (id) {
      return _this8.uppy.getFile(id);
    });
    var assemblyOptions = new AssemblyOptions(files, this.opts);

    return assemblyOptions.build().then(function (assemblies) {
      return Promise.all(assemblies.map(createAssembly));
    },
    // If something went wrong before any Assemblies could be created,
    // clear all processing state.
    function (err) {
      fileIDs.forEach(function (fileID) {
        var file = _this8.uppy.getFile(fileID);
        _this8.uppy.emit('preprocess-complete', file);
        _this8.uppy.emit('upload-error', file, err);
      });
      throw err;
    });
  };

  Transloadit.prototype._afterUpload = function _afterUpload(fileIDs, uploadID) {
    var _this9 = this;

    // Only use files without errors
    fileIDs = fileIDs.filter(function (file) {
      return !file.error;
    });

    var state = this.getPluginState();

    // If we're still restoring state, wait for that to be done.
    if (this.restored) {
      return this.restored.then(function () {
        return _this9._afterUpload(fileIDs, uploadID);
      });
    }

    var assemblyIDs = state.uploadsAssemblies[uploadID];

    // If we don't have to wait for encoding metadata or results, we can close
    // the socket immediately and finish the upload.
    if (!this._shouldWaitAfterUpload()) {
      assemblyIDs.forEach(function (assemblyID) {
        var assembly = _this9.activeAssemblies[assemblyID];
        assembly.close();
        delete _this9.activeAssemblies[assemblyID];
      });
      var assemblies = assemblyIDs.map(function (id) {
        return _this9.getAssembly(id);
      });
      this.uppy.addResultData(uploadID, { transloadit: assemblies });
      return Promise.resolve();
    }

    // If no Assemblies were created for this upload, we also do not have to wait.
    // There's also no sockets or anything to close, so just return immediately.
    if (assemblyIDs.length === 0) {
      this.uppy.addResultData(uploadID, { transloadit: [] });
      return Promise.resolve();
    }

    // AssemblyWatcher tracks completion state of all Assemblies in this upload.
    var watcher = new AssemblyWatcher(this.uppy, assemblyIDs);

    fileIDs.forEach(function (fileID) {
      var file = _this9.uppy.getFile(fileID);
      _this9.uppy.emit('postprocess-progress', file, {
        mode: 'indeterminate',
        message: _this9.i18n('encoding')
      });
    });

    watcher.on('assembly-complete', function (id) {
      var files = _this9.getAssemblyFiles(id);
      files.forEach(function (file) {
        _this9.uppy.emit('postprocess-complete', file);
      });
    });

    watcher.on('assembly-error', function (id, error) {
      // Clear postprocessing state for all our files.
      var files = _this9.getAssemblyFiles(id);
      files.forEach(function (file) {
        // TODO Maybe make a postprocess-error event here?
        _this9.uppy.emit('upload-error', file, error);

        _this9.uppy.emit('postprocess-complete', file);
      });
    });

    return watcher.promise.then(function () {
      var assemblies = assemblyIDs.map(function (id) {
        return _this9.getAssembly(id);
      });

      // Remove the Assembly ID list for this upload,
      // it's no longer going to be used anywhere.
      var state = _this9.getPluginState();
      var uploadsAssemblies = _extends({}, state.uploadsAssemblies);
      delete uploadsAssemblies[uploadID];
      _this9.setPluginState({ uploadsAssemblies: uploadsAssemblies });

      _this9.uppy.addResultData(uploadID, {
        transloadit: assemblies
      });
    });
  };

  Transloadit.prototype._handleError = function _handleError(err, uploadID) {
    var _this10 = this;

    this.uppy.log('[Transloadit] _handleError in upload ' + uploadID);
    this.uppy.log(err);
    var state = this.getPluginState();
    var assemblyIDs = state.uploadsAssemblies[uploadID];

    assemblyIDs.forEach(function (assemblyID) {
      if (_this10.activeAssemblies[assemblyID]) {
        _this10.activeAssemblies[assemblyID].close();
      }
    });
  };

  Transloadit.prototype.install = function install() {
    this.uppy.addPreProcessor(this._prepareUpload);
    this.uppy.addPostProcessor(this._afterUpload);

    // We may need to close socket.io connections on error.
    this.uppy.on('error', this._handleError);

    if (this.opts.importFromUploadURLs) {
      // No uploader needed when importing; instead we take the upload URL from an existing uploader.
      this.uppy.on('upload-success', this._onFileUploadURLAvailable);
    } else {
      this.uppy.use(Tus, {
        // Disable tus-js-client fingerprinting, otherwise uploading the same file at different times
        // will upload to the same Assembly.
        resume: false,
        // Disable Companion's retry optimisation; we need to change the endpoint on retry
        // so it can't just reuse the same tus.Upload instance server-side.
        useFastRemoteRetry: false,
        // Only send Assembly metadata to the tus endpoint.
        metaFields: ['assembly_url', 'filename', 'fieldname']
      });
    }

    this.uppy.on('restore:get-data', this._getPersistentData);
    this.uppy.on('restored', this._onRestored);

    this.setPluginState({
      // Contains Assembly status objects, indexed by their ID.
      assemblies: {},
      // Contains arrays of Assembly IDs, indexed by the upload ID that they belong to.
      uploadsAssemblies: {},
      // Contains file data from Transloadit, indexed by their Transloadit-assigned ID.
      files: {},
      // Contains result data from Transloadit.
      results: []
    });
  };

  Transloadit.prototype.uninstall = function uninstall() {
    this.uppy.removePreProcessor(this._prepareUpload);
    this.uppy.removePostProcessor(this._afterUpload);
    this.uppy.off('error', this._handleError);

    if (this.opts.importFromUploadURLs) {
      this.uppy.off('upload-success', this._onFileUploadURLAvailable);
    }
  };

  Transloadit.prototype.getAssembly = function getAssembly(id) {
    var state = this.getPluginState();
    return state.assemblies[id];
  };

  Transloadit.prototype.getAssemblyFiles = function getAssemblyFiles(assemblyID) {
    return this.uppy.getFiles().filter(function (file) {
      return file && file.transloadit && file.transloadit.assembly === assemblyID;
    });
  };

  return Transloadit;
}(Plugin);

module.exports.COMPANION = COMPANION;
module.exports.UPPY_SERVER = COMPANION;
module.exports.COMPANION_PATTERN = ALLOWED_COMPANION_PATTERN;