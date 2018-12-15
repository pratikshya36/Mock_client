function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var ProviderViews = require('@uppy/provider-views');

module.exports = function (_ProviderViews) {
  _inherits(DriveProviderViews, _ProviderViews);

  function DriveProviderViews() {
    _classCallCheck(this, DriveProviderViews);

    return _possibleConstructorReturn(this, _ProviderViews.apply(this, arguments));
  }

  DriveProviderViews.prototype.toggleCheckbox = function toggleCheckbox(e, file) {
    e.stopPropagation();
    e.preventDefault();

    // Team Drives aren't selectable; for all else, defer to the base ProviderView.
    if (!file.custom.isTeamDrive) {
      _ProviderViews.prototype.toggleCheckbox.call(this, e, file);
    }
  };

  return DriveProviderViews;
}(ProviderViews);