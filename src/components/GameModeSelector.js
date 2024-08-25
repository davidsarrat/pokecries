import React, { useState, useEffect } from 'react';
import './GameModeSelector.css';

const gameModes = [
  { name: 'Freestyle', key: 'freestyle' },
  { name: 'Pokédex Completer', key: 'pokedex_completer' },
  { name: 'Time Attack!', key: 'time_attack' },
  { name: 'Training Grounds', key: 'training_grounds' }
];

function GameModeSelector({ selectedGameMode, setSelectedGameMode, setTimeAttackSettings }) {
  const [minutes, setMinutes] = useState(2);
  const [seconds, setSeconds] = useState(0);
  const [gainTime, setGainTime] = useState(0);
  const [loseTime, setLoseTime] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedGameMode === 'time_attack') {
      setTimeAttackSettings({ minutes, seconds, gainTime, loseTime });
    }
  }, [selectedGameMode, minutes, seconds, gainTime, loseTime, setTimeAttackSettings]);

  const handleModeChange = (e) => {
    setSelectedGameMode(e.target.value);
    setError('');
  };

  const handleInputChange = (setter) => (e) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    setter(value);
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
      
      {selectedGameMode === 'time_attack' && (
        <div className="time-attack-settings">
          <div className="time-setting">
            <label>Time:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={minutes} 
                onChange={handleInputChange(setMinutes)} 
                min="0" 
              />
              <span>min</span>
              <input 
                type="number" 
                value={seconds} 
                onChange={handleInputChange(setSeconds)} 
                min="0" 
                max="59" 
              />
              <span>sec</span>
            </div>
          </div>
          <div className="time-setting">
            <label>Gain time on correct:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={gainTime} 
                onChange={handleInputChange(setGainTime)} 
                min="0" 
              />
              <span>sec</span>
            </div>
          </div>
          <div className="time-setting">
            <label>Lose time on incorrect:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={loseTime} 
                onChange={handleInputChange(setLoseTime)} 
                min="0" 
              />
              <span>sec</span>
            </div>
          </div>
          {error && <p className="error-message">{error}</p>}
        </div>
      )}
    </div>
  );
}

export default GameModeSelector;