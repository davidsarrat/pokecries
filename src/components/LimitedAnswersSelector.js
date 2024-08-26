import React from 'react';
import './LimitedAnswersSelector.css';

function LimitedAnswersSelector({ limitedAnswers, setLimitedAnswers, numberOfAnswers, setNumberOfAnswers }) {
  const handleLimitedAnswersChange = (e) => {
    setLimitedAnswers(e.target.checked);
  };

  const handleNumberOfAnswersChange = (e) => {
    const value = e.target.value;
    // Permitir cualquier número o un campo vacío
    if (value === '' || !isNaN(parseInt(value, 10))) {
      setNumberOfAnswers(value === '' ? '' : parseInt(value, 10));
    }
  };

  const isNumberOfAnswersValid = () => {
    return numberOfAnswers !== '' && numberOfAnswers >= 2;
  };

  return (
    <div className="limited-answers-selector">
      <div className="limited-answers-checkbox">
        <input
          type="checkbox"
          id="limitedAnswers"
          checked={limitedAnswers}
          onChange={handleLimitedAnswersChange}
        />
        <label htmlFor="limitedAnswers">Limited answers</label>
      </div>
      {limitedAnswers && (
        <div className="number-of-answers">
          <div className="number-of-answers-input">
            <label htmlFor="numberOfAnswers">Number of answers:</label>
            <input
              type="number"
              id="numberOfAnswers"
              value={numberOfAnswers}
              onChange={handleNumberOfAnswersChange}
              min="2"
              placeholder="0"
            />
          </div>
          {!isNumberOfAnswersValid() && (
            <p className="error-message">Number of answers must be at least 2!</p>
          )}
        </div>
      )}
    </div>
  );
}

export default LimitedAnswersSelector;