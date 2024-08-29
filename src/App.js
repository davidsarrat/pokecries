import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import StartScreen from './components/StartScreen';
import BackgroundTransition from './components/BackgroundTransition';

function App() {
  return (
    <div className="App">
      <BackgroundTransition />
      <StartScreen />
    </div>
  );
}

export default App;