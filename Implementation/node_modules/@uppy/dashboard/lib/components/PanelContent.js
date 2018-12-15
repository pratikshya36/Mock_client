var _require = require('preact'),
    h = _require.h;

var ignoreEvent = require('../utils/ignoreEvent.js');

function PanelContent(props) {
  return h(
    'div',
    { 'class': 'uppy-DashboardContent-panel',
      role: 'tabpanel',
      id: props.activePanel && 'uppy-DashboardContent-panel--' + props.activePanel.id,
      onDragOver: ignoreEvent,
      onDragLeave: ignoreEvent,
      onDrop: ignoreEvent,
      onPaste: ignoreEvent },
    h(
      'div',
      { 'class': 'uppy-DashboardContent-bar' },
      h(
        'div',
        { 'class': 'uppy-DashboardContent-title', role: 'heading', 'aria-level': 'h1' },
        props.i18n('importFrom', { name: props.activePanel.name })
      ),
      h(
        'button',
        { 'class': 'uppy-DashboardContent-back',
          type: 'button',
          onclick: props.hideAllPanels },
        props.i18n('done')
      )
    ),
    h(
      'div',
      { 'class': 'uppy-DashboardContent-panelBody' },
      props.getPlugin(props.activePanel.id).render(props.state)
    )
  );
}

module.exports = PanelContent;