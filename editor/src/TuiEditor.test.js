import React from 'react';
import ReactDOM from 'react-dom';
import TuiEditor from './TuiEditor';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<TuiEditor />, div);
  ReactDOM.unmountComponentAtNode(div);
});
