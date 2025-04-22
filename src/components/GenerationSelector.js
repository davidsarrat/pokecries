import React from 'react';
import './GenerationSelector.css';
import { generationIconUrl } from '../utils/assetUrls';

const generations = [
  { name: 'Gen I', key: 'gen1', pokemonId: '25' },
  { name: 'Gen II', key: 'gen2', pokemonId: '250' },
  { name: 'Gen III', key: 'gen3', pokemonId: '384' },
  { name: 'Gen IV', key: 'gen4', pokemonId: '448' },
  { name: 'Gen V', key: 'gen5', pokemonId: '571' }
];

function GenerationSelector({ selectedGenerations, setSelectedGenerations, onPokemonCry }) {
  const toggleGeneration = (genKey, pokemonId) => {
    onPokemonCry(pokemonId);
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
            onClick={() => toggleGeneration(gen.key, gen.pokemonId)}
            aria-pressed={selectedGenerations.includes(gen.key)}
          >
            <span className="gen-button-content">
              <img
                src={generationIconUrl(gen.key)}
                alt={`${gen.name} icon`}
                className={`gen-icon gen-icon-${gen.key}`}
              />
              <span className="gen-label">{gen.name}</span>
            </span>
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
