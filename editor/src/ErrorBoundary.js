import React, { Component } from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = {hasError: false};
    }
  
    componentDidCatch(error, info) {
        this.setState({ hasError: true });
        window.vscode.postMessage({
            command: 'console',
            content: `ERROR: ${error}`
        });
    }
  
    render() {
        if(this.state.hasError) return <div>Unotes has encountered an internal error. Please reopen window.</div>;
        return this.props.children;
    }
}

export default ErrorBoundary;
