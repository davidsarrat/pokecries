import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import StartScreen from './components/StartScreen';
import BackgroundTransition from './components/BackgroundTransition';
import GradientOverlay from './components/GradientOverlay';

function App() {
  return (
    <div className="App">
      <BackgroundTransition />
      <GradientOverlay />
      <StartScreen />
    </div>
  );
}

export default App;