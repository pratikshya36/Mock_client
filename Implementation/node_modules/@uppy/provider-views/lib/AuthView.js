function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var LoaderView = require('./Loader');

var _require = require('preact'),
    h = _require.h,
    Component = _require.Component;

var AuthBlock = function (_Component) {
  _inherits(AuthBlock, _Component);

  function AuthBlock() {
    _classCallCheck(this, AuthBlock);

    return _possibleConstructorReturn(this, _Component.apply(this, arguments));
  }

  AuthBlock.prototype.componentDidMount = function componentDidMount() {
    var _this2 = this;

    setTimeout(function () {
      if (!_this2.connectButton) return;
      _this2.connectButton.focus({ preventScroll: true });
    }, 150);
  };

  AuthBlock.prototype.render = function render() {
    var _this3 = this;

    return h(
      'div',
      { 'class': 'uppy-Provider-auth' },
      h(
        'div',
        { 'class': 'uppy-Provider-authIcon' },
        this.props.pluginIcon()
      ),
      h(
        'h1',
        { 'class': 'uppy-Provider-authTitle' },
        'Please authenticate with ',
        h(
          'span',
          { 'class': 'uppy-Provider-authTitleName' },
          this.props.pluginName
        ),
        h('br', null),
        ' to select files'
      ),
      h(
        'button',
        {
          type: 'button',
          'class': 'uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn',
          onclick: this.props.handleAuth,
          ref: function ref(el) {
            _this3.connectButton = el;
          }
        },
        'Connect to ',
        this.props.pluginName
      ),
      this.props.demo && h(
        'button',
        { 'class': 'uppy-u-reset uppy-c-btn uppy-c-btn-primary uppy-Provider-authBtn', onclick: this.props.handleDemoAuth },
        'Proceed with Demo Account'
      )
    );
  };

  return AuthBlock;
}(Component);

var AuthView = function (_Component2) {
  _inherits(AuthView, _Component2);

  function AuthView() {
    _classCallCheck(this, AuthView);

    return _possibleConstructorReturn(this, _Component2.apply(this, arguments));
  }

  AuthView.prototype.componentDidMount = function componentDidMount() {
    this.props.checkAuth();
  };

  AuthView.prototype.render = function render() {
    if (this.props.checkAuthInProgress) {
      return h(LoaderView, null);
    }
    return h(AuthBlock, this.props);
  };

  return AuthView;
}(Component);

module.exports = AuthView;