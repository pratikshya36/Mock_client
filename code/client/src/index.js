import React from 'react';
import ReactDom from 'react-dom';
import './index.css';
import UserForm from './UserForm';
ReactDom.render(
  <UserForm/>,
  document.querySelector('#root')
);