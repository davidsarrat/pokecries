import React, { useState } from 'react';
import './StartScreen.css';
import GenerationSelector from './GenerationSelector';

function StartScreen() {
  const [selectedGenerations, setSelectedGenerations] = useState([]);

  const handleStartGame = () => {
    // Implementar lógica para iniciar el juego
    console.log('Starting game with generations:', selectedGenerations);
  };

  return (
    <div className="start-screen">
      <h1 className="title">PokéCries</h1>
      <p className="subtitle">Can you guess the Pokémon by its cry?</p>
      <GenerationSelector 
        selectedGenerations={selectedGenerations}
        setSelectedGenerations={setSelectedGenerations}
      />
      <button 
        className="btn btn-primary btn-lg start-button"
        onClick={handleStartGame}
        disabled={selectedGenerations.length === 0}
      >
        Start Game
      </button>
    </div>
  );
}

export default StartScreen;