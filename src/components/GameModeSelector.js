import React from 'react';
import './GameModeSelector.css';

const gameModes = [
  { name: 'Freestyle', key: 'freestyle' },
  { name: 'Pokédex Run', key: 'pokedex_completer' },
  { name: 'Time Attack!', key: 'time_attack' }
];

function GameModeSelector({ selectedGameMode, setSelectedGameMode, timeAttackSettings, setTimeAttackSettings }) {
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
      
      {selectedGameMode === 'time_attack' && (
        <div className="time-attack-settings">
          <div className="time-setting">
            <label>Time:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={timeAttackSettings.minutes === 0 ? '' : timeAttackSettings.minutes} 
                onChange={handleTimeAttackSettingsChange} 
                name="minutes"
                min="0" 
                placeholder="0"
              />
              <span>min</span>
              <input 
                type="number" 
                value={timeAttackSettings.seconds === 0 ? '' : timeAttackSettings.seconds} 
                onChange={handleTimeAttackSettingsChange} 
                name="seconds"
                min="0" 
                max="59"
                placeholder="0"
              />
              <span>sec</span>
            </div>
          </div>
          {!isTimeAttackValid() && (
            <p className="error-message">Please set a time greater than 0 for Time Attack!</p>
          )}
          <div className="time-setting">
            <label>Gain time on correct:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={timeAttackSettings.gainTime === 0 ? '' : timeAttackSettings.gainTime} 
                onChange={handleTimeAttackSettingsChange} 
                name="gainTime"
                min="0" 
                placeholder="0"
              />
              <span>sec</span>
            </div>
          </div>
          <div className="time-setting">
            <label>Lose time on incorrect:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={timeAttackSettings.loseTime === 0 ? '' : timeAttackSettings.loseTime} 
                onChange={handleTimeAttackSettingsChange} 
                name="loseTime"
                min="0" 
                placeholder="0"
              />
              <span>sec</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GameModeSelector;