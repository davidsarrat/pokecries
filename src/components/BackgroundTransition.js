import React, { useEffect, useCallback } from 'react';
import pokemonTypeColors from '../data/pokemonTypeColors';
import './BackgroundTransition.css';

const BackgroundTransition = () => {
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
    styleSheet.innerHTML = `@keyframes colorChange { ${keyframes} }`;
    document.head.appendChild(styleSheet);
  }, []);

  useEffect(() => {
    const colors = Object.values(pokemonTypeColors);
    const sequence = generateColorSequence(colors, 10);
    const keyframes = generateKeyframes(sequence);
    injectKeyframes(keyframes);
  }, [generateColorSequence, generateKeyframes, injectKeyframes]);

  return <div className="background-transition" />;
};

export default BackgroundTransition;