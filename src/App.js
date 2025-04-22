import React from 'react';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import StartScreen from './components/StartScreen';
import GradientOverlay from './components/GradientOverlay';

function App() {
  return (
    <div className="App">
      <GradientOverlay />
      <StartScreen />
    </div>
  );
}

export default App;
