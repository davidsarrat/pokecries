import React from 'react';
import './GameOverScreen.css';
import PokemonCard from './PokemonCard';

function GameOverScreen({ stats, failedPokemon, onPlayAgain }) {
  const { correctCount, incorrectCount, totalTime } = stats;

  const playPokemonCry = (pokemonId) => {
    const audio = new Audio(`/media/cries/${pokemonId}.mp3`);
    audio.play();
  };

  return (
    <div className="game-over-container">
      <h1 className="game-over-title">Game Over!</h1>
      <div className="stats-container">
        <p>Correct: {correctCount}</p>
        <p>Incorrect: {incorrectCount}</p>
        <p>Total Time: {totalTime}</p>
      </div>
      
      {failedPokemon.length > 0 ? (
        <>
          <h2>Pokémon you missed:</h2>
          <div className="failed-pokemon-grid">
            {failedPokemon.map(pokemon => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                onClick={() => playPokemonCry(pokemon.id)}
              />
            ))}
          </div>
          <p className="better-luck">Better luck next time!</p>
        </>
      ) : (
        <h2 className="congratulations">Congratulations! You didn't miss any Pokémon!</h2>
      )}
      
      <button className="play-again-button" onClick={onPlayAgain}>
        Back to Main Menu
      </button>
    </div>
  );
}

export default GameOverScreen;