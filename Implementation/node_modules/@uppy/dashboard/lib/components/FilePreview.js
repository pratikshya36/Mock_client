var getFileTypeIcon = require('../utils/getFileTypeIcon');

var _require = require('preact'),
    h = _require.h;

module.exports = function FilePreview(props) {
  var file = props.file;

  if (file.preview) {
    return h('img', { 'class': 'uppy-DashboardItem-previewImg', alt: file.name, src: file.preview });
  }

  var _getFileTypeIcon = getFileTypeIcon(file.type),
      color = _getFileTypeIcon.color,
      icon = _getFileTypeIcon.icon;

  return h(
    'div',
    { 'class': 'uppy-DashboardItem-previewIconWrap' },
    h(
      'span',
      { 'class': 'uppy-DashboardItem-previewIcon', style: { color: color } },
      icon
    ),
    h(
      'svg',
      { 'class': 'uppy-DashboardItem-previewIconBg', width: '72', height: '93', viewBox: '0 0 72 93' },
      h(
        'g',
        null,
        h('path', { d: 'M24.08 5h38.922A2.997 2.997 0 0 1 66 8.003v74.994A2.997 2.997 0 0 1 63.004 86H8.996A2.998 2.998 0 0 1 6 83.01V22.234L24.08 5z', fill: '#FFF' }),
        h('path', { d: 'M24 5L6 22.248h15.007A2.995 2.995 0 0 0 24 19.244V5z', fill: '#E4E4E4' })
      )
    )
  );
};

// <span class="uppy-DashboardItem-previewType">{file.extension && file.extension.length < 5 ? file.extension : null}</span>