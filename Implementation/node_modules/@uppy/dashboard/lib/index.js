var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('@uppy/core'),
    Plugin = _require.Plugin;

var Translator = require('@uppy/utils/lib/Translator');
var dragDrop = require('drag-drop');
var DashboardUI = require('./components/Dashboard');
var StatusBar = require('@uppy/status-bar');
var Informer = require('@uppy/informer');
var ThumbnailGenerator = require('@uppy/thumbnail-generator');
var findAllDOMElements = require('@uppy/utils/lib/findAllDOMElements');
var toArray = require('@uppy/utils/lib/toArray');
// const prettyBytes = require('prettier-bytes')
var ResizeObserver = require('resize-observer-polyfill').default || require('resize-observer-polyfill');

var _require2 = require('./components/icons'),
    defaultTabIcon = _require2.defaultTabIcon;

// Some code for managing focus was adopted from https://github.com/ghosh/micromodal
// MIT licence, https://github.com/ghosh/micromodal/blob/master/LICENSE.md
// Copyright (c) 2017 Indrashish Ghosh


var FOCUSABLE_ELEMENTS = ['a[href]:not([tabindex^="-"]):not([inert]):not([aria-hidden])', 'area[href]:not([tabindex^="-"]):not([inert]):not([aria-hidden])', 'input:not([disabled]):not([inert]):not([aria-hidden])', 'select:not([disabled]):not([inert]):not([aria-hidden])', 'textarea:not([disabled]):not([inert]):not([aria-hidden])', 'button:not([disabled]):not([inert]):not([aria-hidden])', 'iframe:not([tabindex^="-"]):not([inert]):not([aria-hidden])', 'object:not([tabindex^="-"]):not([inert]):not([aria-hidden])', 'embed:not([tabindex^="-"]):not([inert]):not([aria-hidden])', '[contenteditable]:not([tabindex^="-"]):not([inert]):not([aria-hidden])', '[tabindex]:not([tabindex^="-"]):not([inert]):not([aria-hidden])'];

var TAB_KEY = 9;
var ESC_KEY = 27;

/**
 * Dashboard UI with previews, metadata editing, tabs for various services and more
 */
