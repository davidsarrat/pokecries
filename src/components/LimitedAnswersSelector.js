import React from 'react';
import './LimitedAnswersSelector.css';

function LimitedAnswersSelector({ limitedAnswers, setLimitedAnswers, numberOfAnswers, setNumberOfAnswers }) {
  const handleLimitedAnswersChange = (e) => {
    setLimitedAnswers(e.target.checked);
  };

  const handleNumberOfAnswersChange = (e) => {
    setNumberOfAnswers(parseInt(e.target.value, 10));
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
        <label htmlFor="limitedAnswers">Limited Answers</label>
      </div>
      {limitedAnswers && (
        <div className="number-of-answers">
          <label htmlFor="numberOfAnswers">Number of Answers:</label>
          <input
            type="number"
            id="numberOfAnswers"
            value={numberOfAnswers}
            onChange={handleNumberOfAnswersChange}
            min="0"
          />
        </div>
      )}
    </div>
  );
}

export default LimitedAnswersSelector;