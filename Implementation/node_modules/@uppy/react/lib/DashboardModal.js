var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var React = require('react');
var PropTypes = require('prop-types');
var DashboardPlugin = require('@uppy/dashboard');
var basePropTypes = require('./propTypes').dashboard;

var h = React.createElement;

/**
 * React Component that renders a Dashboard for an Uppy instance in a Modal
 * dialog. Visibility of the Modal is toggled using the `open` prop.
 */

var DashboardModal = function (_React$Component) {
  _inherits(DashboardModal, _React$Component);

  function DashboardModal() {
    _classCallCheck(this, DashboardModal);

    return _possibleConstructorReturn(this, _React$Component.apply(this, arguments));
  }

  DashboardModal.prototype.componentDidMount = function componentDidMount() {
    var uppy = this.props.uppy;
    var options = _extends({ id: 'react:DashboardModal' }, this.props, {
      onRequestCloseModal: this.props.onRequestClose
    });

    if (!options.target) {
      options.target = this.container;
    }

    delete options.uppy;
    uppy.use(DashboardPlugin, options);

    this.plugin = uppy.getPlugin(options.id);
    if (this.props.open) {
      this.plugin.openModal();
    }
  };

  DashboardModal.prototype.componentWillUnmount = function componentWillUnmount() {
    var uppy = this.props.uppy;

    uppy.removePlugin(this.plugin);
  };

  DashboardModal.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
    if (this.props.open && !nextProps.open) {
      this.plugin.closeModal();
    } else if (!this.props.open && nextProps.open) {
      this.plugin.openModal();
    }
  };

  DashboardModal.prototype.render = function render() {
    var _this2 = this;

    return h('div', {
      ref: function ref(container) {
        _this2.container = container;
      }
    });
  };

  return DashboardModal;
}(React.Component);

DashboardModal.propTypes = _extends({
  // Only check this prop type in the browser.
  target: typeof window !== 'undefined' ? PropTypes.instanceOf(window.HTMLElement) : PropTypes.any,
  open: PropTypes.bool,
  onRequestClose: PropTypes.func,
  closeModalOnClickOutside: PropTypes.bool,
  disablePageScrollWhenModalOpen: PropTypes.bool
}, basePropTypes);

DashboardModal.defaultProps = {};

module.exports = DashboardModal;