module.exports = function (_Plugin) {
  _inherits(Dashboard, _Plugin);

  function Dashboard(uppy, opts) {
    _classCallCheck(this, Dashboard);

    var _this = _possibleConstructorReturn(this, _Plugin.call(this, uppy, opts));

    _this.id = _this.opts.id || 'Dashboard';
    _this.title = 'Dashboard';
    _this.type = 'orchestrator';
    _this.modalName = 'uppy-Dashboard';

    var defaultLocale = {
      strings: {
        selectToUpload: 'Select files to upload',
        closeModal: 'Close Modal',
        upload: 'Upload',
        importFrom: 'Import from %{name}',
        addingMoreFiles: 'Adding more files',
        addMoreFiles: 'Add more files',
        dashboardWindowTitle: 'Uppy Dashboard Window (Press escape to close)',
        dashboardTitle: 'Uppy Dashboard',
        copyLinkToClipboardSuccess: 'Link copied to clipboard',
        copyLinkToClipboardFallback: 'Copy the URL below',
        copyLink: 'Copy link',
        fileSource: 'File source: %{name}',
        done: 'Done',
        back: 'Back',
        name: 'Name',
        removeFile: 'Remove file',
        editFile: 'Edit file',
        editing: 'Editing %{file}',
        edit: 'Edit',
        finishEditingFile: 'Finish editing file',
        saveChanges: 'Save changes',
        cancel: 'Cancel',
        localDisk: 'Local Disk',
        myDevice: 'My Device',
        dropPasteImport: 'Drop files here, paste, %{browse} or import from',
        dropPaste: 'Drop files here, paste or %{browse}',
        browse: 'browse',
        fileProgress: 'File progress: upload speed and ETA',
        numberOfSelectedFiles: 'Number of selected files',
        uploadAllNewFiles: 'Upload all new files',
        emptyFolderAdded: 'No files were added from empty folder',
        uploadComplete: 'Upload complete',
        uploadPaused: 'Upload paused',
        resumeUpload: 'Resume upload',
        pauseUpload: 'Pause upload',
        retryUpload: 'Retry upload',
        cancelUpload: 'Cancel upload',
        xFilesSelected: {
          0: '%{smart_count} file selected',
          1: '%{smart_count} files selected'
        },
        uploadXFiles: {
          0: 'Upload %{smart_count} file',
          1: 'Upload %{smart_count} files'
        },
        uploadingXFiles: {
          0: 'Uploading %{smart_count} file',
          1: 'Uploading %{smart_count} files'
        },
        processingXFiles: {
          0: 'Processing %{smart_count} file',
          1: 'Processing %{smart_count} files'
        },
        uploadXNewFiles: {
          0: 'Upload +%{smart_count} file',
          1: 'Upload +%{smart_count} files'
        },
        folderAdded: {
          0: 'Added %{smart_count} file from %{folder}',
          1: 'Added %{smart_count} files from %{folder}'
        }
      }

      // set default options
    };var defaultOptions = {
      target: 'body',
      metaFields: [],
      trigger: '#uppy-select-files',
      inline: false,
      width: 750,
      height: 550,
      thumbnailWidth: 280,
      defaultTabIcon: defaultTabIcon,
      showLinkToFileUploadResult: true,
      showProgressDetails: false,
      hideUploadButton: false,
      hideRetryButton: false,
      hidePauseResumeCancelButtons: false,
      hideProgressAfterFinish: false,
      note: null,
      closeModalOnClickOutside: false,
      closeAfterFinish: false,
      disableStatusBar: false,
      disableInformer: false,
      disableThumbnailGenerator: false,
      disablePageScrollWhenModalOpen: true,
      animateOpenClose: true,
      proudlyDisplayPoweredByUppy: true,
      onRequestCloseModal: function onRequestCloseModal() {
        return _this.closeModal();
      },
      showSelectedFiles: true,
      // locale: defaultLocale,
      browserBackButtonClose: false

      // merge default options with the ones set by user
    };_this.opts = _extends({}, defaultOptions, opts);

    // i18n
    _this.translator = new Translator([defaultLocale, _this.uppy.locale, _this.opts.locale]);
    _this.i18n = _this.translator.translate.bind(_this.translator);
    _this.i18nArray = _this.translator.translateArray.bind(_this.translator);

    _this.openModal = _this.openModal.bind(_this);
    _this.closeModal = _this.closeModal.bind(_this);
    _this.requestCloseModal = _this.requestCloseModal.bind(_this);
    _this.isModalOpen = _this.isModalOpen.bind(_this);

    _this.addTarget = _this.addTarget.bind(_this);
    _this.removeTarget = _this.removeTarget.bind(_this);
    _this.hideAllPanels = _this.hideAllPanels.bind(_this);
    _this.showPanel = _this.showPanel.bind(_this);
    _this.getFocusableNodes = _this.getFocusableNodes.bind(_this);
    _this.setFocusToFirstNode = _this.setFocusToFirstNode.bind(_this);
    _this.handlePopState = _this.handlePopState.bind(_this);
    _this.maintainFocus = _this.maintainFocus.bind(_this);

    _this.initEvents = _this.initEvents.bind(_this);
    _this.handleKeyDown = _this.handleKeyDown.bind(_this);
    _this.handleFileAdded = _this.handleFileAdded.bind(_this);
    _this.handleComplete = _this.handleComplete.bind(_this);
    _this.handleClickOutside = _this.handleClickOutside.bind(_this);
    _this.toggleFileCard = _this.toggleFileCard.bind(_this);
    _this.toggleAddFilesPanel = _this.toggleAddFilesPanel.bind(_this);
    _this.handleDrop = _this.handleDrop.bind(_this);
    _this.handlePaste = _this.handlePaste.bind(_this);
    _this.handleInputChange = _this.handleInputChange.bind(_this);
    _this.render = _this.render.bind(_this);
    _this.install = _this.install.bind(_this);
    return _this;
  }

  Dashboard.prototype.removeTarget = function removeTarget(plugin) {
    var pluginState = this.getPluginState();
    // filter out the one we want to remove
    var newTargets = pluginState.targets.filter(function (target) {
      return target.id !== plugin.id;
    });

    this.setPluginState({
      targets: newTargets
    });
  };

  Dashboard.prototype.addTarget = function addTarget(plugin) {
    var callerPluginId = plugin.id || plugin.constructor.name;
    var callerPluginName = plugin.title || callerPluginId;
    var callerPluginType = plugin.type;

    if (callerPluginType !== 'acquirer' && callerPluginType !== 'progressindicator' && callerPluginType !== 'presenter') {
      var msg = 'Dashboard: Modal can only be used by plugins of types: acquirer, progressindicator, presenter';
      this.uppy.log(msg);
      return;
    }

    var target = {
      id: callerPluginId,
      name: callerPluginName,
      type: callerPluginType
    };

    var state = this.getPluginState();
    var newTargets = state.targets.slice();
    newTargets.push(target);

    this.setPluginState({
      targets: newTargets
    });

    return this.el;
  };

  Dashboard.prototype.hideAllPanels = function hideAllPanels() {
    this.setPluginState({
      activePanel: false,
      showAddFilesPanel: false
    });
  };

  Dashboard.prototype.showPanel = function showPanel(id) {
    var _getPluginState = this.getPluginState(),
        targets = _getPluginState.targets;

    var activePanel = targets.filter(function (target) {
      return target.type === 'acquirer' && target.id === id;
    })[0];

    this.setPluginState({
      activePanel: activePanel
    });
  };

  Dashboard.prototype.requestCloseModal = function requestCloseModal() {
    if (this.opts.onRequestCloseModal) {
      return this.opts.onRequestCloseModal();
    } else {
      this.closeModal();
    }
  };

  Dashboard.prototype.getFocusableNodes = function getFocusableNodes() {
    var nodes = this.el.querySelectorAll(FOCUSABLE_ELEMENTS);
    return Object.keys(nodes).map(function (key) {
      return nodes[key];
    });
  };

  Dashboard.prototype.setFocusToFirstNode = function setFocusToFirstNode() {
    var focusableNodes = this.getFocusableNodes();
    if (focusableNodes.length) focusableNodes[0].focus();
  };

  Dashboard.prototype.updateBrowserHistory = function updateBrowserHistory() {
    // Ensure history state does not already contain our modal name to avoid double-pushing
    if (!history.state || !history.state[this.modalName]) {
      var _history$pushState;

      // Push to history so that the page is not lost on browser back button press
      history.pushState((_history$pushState = {}, _history$pushState[this.modalName] = true, _history$pushState), '');
    }

    // Listen for back button presses
    window.addEventListener('popstate', this.handlePopState, false);
  };

  Dashboard.prototype.handlePopState = function handlePopState(event) {
    // Close the modal if the history state no longer contains our modal name
    if (!event.state || !event.state[this.modalName]) {
      this.closeModal({ manualClose: false });
    }

    // When the browser back button is pressed and uppy is now the latest entry in the history but the modal is closed, fix the history by removing the uppy history entry
    // This occurs when another entry is added into the history state while the modal is open, and then the modal gets manually closed
    // Solves PR #575 (https://github.com/transloadit/uppy/pull/575)
    if (!this.isModalOpen() && event.state && event.state[this.modalName]) {
      history.go(-1);
    }
  };

  Dashboard.prototype.setFocusToBrowse = function setFocusToBrowse() {
    var browseBtn = this.el.querySelector('.uppy-Dashboard-browse');
    if (browseBtn) browseBtn.focus();
  };

  Dashboard.prototype.maintainFocus = function maintainFocus(event) {
    var focusableNodes = this.getFocusableNodes();
    var focusedItemIndex = focusableNodes.indexOf(document.activeElement);

    if (event.shiftKey && focusedItemIndex === 0) {
      focusableNodes[focusableNodes.length - 1].focus();
      event.preventDefault();
    }

    if (!event.shiftKey && focusedItemIndex === focusableNodes.length - 1) {
      focusableNodes[0].focus();
      event.preventDefault();
    }
  };

  Dashboard.prototype.openModal = function openModal() {
    var _this2 = this;

    // save scroll position
    this.savedScrollPosition = window.scrollY;
    // save active element, so we can restore focus when modal is closed
    this.savedActiveElement = document.activeElement;

    if (this.opts.disablePageScrollWhenModalOpen) {
      document.body.classList.add('uppy-Dashboard-isFixed');
    }

    if (this.opts.animateOpenClose && this.getPluginState().isClosing) {
      var handler = function handler() {
        _this2.setPluginState({
          isHidden: false
        });
        _this2.el.removeEventListener('animationend', handler, false);
      };
      this.el.addEventListener('animationend', handler, false);
    } else {
      this.setPluginState({
        isHidden: false
      });
    }

    if (this.opts.browserBackButtonClose) {
      this.updateBrowserHistory();
    }

    // handle ESC and TAB keys in modal dialog
    document.addEventListener('keydown', this.handleKeyDown);

    // this.rerender(this.uppy.getState())
    this.setFocusToBrowse();
  };

  Dashboard.prototype.closeModal = function closeModal() {
    var _this3 = this;

    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var _opts$manualClose = opts.manualClose,
        manualClose = _opts$manualClose === undefined ? true : _opts$manualClose;


    if (this.opts.disablePageScrollWhenModalOpen) {
      document.body.classList.remove('uppy-Dashboard-isFixed');
    }

    if (this.opts.animateOpenClose) {
      this.setPluginState({
        isClosing: true
      });
      var handler = function handler() {
        _this3.setPluginState({
          isHidden: true,
          isClosing: false
        });
        _this3.el.removeEventListener('animationend', handler, false);
      };
      this.el.addEventListener('animationend', handler, false);
    } else {
      this.setPluginState({
        isHidden: true
      });
    }

    // handle ESC and TAB keys in modal dialog
    document.removeEventListener('keydown', this.handleKeyDown);

    this.savedActiveElement.focus();

    if (manualClose) {
      if (this.opts.browserBackButtonClose) {
        // Make sure that the latest entry in the history state is our modal name
        if (history.state && history.state[this.modalName]) {
          // Go back in history to clear out the entry we created (ultimately closing the modal)
          history.go(-1);
        }
      }
    }
  };

  Dashboard.prototype.isModalOpen = function isModalOpen() {
    return !this.getPluginState().isHidden || false;
  };

  Dashboard.prototype.handleKeyDown = function handleKeyDown(event) {
    // close modal on esc key press
    if (event.keyCode === ESC_KEY) this.requestCloseModal(event);
    // maintainFocus on tab key press
    if (event.keyCode === TAB_KEY) this.maintainFocus(event);
  };

  Dashboard.prototype.handleClickOutside = function handleClickOutside() {
    if (this.opts.closeModalOnClickOutside) this.requestCloseModal();
  };

  Dashboard.prototype.handlePaste = function handlePaste(ev) {
    var _this4 = this;

    var files = toArray(ev.clipboardData.items);
    files.forEach(function (file) {
      if (file.kind !== 'file') return;

      var blob = file.getAsFile();
      if (!blob) {
        _this4.uppy.log('[Dashboard] File pasted, but the file blob is empty');
        _this4.uppy.info('Error pasting file', 'error');
        return;
      }
      _this4.uppy.log('[Dashboard] File pasted');
      try {
        _this4.uppy.addFile({
          source: _this4.id,
          name: file.name,
          type: file.type,
          data: blob
        });
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    });
  };

  Dashboard.prototype.handleInputChange = function handleInputChange(ev) {
    var _this5 = this;

    ev.preventDefault();
    var files = toArray(ev.target.files);

    files.forEach(function (file) {
      try {
        _this5.uppy.addFile({
          source: _this5.id,
          name: file.name,
          type: file.type,
          data: file
        });
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    });
  };

  Dashboard.prototype.initEvents = function initEvents() {
    var _this6 = this;

    // Modal open button
    var showModalTrigger = findAllDOMElements(this.opts.trigger);
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.forEach(function (trigger) {
        return trigger.addEventListener('click', _this6.openModal);
      });
    }

    if (!this.opts.inline && !showModalTrigger) {
      this.uppy.log('Dashboard modal trigger not found. Make sure `trigger` is set in Dashboard options unless you are planning to call openModal() method yourself');
    }

    // Drag Drop
    this.removeDragDropListener = dragDrop(this.el, function (files) {
      _this6.handleDrop(files);
    });

    // Watch for Dashboard container (`.uppy-Dashboard-inner`) resize
    // and update containerWidth/containerHeight in plugin state accordingly
    this.ro = new ResizeObserver(function (entries, observer) {
      for (var _iterator = entries, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : _iterator[Symbol.iterator]();;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var entry = _ref;
        var _entry$contentRect = entry.contentRect,
            width = _entry$contentRect.width,
            height = _entry$contentRect.height;


        _this6.uppy.log('[Dashboard] resized: ' + width + ' / ' + height);

        _this6.setPluginState({
          containerWidth: width,
          containerHeight: height
        });
      }
    });
    this.ro.observe(this.el.querySelector('.uppy-Dashboard-inner'));

    this.uppy.on('plugin-remove', this.removeTarget);
    this.uppy.on('file-added', this.handleFileAdded);
    this.uppy.on('complete', this.handleComplete);
  };

  Dashboard.prototype.handleFileAdded = function handleFileAdded() {
    this.hideAllPanels();
  };

  Dashboard.prototype.handleComplete = function handleComplete(_ref2) {
    var failed = _ref2.failed,
        uploadID = _ref2.uploadID;

    if (this.opts.closeAfterFinish && failed.length === 0) {
      // All uploads are done
      this.requestCloseModal();
    }
  };

  Dashboard.prototype.removeEvents = function removeEvents() {
    var _this7 = this;

    var showModalTrigger = findAllDOMElements(this.opts.trigger);
    if (!this.opts.inline && showModalTrigger) {
      showModalTrigger.forEach(function (trigger) {
        return trigger.removeEventListener('click', _this7.openModal);
      });
    }

    this.ro.unobserve(this.el.querySelector('.uppy-Dashboard-inner'));

    this.removeDragDropListener();
    // window.removeEventListener('resize', this.throttledUpdateDashboardElWidth)
    window.removeEventListener('popstate', this.handlePopState, false);
    this.uppy.off('plugin-remove', this.removeTarget);
    this.uppy.off('file-added', this.handleFileAdded);
    this.uppy.off('complete', this.handleComplete);
  };

  Dashboard.prototype.toggleFileCard = function toggleFileCard(fileId) {
    this.setPluginState({
      fileCardFor: fileId || false
    });
  };

  Dashboard.prototype.toggleAddFilesPanel = function toggleAddFilesPanel(show) {
    this.setPluginState({
      showAddFilesPanel: show
    });
  };

  Dashboard.prototype.handleDrop = function handleDrop(files) {
    var _this8 = this;

    this.uppy.log('[Dashboard] Files were dropped');

    files.forEach(function (file) {
      try {
        _this8.uppy.addFile({
          source: _this8.id,
          name: file.name,
          type: file.type,
          data: file
        });
      } catch (err) {
        // Nothing, restriction errors handled in Core
      }
    });
  };

  Dashboard.prototype.render = function render(state) {
    var _this9 = this;

    var pluginState = this.getPluginState();
    var files = state.files,
        capabilities = state.capabilities,
        allowNewUpload = state.allowNewUpload;

    // TODO: move this to Core, to share between Status Bar and Dashboard
    // (and any other plugin that might need it, too)

    var newFiles = Object.keys(files).filter(function (file) {
      return !files[file].progress.uploadStarted;
    });

    var uploadStartedFiles = Object.keys(files).filter(function (file) {
      return files[file].progress.uploadStarted;
    });

    var pausedFiles = Object.keys(files).filter(function (file) {
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

    var processingFiles = Object.keys(files).filter(function (file) {
      return files[file].progress.preprocess || files[file].progress.postprocess;
    });

    var isUploadStarted = uploadStartedFiles.length > 0;

    var isAllComplete = state.totalProgress === 100 && completeFiles.length === Object.keys(files).length && processingFiles.length === 0;

    var isAllErrored = isUploadStarted && erroredFiles.length === uploadStartedFiles.length;

    var isAllPaused = inProgressFiles.length !== 0 && pausedFiles.length === inProgressFiles.length;
    // const isAllPaused = inProgressNotPausedFiles.length === 0 &&
    //   !isAllComplete &&
    //   !isAllErrored &&
    //   uploadStartedFiles.length > 0

    // let inProgressNotPausedFilesArray = []
    // inProgressNotPausedFiles.forEach((file) => {
    //   inProgressNotPausedFilesArray.push(files[file])
    // })

    // let totalSize = 0
    // let totalUploadedSize = 0
    // inProgressNotPausedFilesArray.forEach((file) => {
    //   totalSize = totalSize + (file.progress.bytesTotal || 0)
    //   totalUploadedSize = totalUploadedSize + (file.progress.bytesUploaded || 0)
    // })
    // totalSize = prettyBytes(totalSize)
    // totalUploadedSize = prettyBytes(totalUploadedSize)

    var attachRenderFunctionToTarget = function attachRenderFunctionToTarget(target) {
      var plugin = _this9.uppy.getPlugin(target.id);
      return _extends({}, target, {
        icon: plugin.icon || _this9.opts.defaultTabIcon,
        render: plugin.render
      });
    };

    var isSupported = function isSupported(target) {
      var plugin = _this9.uppy.getPlugin(target.id);
      // If the plugin does not provide a `supported` check, assume the plugin works everywhere.
      if (typeof plugin.isSupported !== 'function') {
        return true;
      }
      return plugin.isSupported();
    };

    var acquirers = pluginState.targets.filter(function (target) {
      return target.type === 'acquirer' && isSupported(target);
    }).map(attachRenderFunctionToTarget);

    var progressindicators = pluginState.targets.filter(function (target) {
      return target.type === 'progressindicator';
    }).map(attachRenderFunctionToTarget);

    var startUpload = function startUpload(ev) {
      _this9.uppy.upload().catch(function (err) {
        // Log error.
        _this9.uppy.log(err.stack || err.message || err);
      });
    };

    var cancelUpload = function cancelUpload(fileID) {
      _this9.uppy.removeFile(fileID);
    };

    var saveFileCard = function saveFileCard(meta, fileID) {
      _this9.uppy.setFileMeta(fileID, meta);
      _this9.toggleFileCard();
    };

    return DashboardUI({
      state: state,
      modal: pluginState,
      files: files,
      newFiles: newFiles,
      uploadStartedFiles: uploadStartedFiles,
      completeFiles: completeFiles,
      erroredFiles: erroredFiles,
      inProgressFiles: inProgressFiles,
      inProgressNotPausedFiles: inProgressNotPausedFiles,
      processingFiles: processingFiles,
      isUploadStarted: isUploadStarted,
      isAllComplete: isAllComplete,
      isAllErrored: isAllErrored,
      isAllPaused: isAllPaused,
      totalFileCount: Object.keys(files).length,
      totalProgress: state.totalProgress,
      allowNewUpload: allowNewUpload,
      acquirers: acquirers,
      activePanel: pluginState.activePanel,
      animateOpenClose: this.opts.animateOpenClose,
      isClosing: pluginState.isClosing,
      getPlugin: this.uppy.getPlugin,
      progressindicators: progressindicators,
      autoProceed: this.uppy.opts.autoProceed,
      id: this.id,
      closeModal: this.requestCloseModal,
      handleClickOutside: this.handleClickOutside,
      handleInputChange: this.handleInputChange,
      handlePaste: this.handlePaste,
      inline: this.opts.inline,
      showPanel: this.showPanel,
      hideAllPanels: this.hideAllPanels,
      log: this.uppy.log,
      i18n: this.i18n,
      i18nArray: this.i18nArray,
      addFile: this.uppy.addFile,
      removeFile: this.uppy.removeFile,
      info: this.uppy.info,
      note: this.opts.note,
      metaFields: pluginState.metaFields,
      resumableUploads: capabilities.resumableUploads || false,
      bundled: capabilities.bundled || false,
      startUpload: startUpload,
      pauseUpload: this.uppy.pauseResume,
      retryUpload: this.uppy.retryUpload,
      cancelUpload: cancelUpload,
      cancelAll: this.uppy.cancelAll,
      fileCardFor: pluginState.fileCardFor,
      toggleFileCard: this.toggleFileCard,
      toggleAddFilesPanel: this.toggleAddFilesPanel,
      showAddFilesPanel: pluginState.showAddFilesPanel,
      saveFileCard: saveFileCard,
      width: this.opts.width,
      height: this.opts.height,
      showLinkToFileUploadResult: this.opts.showLinkToFileUploadResult,
      proudlyDisplayPoweredByUppy: this.opts.proudlyDisplayPoweredByUppy,
      currentWidth: pluginState.containerWidth,
      isWide: pluginState.containerWidth > 400,
      containerWidth: pluginState.containerWidth,
      isTargetDOMEl: this.isTargetDOMEl,
      allowedFileTypes: this.uppy.opts.restrictions.allowedFileTypes,
      maxNumberOfFiles: this.uppy.opts.restrictions.maxNumberOfFiles,
      showSelectedFiles: this.opts.showSelectedFiles
    });
  };

  Dashboard.prototype.discoverProviderPlugins = function discoverProviderPlugins() {
    var _this10 = this;

    this.uppy.iteratePlugins(function (plugin) {
      if (plugin && !plugin.target && plugin.opts && plugin.opts.target === _this10.constructor) {
        _this10.addTarget(plugin);
      }
    });
  };

  Dashboard.prototype.install = function install() {
    var _this11 = this;

    // Set default state for Dashboard
    this.setPluginState({
      isHidden: true,
      showFileCard: false,
      showAddFilesPanel: false,
      activePanel: false,
      metaFields: this.opts.metaFields,
      targets: []
    });

    var _opts = this.opts,
        inline = _opts.inline,
        closeAfterFinish = _opts.closeAfterFinish;

    if (inline && closeAfterFinish) {
      throw new Error('[Dashboard] `closeAfterFinish: true` cannot be used on an inline Dashboard, because an inline Dashboard cannot be closed at all. Either set `inline: false`, or disable the `closeAfterFinish` option.');
    }

    var allowMultipleUploads = this.uppy.opts.allowMultipleUploads;

    if (allowMultipleUploads && closeAfterFinish) {
      this.uppy.log('[Dashboard] When using `closeAfterFinish`, we recommended setting the `allowMultipleUploads` option to `false` in the Uppy constructor. See https://uppy.io/docs/uppy/#allowMultipleUploads-true', 'warning');
    }

    var target = this.opts.target;

    if (target) {
      this.mount(target, this);
    }

    var plugins = this.opts.plugins || [];
    plugins.forEach(function (pluginID) {
      var plugin = _this11.uppy.getPlugin(pluginID);
      if (plugin) {
        plugin.mount(_this11, plugin);
      }
    });

    if (!this.opts.disableStatusBar) {
      this.uppy.use(StatusBar, {
        id: this.id + ':StatusBar',
        target: this,
        hideUploadButton: this.opts.hideUploadButton,
        hideRetryButton: this.opts.hideRetryButton,
        hidePauseResumeButton: this.opts.hidePauseResumeButton,
        hideCancelButton: this.opts.hideCancelButton,
        showProgressDetails: this.opts.showProgressDetails,
        hideAfterFinish: this.opts.hideProgressAfterFinish,
        locale: this.opts.locale
      });
    }

    if (!this.opts.disableInformer) {
      this.uppy.use(Informer, {
        id: this.id + ':Informer',
        target: this
      });
    }

    if (!this.opts.disableThumbnailGenerator) {
      this.uppy.use(ThumbnailGenerator, {
        id: this.id + ':ThumbnailGenerator',
        thumbnailWidth: this.opts.thumbnailWidth
      });
    }

    this.discoverProviderPlugins();

    this.initEvents();
  };

  Dashboard.prototype.uninstall = function uninstall() {
    var _this12 = this;

    if (!this.opts.disableInformer) {
      var informer = this.uppy.getPlugin(this.id + ':Informer');
      // Checking if this plugin exists, in case it was removed by uppy-core
      // before the Dashboard was.
      if (informer) this.uppy.removePlugin(informer);
    }

    if (!this.opts.disableStatusBar) {
      var statusBar = this.uppy.getPlugin(this.id + ':StatusBar');
      if (statusBar) this.uppy.removePlugin(statusBar);
    }

    if (!this.opts.disableThumbnailGenerator) {
      var thumbnail = this.uppy.getPlugin(this.id + ':ThumbnailGenerator');
      if (thumbnail) this.uppy.removePlugin(thumbnail);
    }

    var plugins = this.opts.plugins || [];
    plugins.forEach(function (pluginID) {
      var plugin = _this12.uppy.getPlugin(pluginID);
      if (plugin) plugin.unmount();
    });

    this.unmount();
    this.removeEvents();
  };

  return Dashboard;
}(Plugin);