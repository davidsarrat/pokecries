import React, { useState } from 'react';
import './StartScreen.css';
import GenerationSelector from './GenerationSelector';
import GameModeSelector from './GameModeSelector';
import GameScreen from './GameScreen';

function StartScreen() {
  const [selectedGenerations, setSelectedGenerations] = useState([]);
  const [selectedGameMode, setSelectedGameMode] = useState('freestyle');
  const [gameStarted, setGameStarted] = useState(false);

  const handleStartGame = () => {
    setGameStarted(true);
  };

  const handleExitGame = () => {
    setGameStarted(false);
    setSelectedGenerations([]);
    setSelectedGameMode('freestyle');
  };

  if (gameStarted) {
    return <GameScreen selectedGenerations={selectedGenerations} selectedGameMode={selectedGameMode} onExit={handleExitGame} />;
  }

  return (
    <div className="start-screen">
      <h1 className="title">PokéCries</h1>
      <p className="subtitle">Can you guess the Pokémon by its cry?</p>
      <GenerationSelector 
        selectedGenerations={selectedGenerations}
        setSelectedGenerations={setSelectedGenerations}
      />
      <GameModeSelector 
        selectedGameMode={selectedGameMode}
        setSelectedGameMode={setSelectedGameMode}
      />
      <button 
        className="btn btn-primary btn-lg start-button"
        onClick={handleStartGame}
        disabled={selectedGenerations.length === 0 || !selectedGameMode}
      >
        Start Game
      </button>
    </div>
  );
}

export default StartScreen;