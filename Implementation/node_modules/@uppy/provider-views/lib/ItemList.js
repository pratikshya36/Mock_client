var Row = require('./Item');

var _require = require('preact'),
    h = _require.h;

module.exports = function (props) {
  if (!props.folders.length && !props.files.length) {
    return h(
      'div',
      { 'class': 'uppy-Provider-empty' },
      props.i18n('noFilesFound')
    );
  }

  return h(
    'div',
    { 'class': 'uppy-ProviderBrowser-body' },
    h(
      'ul',
      { 'class': 'uppy-ProviderBrowser-list',
        onscroll: props.handleScroll,
        role: 'listbox',
        'aria-label': 'List of files from ' + props.title },
      props.folders.map(function (folder) {
        var isDisabled = false;
        var isChecked = props.isChecked(folder);
        if (isChecked) {
          isDisabled = isChecked.loading;
        }
        return Row({
          title: folder.name,
          id: folder.id,
          type: 'folder',
          // active: props.activeRow(folder),
          getItemIcon: function getItemIcon() {
            return folder.icon;
          },
          isDisabled: isDisabled,
          isChecked: isChecked,
          handleFolderClick: function handleFolderClick() {
            return props.handleFolderClick(folder);
          },
          handleClick: function handleClick(e) {
            return props.toggleCheckbox(e, folder);
          },
          columns: props.columns,
          showTitles: props.showTitles
        });
      }),
      props.files.map(function (file) {
        return Row({
          title: file.name,
          id: file.id,
          type: 'file',
          // active: props.activeRow(file),
          getItemIcon: function getItemIcon() {
            return file.icon;
          },
          isDisabled: false,
          isChecked: props.isChecked(file),
          handleClick: function handleClick(e) {
            return props.toggleCheckbox(e, file);
          },
          columns: props.columns,
          showTitles: props.showTitles
        });
      })
    )
  );
};