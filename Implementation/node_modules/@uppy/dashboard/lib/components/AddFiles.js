function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ActionBrowseTagline = require('./ActionBrowseTagline');

var _require = require('./icons'),
    localIcon = _require.localIcon;

var _require2 = require('preact'),
    h = _require2.h,
    Component = _require2.Component;

var poweredByUppy = function poweredByUppy(props) {
  return h(
    'a',
    { tabindex: '-1', href: 'https://uppy.io', rel: 'noreferrer noopener', target: '_blank', 'class': 'uppy-Dashboard-poweredBy' },
    'Powered by ',
    h(
      'svg',
      { 'aria-hidden': 'true', 'class': 'UppyIcon uppy-Dashboard-poweredByIcon', width: '11', height: '11', viewBox: '0 0 11 11', xmlns: 'http://www.w3.org/2000/svg' },
      h('path', { d: 'M7.365 10.5l-.01-4.045h2.612L5.5.806l-4.467 5.65h2.604l.01 4.044h3.718z', 'fill-rule': 'evenodd' })
    ),
    h(
      'span',
      { 'class': 'uppy-Dashboard-poweredByUppy' },
      'Uppy'
    )
  );
};

var AddFiles = function (_Component) {
  _inherits(AddFiles, _Component);

  function AddFiles(props) {
    _classCallCheck(this, AddFiles);

    var _this = _possibleConstructorReturn(this, _Component.call(this, props));

    _this.handleClick = _this.handleClick.bind(_this);
    return _this;
  }

  AddFiles.prototype.handleClick = function handleClick(ev) {
    this.input.click();
  };

  AddFiles.prototype.render = function render() {
    var _this2 = this;

    // const isHidden = Object.keys(this.props.files).length === 0
    var hasAcquirers = this.props.acquirers.length !== 0;

    if (!hasAcquirers) {
      return h(
        'div',
        { 'class': 'uppy-DashboarAddFiles' },
        h(
          'div',
          { 'class': 'uppy-DashboardTabs' },
          h(ActionBrowseTagline, {
            acquirers: this.props.acquirers,
            handleInputChange: this.props.handleInputChange,
            i18n: this.props.i18n,
            i18nArray: this.props.i18nArray,
            allowedFileTypes: this.props.allowedFileTypes,
            maxNumberOfFiles: this.props.maxNumberOfFiles
          })
        ),
        h(
          'div',
          { 'class': 'uppy-DashboarAddFiles-info' },
          this.props.note && h(
            'div',
            { 'class': 'uppy-Dashboard-note' },
            this.props.note
          ),
          this.props.proudlyDisplayPoweredByUppy && poweredByUppy(this.props)
        )
      );
    }

    // empty value="" on file input, so that the input is cleared after a file is selected,
    // because Uppy will be handling the upload and so we can select same file
    // after removing — otherwise browser thinks it’s already selected
    return h(
      'div',
      { 'class': 'uppy-DashboarAddFiles' },
      h(
        'div',
        { 'class': 'uppy-DashboardTabs' },
        h(ActionBrowseTagline, {
          acquirers: this.props.acquirers,
          handleInputChange: this.props.handleInputChange,
          i18n: this.props.i18n,
          i18nArray: this.props.i18nArray,
          allowedFileTypes: this.props.allowedFileTypes,
          maxNumberOfFiles: this.props.maxNumberOfFiles
        }),
        h(
          'div',
          { 'class': 'uppy-DashboardTabs-list', role: 'tablist' },
          h(
            'div',
            { 'class': 'uppy-DashboardTab', role: 'presentation' },
            h(
              'button',
              { type: 'button',
                'class': 'uppy-DashboardTab-btn',
                role: 'tab',
                tabindex: 0,
                onclick: this.handleClick },
              localIcon(),
              h(
                'div',
                { 'class': 'uppy-DashboardTab-name' },
                this.props.i18n('myDevice')
              )
            ),
            h('input', { 'class': 'uppy-Dashboard-input',
              hidden: true,
              'aria-hidden': 'true',
              tabindex: -1,
              type: 'file',
              name: 'files[]',
              multiple: this.props.maxNumberOfFiles !== 1,
              accept: this.props.allowedFileTypes,
              onchange: this.props.handleInputChange,
              value: '',
              ref: function ref(input) {
                _this2.input = input;
              } })
          ),
          this.props.acquirers.map(function (target) {
            return h(
              'div',
              { 'class': 'uppy-DashboardTab', role: 'presentation' },
              h(
                'button',
                { 'class': 'uppy-DashboardTab-btn',
                  type: 'button',
                  role: 'tab',
                  tabindex: 0,
                  'aria-controls': 'uppy-DashboardContent-panel--' + target.id,
                  'aria-selected': _this2.props.activePanel.id === target.id,
                  onclick: function onclick() {
                    return _this2.props.showPanel(target.id);
                  } },
                target.icon(),
                h(
                  'div',
                  { 'class': 'uppy-DashboardTab-name' },
                  target.name
                )
              )
            );
          })
        )
      ),
      h(
        'div',
        { 'class': 'uppy-DashboarAddFiles-info' },
        this.props.note && h(
          'div',
          { 'class': 'uppy-Dashboard-note' },
          this.props.note
        ),
        this.props.proudlyDisplayPoweredByUppy && poweredByUppy(this.props)
      )
    );
  };

  return AddFiles;
}(Component);

module.exports = AddFiles;