import React from 'react';
import './GenerationSelector.css';

const generations = [
  { name: 'Gen I', icon: 'gen1icon.gif' },
  { name: 'Gen II', icon: 'gen2icon.gif' },
  { name: 'Gen III', icon: 'gen3icon.gif' },
  { name: 'Gen IV', icon: 'gen4icon.gif' },
  { name: 'Gen V', icon: 'gen5icon.gif' }
];

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
            key={gen.name}
            className={`btn btn-outline-primary ${selectedGenerations.includes(gen.name) ? 'active' : ''}`}
            onClick={() => toggleGeneration(gen.name)}
          >
            <img src={`/media/icons/${gen.icon}`} alt={`${gen.name} icon`} className="gen-icon" />
            <span>{gen.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default GenerationSelector;