import React from 'react';
import './GameModeSelector.css';

const gameModes = [
  { name: 'Freestyle', key: 'freestyle' },
  { name: 'Pokédex Run', key: 'pokedex_completer' }
];

function GameModeSelector({ 
  selectedGameMode, 
  setSelectedGameMode, 
  timeAttackSettings, 
  setTimeAttackSettings,
  isTimeAttack,
  setIsTimeAttack
}) {
  const handleModeChange = (e) => {
    setSelectedGameMode(e.target.value);
  };

  const handleTimeAttackSettingsChange = (e) => {
    const { name, value } = e.target;
    let parsedValue = value === '' ? 0 : parseInt(value, 10);
    
    setTimeAttackSettings(prevSettings => ({
      ...prevSettings,
      [name]: parsedValue
    }));
  };

  const isTimeAttackValid = () => {
    const { minutes, seconds } = timeAttackSettings;
    return minutes > 0 || seconds > 0;
  };

  return (
    <div className="game-mode-selector">
      <h2>Select Game Mode</h2>
      <select
        className="game-mode-dropdown"
        value={selectedGameMode}
        onChange={handleModeChange}
      >
        {gameModes.map(mode => (
          <option key={mode.key} value={mode.key}>{mode.name}</option>
        ))}
      </select>
    </div>
  );
}

export default GameModeSelector;