var _require = require('preact'),
    h = _require.h;

module.exports = function (props) {
  return h(
    "div",
    { "class": "uppy-Webcam-permissons" },
    h(
      "div",
      { "class": "uppy-Webcam-permissonsIcon" },
      props.icon()
    ),
    h(
      "h1",
      { "class": "uppy-Webcam-title" },
      props.i18n('allowAccessTitle')
    ),
    h(
      "p",
      null,
      props.i18n('allowAccessDescription')
    )
  );
};