var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * Check that Assembly parameters are present and include all required fields.
 */
function validateParams(params) {
  if (!params) {
    throw new Error('Transloadit: The `params` option is required.');
  }

  if (typeof params === 'string') {
    try {
      params = JSON.parse(params);
    } catch (err) {
      // Tell the user that this is not an Uppy bug!
      err.message = 'Transloadit: The `params` option is a malformed JSON string: ' + err.message;
      throw err;
    }
  }

  if (!params.auth || !params.auth.key) {
    throw new Error('Transloadit: The `params.auth.key` option is required. ' + 'You can find your Transloadit API key at https://transloadit.com/account/api-settings.');
  }
}

/**
 * Turn Transloadit plugin options and a list of files into a list of Assembly
 * options.
 */

var AssemblyOptions = function () {
  function AssemblyOptions(files, opts) {
    _classCallCheck(this, AssemblyOptions);

    this.files = files;
    this.opts = opts;
  }

  /**
   * Normalize Uppy-specific Assembly option features to a Transloadit-
   * compatible object.
   */


  AssemblyOptions.prototype._normalizeAssemblyOptions = function _normalizeAssemblyOptions(file, assemblyOptions) {
    if (Array.isArray(assemblyOptions.fields)) {
      var fieldNames = assemblyOptions.fields;
      assemblyOptions.fields = {};
      fieldNames.forEach(function (fieldName) {
        assemblyOptions.fields[fieldName] = file.meta[fieldName];
      });
    }

    if (!assemblyOptions.fields) {
      assemblyOptions.fields = {};
    }

    return assemblyOptions;
  };

  /**
   * Get Assembly options for a file.
   */


  AssemblyOptions.prototype._getAssemblyOptions = function _getAssemblyOptions(file) {
    var _this = this;

    var options = this.opts;

    return Promise.resolve().then(function () {
      return options.getAssemblyOptions(file, options);
    }).then(function (assemblyOptions) {
      return _this._normalizeAssemblyOptions(file, assemblyOptions);
    }).then(function (assemblyOptions) {
      validateParams(assemblyOptions.params);

      return {
        fileIDs: [file.id],
        options: assemblyOptions
      };
    });
  };

  /**
   * Combine Assemblies with the same options into a single Assembly for all the
   * relevant files.
   */


  AssemblyOptions.prototype._dedupe = function _dedupe(list) {
    var dedupeMap = Object.create(null);
    list.forEach(function (_ref) {
      var fileIDs = _ref.fileIDs,
          options = _ref.options;

      var id = JSON.stringify(options);
      if (dedupeMap[id]) {
        var _dedupeMap$id$fileIDs;

        (_dedupeMap$id$fileIDs = dedupeMap[id].fileIDs).push.apply(_dedupeMap$id$fileIDs, fileIDs);
      } else {
        dedupeMap[id] = {
          options: options,
          fileIDs: [].concat(fileIDs)
        };
      }
    });

    return Object.keys(dedupeMap).map(function (id) {
      return dedupeMap[id];
    });
  };

  /**
   * Generate a set of Assemblies that will handle the upload.
   * Returns a Promise for an object with keys:
   *  - fileIDs - an array of file IDs to add to this Assembly
   *  - options - Assembly options
   */


  AssemblyOptions.prototype.build = function build() {
    var _this2 = this;

    var options = this.opts;

    if (this.files.length > 0) {
      return Promise.all(this.files.map(function (file) {
        return _this2._getAssemblyOptions(file);
      })).then(function (list) {
        return _this2._dedupe(list);
      });
    }

    if (options.alwaysRunAssembly) {
      // No files, just generate one Assembly
      return Promise.resolve(options.getAssemblyOptions(null, options)).then(function (assemblyOptions) {
        validateParams(assemblyOptions.params);
        return [{
          fileIDs: _this2.files.map(function (file) {
            return file.id;
          }),
          options: assemblyOptions
        }];
      });
    }

    // If there are no files and we do not `alwaysRunAssembly`,
    // don't do anything.
    return Promise.resolve([]);
  };

  return AssemblyOptions;
}();

module.exports = _extends(AssemblyOptions, { validateParams: validateParams });