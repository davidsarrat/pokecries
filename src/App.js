import React, { useEffect, useCallback, useRef } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';
import StartScreen from './components/StartScreen';
import BackgroundTransition from './components/BackgroundTransition';
import GradientOverlay from './components/GradientOverlay';
import pokemonTypeColors from './data/pokemonTypeColors';

function App() {
  const styleRef = useRef(null);
  
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
    if (styleRef.current) {
      // Remove existing style to prevent accumulating styles
      document.head.removeChild(styleRef.current);
      styleRef.current = null;
    }
    
    const styleSheet = document.createElement('style');
    styleSheet.type = 'text/css';
    styleSheet.innerHTML = `
      @keyframes backgroundTransition { ${keyframes} }
      .App { animation: backgroundTransition 240s ease-in-out infinite; }
    `;
    document.head.appendChild(styleSheet);
    styleRef.current = styleSheet;
  }, []);

  useEffect(() => {
    const colors = Object.values(pokemonTypeColors);
    const sequence = generateColorSequence(colors, 5); // Reduce from 10 to 5 for better performance
    const keyframes = generateKeyframes(sequence);
    injectKeyframes(keyframes);
    
    // Cleanup function to remove style sheet when component unmounts
    return () => {
      if (styleRef.current) {
        document.head.removeChild(styleRef.current);
        styleRef.current = null;
      }
    };
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
