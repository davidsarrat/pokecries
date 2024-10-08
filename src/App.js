import React, { useEffect, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import StartScreen from './components/StartScreen';
import BackgroundTransition from './components/BackgroundTransition';
import GradientOverlay from './components/GradientOverlay';
import pokemonTypeColors from './data/pokemonTypeColors';

function App() {
  const shuffleArray = useCallback((array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }, []);

  const generateColorSequence = useCallback((colors, iterations) => {
    const sequence = [];
    for (let i = 0; i < iterations; i++) {
      const shuffledColors = shuffleArray([...colors]);
      sequence.push(...shuffledColors);
    }
    return sequence;
  }, [shuffleArray]);

  const generateKeyframes = useCallback((sequence) => {
    const step = 100 / sequence.length;
    return sequence.map((color, index) => {
      return `${index * step}% { background-color: ${color}; }`;
    }).join(' ');
  }, []);

  const injectKeyframes = useCallback((keyframes) => {
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerHTML = `
      @keyframes backgroundTransition { ${keyframes} }
      .App { animation: backgroundTransition 2400s ease-in-out infinite; }
    `;
    document.head.appendChild(styleSheet);
  }, []);

  useEffect(() => {
    const colors = Object.values(pokemonTypeColors);
    const sequence = generateColorSequence(colors, 10);
    const keyframes = generateKeyframes(sequence);
    injectKeyframes(keyframes);
  }, [generateColorSequence, generateKeyframes, injectKeyframes]);

  useEffect(() => {
    const img = new Image();
    img.src = `${process.env.PUBLIC_URL}/media/images/ludicolo.gif`;
  }, []);

  return (
    <div className="App">
      <BackgroundTransition />
      <GradientOverlay />
      <StartScreen />
    </div>
  );
}

export default App;
