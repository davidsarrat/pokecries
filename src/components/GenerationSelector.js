import React from 'react';
import './GenerationSelector.css';
import { generationIconUrl } from '../utils/assetUrls';

const generations = [
  { name: 'Gen I', key: 'gen1', iconPokemonId: '25' },
  { name: 'Gen II', key: 'gen2', iconPokemonId: '251' },
  { name: 'Gen III', key: 'gen3', iconPokemonId: '384' },
  { name: 'Gen IV', key: 'gen4', iconPokemonId: '447' },
  { name: 'Gen V', key: 'gen5', iconPokemonId: '571' }
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
            <img src={generationIconUrl(gen.iconPokemonId)} alt={`${gen.name} icon`} className="gen-icon" />
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
