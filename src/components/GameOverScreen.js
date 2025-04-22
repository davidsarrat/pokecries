import React, { useRef, useEffect, useState, useCallback } from 'react';
import './GameOverScreen.css';
import PokemonCard from './PokemonCard';
import { scrollToTop } from '../utils/scrollUtils';
import { pokemonCryUrl } from '../utils/assetUrls';

const MAX_ANIMATED_RESULTS = 32;

function GameOverScreen({ stats, failedPokemon, onPlayAgain, startTime, endTime, pokemonTypes = {} }) {
  const { correctCount, incorrectCount, progressCount, bestStreak = 0 } = stats;
  const audioRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const [playingPokemonId, setPlayingPokemonId] = useState(null);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    scrollToTop();
    const allPokemonCards = document.querySelectorAll('.pokemon-card');
    allPokemonCards.forEach(card => {
      card.classList.remove('hidden');
    });

    document.body.style.touchAction = 'auto';
    document.documentElement.style.touchAction = 'auto';
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const handleBackToMenu = () => {
    if (isLeaving) return;
    scrollToTop();
    setIsLeaving(true);
    transitionTimerRef.current = setTimeout(onPlayAgain, 240);
  };

  const playPokemonCry = useCallback((pokemon) => {
    const pokemonId = pokemon.id;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    audioRef.current = new Audio(pokemonCryUrl(pokemonId));
    audioRef.current.play();
    setPlayingPokemonId(pokemonId);
    audioRef.current.addEventListener('ended', () => {
      setPlayingPokemonId(null);
    });
  }, []);

  const totalTimeSeconds = ((endTime - startTime) / 1000).toFixed(4);
  const minutes = Math.floor(totalTimeSeconds / 60);
  const seconds = (totalTimeSeconds % 60).toFixed(4);

  const uniqueFailedPokemon = Array.from(new Set(failedPokemon.map(p => p.id)))
    .map(id => failedPokemon.find(p => p.id === id));

  return (
    <div className={`game-over-container ${isLeaving ? 'is-leaving' : ''}`}>
      <h1 className="game-over-title" data-text="Game Over!">Game Over!</h1>
      <div className="stats-container">
        <div className="stat-item">
          <span className="stat-label">Correct</span>
          <span className="stat-value correct">{correctCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Incorrect</span>
          <span className="stat-value incorrect">{incorrectCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Rounds</span>
          <span className="stat-value rounds">{progressCount}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Best Streak</span>
          <span className="stat-value streak">{bestStreak}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Time</span>
          <span className="stat-value time">{minutes}:{seconds < 10 ? '0' : ''}{seconds}</span>
        </div>
      </div>
      
      {uniqueFailedPokemon.length > 0 && (
        <>
          <h2 className="failed-pokemon-title">Pokémon you missed:</h2>
          <div className={`failed-pokemon-grid ${uniqueFailedPokemon.length > MAX_ANIMATED_RESULTS ? 'is-dense-grid' : ''}`}>
            {uniqueFailedPokemon.map(pokemon => (
              <PokemonCard
                key={pokemon.id}
                pokemon={pokemon}
                onClick={playPokemonCry}
                isAnimating={playingPokemonId === pokemon.id}
                isGameOver={true}
                animated={uniqueFailedPokemon.length <= MAX_ANIMATED_RESULTS}
                types={pokemonTypes[pokemon.id]}
              />
            ))}
          </div>
        </>
      )}
      
      <button className="play-again-button" onClick={handleBackToMenu} disabled={isLeaving}>
        Back to Main Menu
      </button>

      <footer className="game-over-footer">
        <a href="https://github.com/davidsarrat" target="_blank" rel="noopener noreferrer">
          Made with ❤️ by <strong>David Sarrat González</strong>
        </a>
      </footer>
    </div>
  );
}

export default GameOverScreen;
