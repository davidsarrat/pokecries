import React from 'react';
import './LimitedAnswersSelector.css';

function LimitedAnswersSelector({ limitedAnswers, setLimitedAnswers, numberOfAnswers, setNumberOfAnswers }) {
  return (
    <div className="limited-answers-selector">
      <div className="limited-answers-checkbox">
        <input
          type="checkbox"
          id="limitedAnswers"
          checked={limitedAnswers}
          onChange={(e) => setLimitedAnswers(e.target.checked)}
        />
        <label htmlFor="limitedAnswers">Limited answers</label>
      </div>
      {limitedAnswers && (
        <div className="number-of-answers">
          <label htmlFor="numberOfAnswers">Number of answers:</label>
          <input
            type="number"
            id="numberOfAnswers"
            value={numberOfAnswers}
            onChange={(e) => setNumberOfAnswers(Math.max(2, parseInt(e.target.value) || 2))}
            min="2"
          />
        </div>
      )}
    </div>
  );
}

export default LimitedAnswersSelector;