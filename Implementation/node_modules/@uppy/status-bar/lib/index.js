var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('@uppy/core'),
    Plugin = _require.Plugin;

var Translator = require('@uppy/utils/lib/Translator');
var StatusBarUI = require('./StatusBar');
var statusBarStates = require('./StatusBarStates');
var getSpeed = require('@uppy/utils/lib/getSpeed');
var getBytesRemaining = require('@uppy/utils/lib/getBytesRemaining');

/**
 * StatusBar: renders a status bar with upload/pause/resume/cancel/retry buttons,
 * progress percentage and time remaining.
 */
module.exports = function (_Plugin) {
  _inherits(StatusBar, _Plugin);

  function StatusBar(uppy, opts) {
    _classCallCheck(this, StatusBar);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.id = _this.opts.id || 'StatusBar';
    _this.title = 'StatusBar';
    _this.type = 'progressindicator';

    var defaultLocale = {
      strings: {
        uploading: 'Uploading',
        upload: 'Upload',
        complete: 'Complete',
        uploadFailed: 'Upload failed',
        pleasePressRetry: 'Please press Retry to upload again',
        paused: 'Paused',
        error: 'Error',
        retry: 'Retry',
        cancel: 'Cancel',
        pause: 'Pause',
        resume: 'Resume',
        pressToRetry: 'Press to retry',
        // retryUpload: 'Retry upload',
        // resumeUpload: 'Resume upload',
        // cancelUpload: 'Cancel upload',
        // pauseUpload: 'Pause upload',
        filesUploadedOfTotal: {
          0: '%{complete} of %{smart_count} file uploaded',
          1: '%{complete} of %{smart_count} files uploaded'
        },
        dataUploadedOfTotal: '%{complete} of %{total}',
        xTimeLeft: '%{time} left',
        uploadXFiles: {
          0: 'Upload %{smart_count} file',
          1: 'Upload %{smart_count} files'
        },
        uploadXNewFiles: {
          0: 'Upload +%{smart_count} file',
          1: 'Upload +%{smart_count} files'
        },
        xMoreFilesAdded: {
          0: '%{smart_count} more file added',
          1: '%{smart_count} more files added'
        }
      }

      // set default options
    };var defaultOptions = {
      target: 'body',
      hideUploadButton: false,
      hideRetryButton: false,
      hidePauseResumeButton: false,
      hideCancelButton: false,
      showProgressDetails: false,
      locale: defaultLocale,
      hideAfterFinish: true

      // merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOptions, opts);

    _this.translator = new Translator([defaultLocale, _this.uppy.locale, _this.opts.locale]);
    _this.i18n = _this.translator.translate.bind(_this.translator);

    _this.startUpload = _this.startUpload.bind(_this);
    _this.render = _this.render.bind(_this);
    _this.install = _this.install.bind(_this);
    return _this;
  }

  StatusBar.prototype.getTotalSpeed = function getTotalSpeed(files) {
    var totalSpeed = 0;
    files.forEach(function (file) {
      totalSpeed = totalSpeed + getSpeed(file.progress);
    });
    return totalSpeed;
  };

  StatusBar.prototype.getTotalETA = function getTotalETA(files) {
    var totalSpeed = this.getTotalSpeed(files);
    if (totalSpeed === 0) {
      return 0;
    }

    var totalBytesRemaining = files.reduce(function (total, file) {
      return total + getBytesRemaining(file.progress);
    }, 0);

    return Math.round(totalBytesRemaining / totalSpeed * 10) / 10;
  };

  StatusBar.prototype.startUpload = function startUpload() {
    var _this2 = this;

    return this.uppy.upload().catch(function (err) {
      _this2.uppy.log(err.stack || err.message || err);
      // Ignore
    });
  };

  StatusBar.prototype.getUploadingState = function getUploadingState(isAllErrored, isAllComplete, files) {
    if (isAllErrored) {
      return statusBarStates.STATE_ERROR;
    }

    if (isAllComplete) {
      return statusBarStates.STATE_COMPLETE;
    }

    var state = statusBarStates.STATE_WAITING;
    var fileIDs = Object.keys(files);
    for (var i = 0; i < fileIDs.length; i++) {
      var progress = files[fileIDs[i]].progress;
      // If ANY files are being uploaded right now, show the uploading state.
      if (progress.uploadStarted && !progress.uploadComplete) {
        return statusBarStates.STATE_UPLOADING;
      }
      // If files are being preprocessed AND postprocessed at this time, we show the
      // preprocess state. If any files are being uploaded we show uploading.
      if (progress.preprocess && state !== statusBarStates.STATE_UPLOADING) {
        state = statusBarStates.STATE_PREPROCESSING;
      }
      // If NO files are being preprocessed or uploaded right now, but some files are
      // being postprocessed, show the postprocess state.
      if (progress.postprocess && state !== statusBarStates.STATE_UPLOADING && state !== statusBarStates.STATE_PREPROCESSING) {
        state = statusBarStates.STATE_POSTPROCESSING;
      }
    }
    return state;
  };

  StatusBar.prototype.render = function render(state) {
    var capabilities = state.capabilities,
        files = state.files,
        allowNewUpload = state.allowNewUpload,
        totalProgress = state.totalProgress,
        error = state.error;

    // TODO: move this to Core, to share between Status Bar and Dashboard
    // (and any other plugin that might need it, too)

    var newFiles = Object.keys(files).filter(function (file) {
      return !files[file].progress.uploadStarted && !files[file].progress.preprocess && !files[file].progress.postprocess;
    });

    var uploadStartedFiles = Object.keys(files).filter(function (file) {
      return files[file].progress.uploadStarted;
    });

    var pausedFiles = uploadStartedFiles.filter(function (file) {
      return files[file].isPaused;
    });

    var completeFiles = Object.keys(files).filter(function (file) {
      return files[file].progress.uploadComplete;
    });

    var erroredFiles = Object.keys(files).filter(function (file) {
      return files[file].error;
    });

    var inProgressFiles = Object.keys(files).filter(function (file) {
      return !files[file].progress.uploadComplete && files[file].progress.uploadStarted;
    });

    var inProgressNotPausedFiles = inProgressFiles.filter(function (file) {
      return !files[file].isPaused;
    });

    var startedFiles = Object.keys(files).filter(function (file) {
      return files[file].progress.uploadStarted || files[file].progress.preprocess || files[file].progress.postprocess;
    });

    var processingFiles = Object.keys(files).filter(function (file) {
      return files[file].progress.preprocess || files[file].progress.postprocess;
    });

    var inProgressNotPausedFilesArray = inProgressNotPausedFiles.map(function (file) {
      return files[file];
    });

    var totalETA = this.getTotalETA(inProgressNotPausedFilesArray);

    // total size and uploaded size
    var totalSize = 0;
    var totalUploadedSize = 0;
    inProgressNotPausedFilesArray.forEach(function (file) {
      totalSize = totalSize + (file.progress.bytesTotal || 0);
      totalUploadedSize = totalUploadedSize + (file.progress.bytesUploaded || 0);
    });

    var isUploadStarted = uploadStartedFiles.length > 0;

    var isAllComplete = totalProgress === 100 && completeFiles.length === Object.keys(files).length && processingFiles.length === 0;

    var isAllErrored = isUploadStarted && erroredFiles.length === uploadStartedFiles.length;

    var isAllPaused = inProgressFiles.length !== 0 && pausedFiles.length === inProgressFiles.length;
    // const isAllPaused = inProgressFiles.length === 0 &&
    //   !isAllComplete &&
    //   !isAllErrored &&
    //   uploadStartedFiles.length > 0

    var isUploadInProgress = inProgressFiles.length > 0;

    var resumableUploads = capabilities.resumableUploads || false;

    return StatusBarUI({
      error: error,
      uploadState: this.getUploadingState(isAllErrored, isAllComplete, state.files || {}),
      allowNewUpload: allowNewUpload,
      totalProgress: totalProgress,
      totalSize: totalSize,
      totalUploadedSize: totalUploadedSize,
      isAllComplete: isAllComplete,
      isAllPaused: isAllPaused,
      isAllErrored: isAllErrored,
      isUploadStarted: isUploadStarted,
      isUploadInProgress: isUploadInProgress,
      complete: completeFiles.length,
      newFiles: newFiles.length,
      numUploads: startedFiles.length,
      totalETA: totalETA,
      files: files,
      i18n: this.i18n,
      pauseAll: this.uppy.pauseAll,
      resumeAll: this.uppy.resumeAll,
      retryAll: this.uppy.retryAll,
      cancelAll: this.uppy.cancelAll,
      startUpload: this.startUpload,
      resumableUploads: resumableUploads,
      showProgressDetails: this.opts.showProgressDetails,
      hideUploadButton: this.opts.hideUploadButton,
      hideRetryButton: this.opts.hideRetryButton,
      hidePauseResumeButton: this.opts.hidePauseResumeButton,
      hideCancelButton: this.opts.hideCancelButton,
      hideAfterFinish: this.opts.hideAfterFinish,
      isTargetDOMEl: this.isTargetDOMEl
    });
  };

  StatusBar.prototype.install = function install() {
    var target = this.opts.target;
    if (target) {
      this.mount(target, this);
    }
  };

  StatusBar.prototype.uninstall = function uninstall() {
    this.unmount();
  };

  return StatusBar;
}(Plugin);