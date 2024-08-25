import React from 'react';
import './GameOverScreen.css';
import PokemonCard from './PokemonCard';

function GameOverScreen({ stats, failedPokemon, onPlayAgain }) {
  const { correctCount, incorrectCount } = stats;

  const playPokemonCry = (pokemonId) => {
    const audio = new Audio(`/media/cries/${pokemonId}.mp3`);
    audio.play();
  };

  return (
    <div className="game-over-container">
      <h1 className="game-over-title">Game Over!</h1>
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-label">Correct</span>
          <span className="stat-value correct">{correctCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Incorrect</span>
          <span className="stat-value incorrect">{incorrectCount}</span>
        </div>
      </div>
      
      {failedPokemon.length > 0 && (
        <>
          <h2 className="failed-pokemon-title">Pokémon you missed:</h2>
          <div className="failed-pokemon-grid">
            {failedPokemon.map(pokemon => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                onClick={() => playPokemonCry(pokemon.id)}
              />
            ))}
          </div>
        </>
      )}
      
      <button className="play-again-button" onClick={onPlayAgain}>
        Back to Main Menu
      </button>
    </div>
  );
}

export default GameOverScreen;