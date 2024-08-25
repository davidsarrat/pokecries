import React, { useRef } from 'react';
import './GameOverScreen.css';
import PokemonCard from './PokemonCard';

function GameOverScreen({ stats, failedPokemon, onPlayAgain, selectedGameMode }) {
  const { correctCount, incorrectCount, totalTime } = stats;
  const audioRef = useRef(null);

  const playPokemonCry = (pokemonId) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new Audio(`/media/cries/${pokemonId}.mp3`);
    audioRef.current.play();
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
        {(selectedGameMode === 'pokedex_completer' || selectedGameMode === 'freestyle') && (
          <div className="stat-item">
            <span className="stat-label">Total Time</span>
            <span className="stat-value time">{totalTime}</span>
          </div>
        )}
      </div>
      
      {failedPokemon.length > 0 ? (
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
      ) : (
        selectedGameMode === 'pokedex_completer' && (
          <h2 className="congratulations-title">Congratulations! You are a true Pokémon Master!</h2>
        )
      )}
      
      <button className="play-again-button" onClick={onPlayAgain}>
        Back to Main Menu
      </button>
    </div>
  );
}

export default GameOverScreen;