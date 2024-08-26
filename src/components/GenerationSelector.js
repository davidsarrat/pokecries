import React from 'react';
import './GenerationSelector.css';

const generations = [
  { name: 'Gen I', key: 'gen1', icon: 'gen1icon.gif' },
  { name: 'Gen II', key: 'gen2', icon: 'gen2icon.gif' },
  { name: 'Gen III', key: 'gen3', icon: 'gen3icon.gif' },
  { name: 'Gen IV', key: 'gen4', icon: 'gen4icon.gif' },
  { name: 'Gen V', key: 'gen5', icon: 'gen5icon.gif' }
];

function GenerationSelector({ selectedGenerations, setSelectedGenerations }) {
  const toggleGeneration = (genKey) => {
    if (selectedGenerations.includes(genKey)) {
      setSelectedGenerations(selectedGenerations.filter(g => g !== genKey));
    } else {
      setSelectedGenerations([...selectedGenerations, genKey]);
    }
  };

  return (
    <div className="generation-selector">
      <h2>Select Generations</h2>
      <div className="btn-group-vertical">
        {generations.map(gen => (
          <button
            key={gen.key}
            className={`btn btn-outline-primary ${selectedGenerations.includes(gen.key) ? 'active' : ''}`}
            onClick={() => toggleGeneration(gen.key)}
          >
            <img src={`${process.env.PUBLIC_URL}/media/icons/${gen.icon}`} alt={`${gen.name} icon`} className="gen-icon" />
            <span>{gen.name}</span>
          </button>
        ))}
      </div>
      {selectedGenerations.length === 0 && (
        <p className="error-message">You must select at least one generation!</p>
      )}
    </div>
  );
}

export default GenerationSelector;