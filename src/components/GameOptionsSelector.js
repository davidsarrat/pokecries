import React from 'react';
import './GameOptionsSelector.css';

function GameOptionsSelector({ keepCryOnError, setKeepCryOnError }) {
  return (
    <div className="game-options-selector">
      <div className="keep-cry-checkbox">
        <input
          type="checkbox"
          id="keepCryOnError"
          checked={keepCryOnError}
          onChange={(e) => setKeepCryOnError(e.target.checked)}
        />
        <label htmlFor="keepCryOnError">Keep cry on error</label>
      </div>
    </div>
  );
}

export default GameOptionsSelector;