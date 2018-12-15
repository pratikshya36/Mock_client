import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <BrowserRouter>
        <div>
          <Route exact={true} path='/' render={() => (
            <div className="App">
              <Home />
            </div>
          )}/>
          <Route exact={true} path='/signin' render={() => (
            <div className="App">
              <SignIn />
            </div>
          )}/>
          <Route exact={true} path='/signup' render={() => (
            <div className="App">
              <SignUp />
            </div>
          )}/>
        </div>
      </BrowserRouter>
    );
  }
}

export default App;
