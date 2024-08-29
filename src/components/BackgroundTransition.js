import React, { useEffect, useState } from 'react';
import pokemonTypeColors from '../data/pokemonTypeColors';
import './BackgroundTransition.css';

const BackgroundTransition = () => {
  const [currentColor, setCurrentColor] = useState(getRandomColor());

  useEffect(() => {
    const interval = setInterval(() => {
      let newColor;
      do {
        newColor = getRandomColor();
      } while (newColor === currentColor);
      setCurrentColor(newColor);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentColor]);

  function getRandomColor() {
    const colors = Object.values(pokemonTypeColors);
    return colors[Math.floor(Math.random() * colors.length)];
  }

  return <div className="background-transition" style={{ backgroundColor: currentColor }} />;
};

export default BackgroundTransition;