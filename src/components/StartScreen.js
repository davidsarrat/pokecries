import React, { useState } from 'react';
import './StartScreen.css';
import GenerationSelector from './GenerationSelector';
import GameModeSelector from './GameModeSelector';
import LimitedAnswersSelector from './LimitedAnswersSelector';
import GameOptionsSelector from './GameOptionsSelector';
import GameScreen from './GameScreen';

function StartScreen() {
  const [selectedGenerations, setSelectedGenerations] = useState(['gen1']); // Gen 1 activada por defecto
  const [selectedGameMode, setSelectedGameMode] = useState('freestyle');
  const [gameStarted, setGameStarted] = useState(false);
  const [timeAttackSettings, setTimeAttackSettings] = useState({
    minutes: 2,
    seconds: 0,
    gainTime: 0,
    loseTime: 0
  });
  const [limitedAnswers, setLimitedAnswers] = useState(false);
  const [numberOfAnswers, setNumberOfAnswers] = useState(4);
  const [keepCryOnError, setKeepCryOnError] = useState(false);
  const [error, setError] = useState('');

  const handleStartGame = () => {
    if (selectedGenerations.length === 0) {
      setError('You must select at least one generation!');
      return;
    }
    if (selectedGameMode === 'time_attack') {
      if (timeAttackSettings.minutes === 0 && timeAttackSettings.seconds === 0) {
        alert('Please set a time greater than 0 for Time Attack mode!');
        return;
      }
    }
    if (limitedAnswers && numberOfAnswers < 2) {
      alert('Number of answers must be at least 2 when Limited Answers is enabled!');
      return;
    }
    setError('');
    setGameStarted(true);
  };

  const handleExitGame = () => {
    setGameStarted(false);
    setSelectedGenerations(['gen1']); // Volver a Gen 1 por defecto
    setSelectedGameMode('freestyle');
  };

  if (gameStarted) {
    return (
      <GameScreen 
        selectedGenerations={selectedGenerations} 
        selectedGameMode={selectedGameMode} 
        onExit={handleExitGame}
        timeAttackSettings={timeAttackSettings}
        limitedAnswers={limitedAnswers}
        numberOfAnswers={numberOfAnswers}
        keepCryOnError={keepCryOnError}
      />
    );
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
        setTimeAttackSettings={setTimeAttackSettings}
      />
      <LimitedAnswersSelector
        limitedAnswers={limitedAnswers}
        setLimitedAnswers={setLimitedAnswers}
        numberOfAnswers={numberOfAnswers}
        setNumberOfAnswers={setNumberOfAnswers}
      />
      <GameOptionsSelector
        keepCryOnError={keepCryOnError}
        setKeepCryOnError={setKeepCryOnError}
      />
      <button 
        className="btn btn-primary btn-lg start-button"
        onClick={handleStartGame}
        disabled={selectedGenerations.length === 0 || !selectedGameMode}
      >
        Start Game
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

export default StartScreen;