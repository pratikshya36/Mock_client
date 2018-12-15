var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var classNames = require('classnames');
var Breadcrumbs = require('./Breadcrumbs');
var Filter = require('./Filter');
var Table = require('./ItemList');
var FooterActions = require('./FooterActions');

var _require = require('preact'),
    h = _require.h;

var Browser = function Browser(props) {
  var filteredFolders = props.folders;
  var filteredFiles = props.files;

  if (props.filterInput !== '') {
    filteredFolders = props.filterItems(props.folders);
    filteredFiles = props.filterItems(props.files);
  }

  var selected = props.currentSelection.length;

  return h(
    'div',
    { 'class': classNames('uppy-ProviderBrowser', 'uppy-ProviderBrowser-viewType--' + props.viewType) },
    h(
      'div',
      { 'class': 'uppy-ProviderBrowser-header' },
      h(
        'div',
        { 'class': classNames('uppy-ProviderBrowser-headerBar', !props.showBreadcrumbs && 'uppy-ProviderBrowser-headerBar--simple') },
        h(
          'div',
          { 'class': 'uppy-Provider-breadcrumbsWrap' },
          h(
            'div',
            { 'class': 'uppy-Provider-breadcrumbsIcon' },
            props.pluginIcon && props.pluginIcon()
          ),
          props.showBreadcrumbs && Breadcrumbs({
            getFolder: props.getFolder,
            directories: props.directories,
            title: props.title
          })
        ),
        h(
          'span',
          { 'class': 'uppy-ProviderBrowser-user' },
          props.username
        ),
        h(
          'button',
          { type: 'button', onclick: props.logout, 'class': 'uppy-ProviderBrowser-userLogout' },
          props.i18n('logOut')
        )
      )
    ),
    props.showFilter && h(Filter, props),
    h(Table, {
      columns: [{
        name: 'Name',
        key: 'title'
      }],
      folders: filteredFolders,
      files: filteredFiles,
      activeRow: props.isActiveRow,
      sortByTitle: props.sortByTitle,
      sortByDate: props.sortByDate,
      isChecked: props.isChecked,
      handleFolderClick: props.getNextFolder,
      toggleCheckbox: props.toggleCheckbox,
      handleScroll: props.handleScroll,
      title: props.title,
      showTitles: props.showTitles,
      i18n: props.i18n
    }),
    selected > 0 && h(FooterActions, _extends({ selected: selected }, props))
  );
};

module.exports = Browser;