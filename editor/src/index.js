import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import ErrorBoundary from './ErrorBoundary';
import TuiEditor from './TuiEditor';


ReactDOM.render(
  <ErrorBoundary><TuiEditor /></ErrorBoundary>, 
  document.getElementById('root')
);

