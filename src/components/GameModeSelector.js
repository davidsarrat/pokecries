import React, { useState, useEffect } from 'react';
import './GameModeSelector.css';

const gameModes = [
  { name: 'Freestyle', key: 'freestyle' },
  { name: 'Pokédex Completer', key: 'pokedex_completer' },
  { name: 'Time Attack!', key: 'time_attack' }
];

function GameModeSelector({ selectedGameMode, setSelectedGameMode, timeAttackSettings, setTimeAttackSettings }) {
  const handleModeChange = (e) => {
    setSelectedGameMode(e.target.value);
  };

  const handleTimeAttackSettingsChange = (e) => {
    const { name, value } = e.target;
    setTimeAttackSettings(prevSettings => ({
      ...prevSettings,
      [name]: parseInt(value, 10)
    }));
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
                value={timeAttackSettings.minutes} 
                onChange={handleTimeAttackSettingsChange} 
                name="minutes"
                min="0" 
              />
              <span>min</span>
              <input 
                type="number" 
                value={timeAttackSettings.seconds} 
                onChange={handleTimeAttackSettingsChange} 
                name="seconds"
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
                value={timeAttackSettings.gainTime} 
                onChange={handleTimeAttackSettingsChange} 
                name="gainTime"
                min="0" 
              />
              <span>ms</span>
            </div>
          </div>
          <div className="time-setting">
            <label>Lose time on incorrect:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={timeAttackSettings.loseTime} 
                onChange={handleTimeAttackSettingsChange} 
                name="loseTime"
                min="0" 
              />
              <span>ms</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameModeSelector;