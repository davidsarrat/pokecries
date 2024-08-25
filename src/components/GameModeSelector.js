import React from 'react';
import './GameModeSelector.css';

const gameModes = [
  { name: 'Freestyle', key: 'freestyle' },
  { name: 'Pokédex Completer', key: 'pokedex_completer' },
  { name: 'Time Attack!', key: 'time_attack' },
  { name: 'Training Grounds', key: 'training_grounds' }
];

function GameModeSelector({ selectedGameMode, setSelectedGameMode }) {
  return (
    <div className="game-mode-selector">
      <h2>Select Game Mode</h2>
      <select
        className="game-mode-dropdown"
        value={selectedGameMode}
        onChange={(e) => setSelectedGameMode(e.target.value)}
      >
        {gameModes.map(mode => (
          <option key={mode.key} value={mode.key}>{mode.name}</option>
        ))}
      </select>
    </div>
  );
}

export default GameModeSelector;