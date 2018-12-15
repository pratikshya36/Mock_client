var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var FileItem = require('./FileItem');
var classNames = require('classnames');

var _require = require('preact'),
    h = _require.h;

module.exports = function (props) {
  var noFiles = props.totalFileCount === 0;
  var dashboardFilesClass = classNames('uppy-Dashboard-files', { 'uppy-Dashboard-files--noFiles': noFiles });

  return h(
    'ul',
    { 'class': dashboardFilesClass },
    Object.keys(props.files).map(function (fileID) {
      return h(FileItem, _extends({}, props, {
        acquirers: props.acquirers,
        file: props.files[fileID]
      }));
    })
  );
};