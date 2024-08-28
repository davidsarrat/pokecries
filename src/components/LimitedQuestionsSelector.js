import React from 'react';
import './LimitedQuestionsSelector.css';
import pokemonData from '../data/pokemon.json';

function LimitedQuestionsSelector({ 
  limitedQuestions, 
  setLimitedQuestions, 
  numberOfQuestions, 
  setNumberOfQuestions,
  selectedGenerations,
  selectedGameMode 
}) {
  const handleLimitedQuestionsChange = (e) => {
    setLimitedQuestions(e.target.checked);
  };

  const handleNumberOfQuestionsChange = (e) => {
    const value = e.target.value;
    if (value === '' || !isNaN(parseInt(value, 10))) {
      setNumberOfQuestions(value === '' ? '' : parseInt(value, 10));
    }
  };

  const totalAvailablePokemon = selectedGenerations.reduce((total, gen) => {
    return total + (pokemonData[gen] ? pokemonData[gen].length : 0);
  }, 0);

  const isNumberOfQuestionsValid = () => {
    return numberOfQuestions !== '' && numberOfQuestions >= 1 && numberOfQuestions <= totalAvailablePokemon;
  };

  const getErrorMessage = () => {
    if (numberOfQuestions < 1) {
      return 'Number of questions must be at least 1!';
    }
    if (selectedGenerations.length > 0 && selectedGameMode === 'pokedex_completer' && numberOfQuestions > totalAvailablePokemon) {
      return `Number of questions cannot exceed available Pokémon (${totalAvailablePokemon}) if you disable repeating Pokémon!`;
    }
    return '';
  };

  return (
    <div className="limited-questions-selector">
      <div className="limited-questions-checkbox">
        <input
          type="checkbox"
          id="limitedQuestions"
          checked={limitedQuestions}
          onChange={handleLimitedQuestionsChange}
        />
        <label htmlFor="limitedQuestions">Limited questions</label>
      </div>
      {limitedQuestions && (
        <div className="number-of-questions">
          <div className="number-of-questions-input">
            <label htmlFor="numberOfQuestions">Number of questions:</label>
            <div className="input-wrapper">
              <input
                type="number"
                id="numberOfQuestions"
                value={numberOfQuestions}
                onChange={handleNumberOfQuestionsChange}
                min="1"
                max={totalAvailablePokemon}
                placeholder="0"
              />
            </div>
          </div>
          {!isNumberOfQuestionsValid() && getErrorMessage() && (
            <p className="error-message">{getErrorMessage()}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default LimitedQuestionsSelector;