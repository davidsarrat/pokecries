import React from 'react';
import './GameOptionsSelector.css';

function GameOptionsSelector({ keepCryOnError, setKeepCryOnError, hardcoreMode, setHardcoreMode }) {
  return (
    <div className="game-options-selector">
      <div className="keep-cry-checkbox">
        <input
          type="checkbox"
          id="keepCryOnError"
          checked={keepCryOnError}
          onChange={(e) => setKeepCryOnError(e.target.checked)}
        />
        <label htmlFor="keepCryOnError">Keep same cry on error</label>
      </div>
      <div className="hardcore-checkbox">
        <input
          type="checkbox"
          id="hardcoreMode"
          checked={hardcoreMode}
          onChange={(e) => setHardcoreMode(e.target.checked)}
        />
        <label htmlFor="hardcoreMode">Hardcore (error = lose)</label>
      </div>
    </div>
  );
}

export default GameOptionsSelector;