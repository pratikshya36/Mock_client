var _require = require('preact'),
    h = _require.h;

var Breadcrumb = function Breadcrumb(props) {
  return h(
    "button",
    { type: "button", onclick: props.getFolder },
    props.title
  );
};

module.exports = function (props) {
  return h(
    "div",
    { "class": "uppy-Provider-breadcrumbs" },
    props.directories.map(function (directory, i) {
      return Breadcrumb({
        getFolder: function getFolder() {
          return props.getFolder(directory.id);
        },
        title: i === 0 ? props.title : directory.title
      });
    })
  );
};