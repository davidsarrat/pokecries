import React from 'react';
import './GenerationSelector.css';

const generations = ['Gen I', 'Gen II', 'Gen III', 'Gen IV', 'Gen V'];

function GenerationSelector({ selectedGenerations, setSelectedGenerations }) {
  const toggleGeneration = (gen) => {
    if (selectedGenerations.includes(gen)) {
      setSelectedGenerations(selectedGenerations.filter(g => g !== gen));
    } else {
      setSelectedGenerations([...selectedGenerations, gen]);
    }
  };

  return (
    <div className="generation-selector">
      <h2>Select Generations</h2>
      <div className="btn-group-vertical">
        {generations.map(gen => (
          <button
            key={gen}
            className={`btn btn-outline-primary ${selectedGenerations.includes(gen) ? 'active' : ''}`}
            onClick={() => toggleGeneration(gen)}
          >
            {gen}
          </button>
        ))}
      </div>
    </div>
  );
}

export default GenerationSelector;