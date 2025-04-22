import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import './GameOverScreen.css';
import PokemonCard from './PokemonCard';
import { scrollToTop } from '../utils/scrollUtils';
import { getPokemonCryAudio, pokemonCryUrl, preloadAssets } from '../utils/assetUrls';
import { shouldAnimatePokemon } from '../utils/renderPerformance';

const RESULT_CRY_PRELOAD_LIMIT = 24;

function GameOverScreen({ stats, failedPokemon, onPlayAgain, startTime, endTime, pokemonTypes = {}, lastAnswerToast }) {
  const { correctCount, incorrectCount, progressCount, bestStreak = 0 } = stats;
  const audioRef = useRef(null);
  const audioPlaybackSequenceRef = useRef(0);
  const failedGridRef = useRef(null);
  const transitionTimerRef = useRef(null);
  const [isLeaving, setIsLeaving] = useState(false);
  const [lastToastPhase, setLastToastPhase] = useState(null);

  useEffect(() => {
    scrollToTop();
    document.body.style.touchAction = 'auto';
    document.documentElement.style.touchAction = 'auto';
    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      audioPlaybackSequenceRef.current += 1;
      if (audioRef.current) {
        audioRef.current.pause();
        if (audioRef.current.readyState > 0) audioRef.current.currentTime = 0;
        audioRef.current.onended = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!lastAnswerToast || Date.now() - lastAnswerToast.createdAt >= 1500) {
      return undefined;
    }

    setLastToastPhase('enter');
    const exitTimerId = setTimeout(() => setLastToastPhase('exit'), 1500);
    const hideTimerId = setTimeout(() => setLastToastPhase(null), 2000);

    return () => {
      clearTimeout(exitTimerId);
      clearTimeout(hideTimerId);
    };
  }, [lastAnswerToast]);

  const handleBackToMenu = () => {
    if (isLeaving) return;
    scrollToTop();
    setIsLeaving(true);
    transitionTimerRef.current = setTimeout(onPlayAgain, 240);
  };

  const playPokemonCry = useCallback((pokemon) => {
    const pokemonId = pokemon.id;
    audioPlaybackSequenceRef.current += 1;
    const playbackSequence = audioPlaybackSequenceRef.current;
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.readyState > 0) audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
    }
    const audio = getPokemonCryAudio(pokemonId);
    audioRef.current = audio;
    if (audio.readyState > 0) audio.currentTime = 0;
    audio.onended = () => {
      if (
        audioPlaybackSequenceRef.current === playbackSequence
        && audioRef.current === audio
      ) {
        audioRef.current = null;
        audio.onended = null;
      }
    };
    audio.play().catch(error => {
      if (
        audioPlaybackSequenceRef.current === playbackSequence
        && audioRef.current === audio
      ) {
        if (error.name !== 'AbortError') {
          console.error('Error playing result audio:', error);
        }
        audioRef.current = null;
        audio.onended = null;
      }
    });
  }, []);

  const totalTimeSeconds = ((endTime - startTime) / 1000).toFixed(4);
  const minutes = Math.floor(totalTimeSeconds / 60);
  const seconds = (totalTimeSeconds % 60).toFixed(4);

  const uniqueFailedPokemon = useMemo(
    () => Array.from(new Map(failedPokemon.map(pokemon => [pokemon.id, pokemon])).values()),
    [failedPokemon]
  );
  useEffect(() => {
    const resultCryUrls = uniqueFailedPokemon
      .slice(0, RESULT_CRY_PRELOAD_LIMIT)
      .map(pokemon => pokemonCryUrl(pokemon.id));
    if (resultCryUrls.length === 0) return;

    preloadAssets(resultCryUrls, undefined, { priority: 100 }).then(failedUrls => {
      if (failedUrls.length > 0) {
        console.warn(`Could not preload ${failedUrls.length} result cries.`);
      }
    });
  }, [uniqueFailedPokemon]);
  useEffect(() => {
    if (!failedGridRef.current || typeof IntersectionObserver !== 'function') return undefined;

    const observer = new IntersectionObserver(entries => {
      const visibleCryUrls = entries
        .filter(entry => entry.isIntersecting)
        .map(entry => {
          observer.unobserve(entry.target);
          return pokemonCryUrl(entry.target.dataset.pokemonId);
        });

      if (visibleCryUrls.length > 0) {
        preloadAssets(visibleCryUrls, undefined, { priority: 100 });
      }
    }, { rootMargin: '240px 0px' });

    failedGridRef.current
      .querySelectorAll('[data-pokemon-id]')
      .forEach(card => observer.observe(card));

    return () => observer.disconnect();
  }, [uniqueFailedPokemon]);
  const animateResults = shouldAnimatePokemon(uniqueFailedPokemon.length);

  return (
    <>
      {lastToastPhase && (
        <div className="Toastify__toast-container Toastify__toast-container--top-right toast-container-custom">
          <div
            className={`Toastify__toast Toastify__toast-theme--light Toastify__toast--default Toastify--animate Toastify__bounce-${lastToastPhase}--top-right custom-toast ${lastAnswerToast.type === 'success' ? 'correct-toast' : 'incorrect-toast'}`}
            role="status"
            aria-live="polite"
          >
            <div className="Toastify__toast-body">
              <div>{lastAnswerToast.content}</div>
            </div>
          </div>
        </div>
      )}
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
            <div ref={failedGridRef} className={`failed-pokemon-grid ${animateResults ? '' : 'is-dense-grid'}`}>
              {uniqueFailedPokemon.map(pokemon => (
                <PokemonCard
                  key={pokemon.id}
                  pokemon={pokemon}
                  onClick={playPokemonCry}
                  isGameOver={true}
                  animated={animateResults}
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
    </>
  );
}

export default GameOverScreen;
