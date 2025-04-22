import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import PokemonGrid from './PokemonGrid';
import Navbar from './Navbar';
import GameOverScreen from './GameOverScreen';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './GameScreen.css';
import pokemonData from '../data/pokemon.json';
import { scrollToTop } from '../utils/scrollUtils';
import {
  animatedPokemonSpriteUrl,
  getPokemonCryAudio,
  pokemonCryUrl,
  pokemonSpriteUrl,
  preloadAssets,
  unknownPokemonSpriteUrl,
} from '../utils/assetUrls';
import { createGamePlan } from '../utils/gamePlan';

const INITIAL_PLAN_SIZE = 10;
const PLAN_REFILL_THRESHOLD = 3;
const PRELOAD_AHEAD_ROUNDS = 5;
const PRELOAD_AHEAD_CRIES = 10;
const MAX_ANIMATED_ANSWERS = 32;

const getCriticalRoundAssetUrls = round => {
  const animateCards = round.visiblePokemon.length <= MAX_ANIMATED_ANSWERS;
  return [
    pokemonCryUrl(round.pokemon.id),
    ...(!animateCards ? [animatedPokemonSpriteUrl(round.pokemon.id)] : []),
    ...round.visiblePokemon.map(pokemon => (
      animateCards ? animatedPokemonSpriteUrl(pokemon.id) : pokemonSpriteUrl(pokemon.id)
    )),
  ];
};

const getDeferredRoundAssetUrls = round => round.visiblePokemon
  .map(pokemon => (
    round.visiblePokemon.length <= MAX_ANIMATED_ANSWERS
      ? animatedPokemonSpriteUrl(pokemon.id, true)
      : pokemonSpriteUrl(pokemon.id, true)
  ));

const getCryAssetUrls = rounds => rounds.map(round => pokemonCryUrl(round.pokemon.id));

const getTargetAssetUrls = round => [animatedPokemonSpriteUrl(round.pokemon.id)];

const getPlannedAssetUrls = rounds => [
  ...rounds.flatMap(getCriticalRoundAssetUrls),
  ...rounds.flatMap(getDeferredRoundAssetUrls),
];

const CountdownScreen = ({ count, isPreparing, progress }) => (
  <div className="countdown-container" role="status" aria-live="polite">
    <div className="countdown-content">
      <p>{isPreparing ? 'Preparing your match' : 'Get ready'}</p>
      {isPreparing ? (
        <>
          <div className="match-preload-orb" aria-hidden="true" />
          <div
            className="match-preload-track"
            role="progressbar"
            aria-label="Loading planned match assets"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={progress}
          >
            <div className="match-preload-progress" style={{ width: `${progress}%` }} />
          </div>
          <span className="match-preload-label">{progress}%</span>
        </>
      ) : (
        <span key={count} className="countdown-number">{count}</span>
      )}
    </div>
  </div>
);

function GameScreen({ 
  selectedGenerations, 
  selectedGameMode, 
  onExit, 
  timedRun,
  timedRunSettings, 
  limitedAnswers, 
  numberOfAnswers, 
  keepCryOnError,
  hardcoreMode,
  limitedQuestions, 
  numberOfQuestions,
  setSelectedGenerations,
  pokemonTypes = {}
}) {
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredPokemonList, setFilteredPokemonList] = useState([]);
  const [shuffledPokemonList, setShuffledPokemonList] = useState([]);
  const navbarRef = useRef(null);
  const audioRef = useRef(null);
  const firstPokemonRef = useRef(null);
  const gamePlanRef = useRef([]);
  const isMountedRef = useRef(true);
  const streakTimeoutRef = useRef(null);
  const isAudioPlaying = useRef(false);
  const didInitialize = useRef(false);
  const shinyAudioRef = useRef(null);
  const [isGameFullyLoaded, setIsGameFullyLoaded] = useState(false);
  const [isCountdownReady, setIsCountdownReady] = useState(false);
  const [gamePreloadProgress, setGamePreloadProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [failedPokemon, setFailedPokemon] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [lastAnswerToast, setLastAnswerToast] = useState(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState((timedRunSettings.minutes * 60 + timedRunSettings.seconds) * 1000);
  const [timeGained, setTimeGained] = useState(0);
  const [timeLost, setTimeLost] = useState(0);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [gameDuration, setGameDuration] = useState(0);
  
  const [allShiny, setAllShiny] = useState(false);
  const [shinyPartyActivated, setShinyPartyActivated] = useState(false);
  const [timer, setTimer] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [streakBurst, setStreakBurst] = useState(null);
  const [isGameInitialized, setIsGameInitialized] = useState(false);
  const [gameState, setGameState] = useState({
    currentPokemon: null,
    visiblePokemon: [],
    progressCount: 0,
    correctCount: 0,
    incorrectCount: 0,
  });
  const updateInProgress = useRef(false);
  const [isGameReady, setIsGameReady] = useState(true);
  const visiblePokemonIds = useMemo(
    () => filteredPokemonList.map(pokemon => pokemon.id),
    [filteredPokemonList]
  );
  const denseGrid = gameState.visiblePokemon.length > MAX_ANIMATED_ANSWERS;

  const resetSearch = useCallback(() => {
    if (navbarRef.current && navbarRef.current.getSearchTerm() !== '') {
      navbarRef.current.resetSearch();
      setFilteredPokemonList(pokemonList);
      scrollToTop();
    }
  }, [pokemonList]);

  const showToast = useCallback((content, type) => {
    const existingToasts = document.getElementsByClassName('Toastify__toast');
    for (let i = 0; i < existingToasts.length; i++) {
      existingToasts[i].style.display = 'none';
    }

    toast.dismiss();

    toast(content, {
      position: "top-right",
      autoClose: 1000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      closeButton: false,
      onMouseEnter: toast.dismiss,
      className: `custom-toast ${type === 'success' ? 'correct-toast' : 'incorrect-toast'}`,
    });
  }, []);

  const rememberLastAnswerToast = useCallback((content, type) => {
    setLastAnswerToast({ content, type, createdAt: Date.now() });
  }, []);

  const stopCurrentCry = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.readyState > 0) audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current = null;
    }
    isAudioPlaying.current = false;
  }, []);

  const endGame = useCallback((addCurrentToFailed = false) => {
    if (addCurrentToFailed && gameState.currentPokemon) {
      setFailedPokemon(prev => [...prev, gameState.currentPokemon]);
    }
    setIsGameFinished(true);
    
    const currentEndTime = Date.now();
    setEndTime(currentEndTime);
    
    if (gameStartTime) {
      const duration = currentEndTime - gameStartTime;
      setGameDuration(duration);
    }
    
    stopCurrentCry();
    setGameOver(true);
    setGameState(prevState => ({
      ...prevState,
      currentPokemon: null
    }));
  }, [gameState.currentPokemon, gameStartTime, stopCurrentCry]);

  const playCurrentCry = useCallback((pokemon = gameState.currentPokemon, isAutoplay = false) => {
    const pokemonToPlay = pokemon || gameState.currentPokemon;
    
    if (!pokemonToPlay || isGameFinished) return;
    
    stopCurrentCry();
    setIsPlaying(false);
    setIsAutoPlaying(false);

    isAudioPlaying.current = true;
    setIsPlaying(true);
    if (isAutoplay) {
      setIsAutoPlaying(true);
    }

    const audio = getPokemonCryAudio(pokemonToPlay.id);
    if (audio.readyState > 0) audio.currentTime = 0;
    audioRef.current = audio;

    audio.onended = () => {
      if (audioRef.current === audio) {
        audioRef.current = null;
        setIsPlaying(false);
        isAudioPlaying.current = false;
        if (isAutoplay) {
          setIsAutoPlaying(false);
        }
      }
      audio.currentTime = 0;
      audio.onended = null;
    };

    return audio.play().catch(error => {
      if (audioRef.current === audio) {
        audioRef.current = null;
        console.error('Error playing audio:', error);
        setIsPlaying(false);
        isAudioPlaying.current = false;
        if (isAutoplay) {
          setIsAutoPlaying(false);
        }
      }
      audio.onended = null;
    });
  }, [gameState.currentPokemon, isGameFinished, stopCurrentCry]);

  const initializeGame = useCallback(() => {
    if (isGameInitialized) return;
    
    setIsGameInitialized(true);
    
    const selectedPokemon = selectedGenerations.flatMap(genKey => {
      return pokemonData[genKey] || [];
    });
    
    setPokemonList(selectedPokemon);
    
    if (selectedPokemon.length === 0) {
      console.error("No Pokémon selected, but game initialized with generations:", selectedGenerations);
      return;
    }

    setIsGameReady(true);

    const roundCount = limitedQuestions
      ? Number(numberOfQuestions)
      : selectedGameMode === 'dontRepeatPokemon'
        ? selectedPokemon.length
        : INITIAL_PLAN_SIZE;
    const plan = createGamePlan({
      pokemonList: selectedPokemon,
      roundCount,
      dontRepeat: selectedGameMode === 'dontRepeatPokemon',
      limitedAnswers,
      numberOfAnswers: Number(numberOfAnswers),
    });
    const firstRound = plan[0];
    const hasFullAnswerSet = !limitedAnswers
      || Number(numberOfAnswers) >= selectedPokemon.length;

    gamePlanRef.current = plan;
    setShuffledPokemonList(plan.map(round => round.pokemon));
    firstPokemonRef.current = firstRound.pokemon;
    setGameState({
      currentPokemon: firstRound.pokemon,
      visiblePokemon: firstRound.visiblePokemon,
      progressCount: 1,
      correctCount: 0,
      incorrectCount: 0,
    });
    setFilteredPokemonList(firstRound.visiblePokemon);

    const initialAssetUrls = [
      ...getCriticalRoundAssetUrls(firstRound),
      ...(keepCryOnError ? [unknownPokemonSpriteUrl()] : []),
    ];

    preloadAssets(initialAssetUrls, progress => {
      if (isMountedRef.current) setGamePreloadProgress(progress);
    }).then(failedUrls => {
      if (failedUrls.length > 0) {
        console.warn(`Could not preload ${failedUrls.length} planned assets; they will load on demand.`);
      }
      if (!isMountedRef.current) return;

      setGamePreloadProgress(100);
      setIsCountdownReady(true);

      const upcomingRounds = plan.slice(1, 1 + PRELOAD_AHEAD_ROUNDS);
      const upcomingCryRounds = plan.slice(1, 1 + PRELOAD_AHEAD_CRIES);
      const upcomingAssetUrls = hasFullAnswerSet
        ? upcomingRounds.flatMap(getTargetAssetUrls)
        : [
          ...upcomingRounds.flatMap(getCriticalRoundAssetUrls),
          ...upcomingRounds.flatMap(getDeferredRoundAssetUrls),
        ];
      preloadAssets([
        ...getCryAssetUrls(upcomingCryRounds),
        ...upcomingAssetUrls,
        ...getDeferredRoundAssetUrls(firstRound),
        animatedPokemonSpriteUrl('272', true),
        `${process.env.PUBLIC_URL}/media/sounds/shiny.mp3`,
      ]).then(backgroundFailures => {
        if (backgroundFailures.length > 0) {
          console.warn(`Could not preload ${backgroundFailures.length} background assets.`);
        }
      });
    });
  }, [isGameInitialized, selectedGenerations, selectedGameMode, limitedQuestions, numberOfQuestions, limitedAnswers, numberOfAnswers, keepCryOnError]);

  const ensurePlannedRound = useCallback((roundIndex) => {
    const isUnlimitedNormalMode = !limitedQuestions && selectedGameMode === 'normal';
    if (isUnlimitedNormalMode && gamePlanRef.current.length - roundIndex <= PLAN_REFILL_THRESHOLD) {
      const previousRound = gamePlanRef.current[gamePlanRef.current.length - 1];
      const previousPokemonId = previousRound?.pokemon.id;
      const extraRounds = createGamePlan({
        pokemonList,
        roundCount: INITIAL_PLAN_SIZE,
        dontRepeat: false,
        limitedAnswers,
        numberOfAnswers: Number(numberOfAnswers),
        previousPokemonId,
      });
      gamePlanRef.current = [...gamePlanRef.current, ...extraRounds];
    }

    const upcomingRounds = gamePlanRef.current.slice(
      roundIndex,
      roundIndex + PRELOAD_AHEAD_ROUNDS
    );
    const upcomingCryRounds = gamePlanRef.current.slice(
      roundIndex,
      roundIndex + PRELOAD_AHEAD_CRIES
    );
    const hasFullAnswerSet = !limitedAnswers
      || Number(numberOfAnswers) >= pokemonList.length;
    const upcomingAssetUrls = hasFullAnswerSet
      ? upcomingRounds.flatMap(getTargetAssetUrls)
      : getPlannedAssetUrls(upcomingRounds);
    preloadAssets([
      ...getCryAssetUrls(upcomingCryRounds),
      ...upcomingAssetUrls,
    ]).then(failedUrls => {
      if (failedUrls.length > 0) {
        console.warn(`Could not preload ${failedUrls.length} upcoming assets.`);
      }
    });

    return gamePlanRef.current[roundIndex] || null;
  }, [limitedQuestions, selectedGameMode, pokemonList, limitedAnswers, numberOfAnswers]);

  useEffect(() => {
    if (!isCountdownReady || isGameFullyLoaded) return undefined;

    const timeoutId = setTimeout(() => {
      if (countdown > 1) {
        setCountdown(value => value - 1);
        return;
      }

      setCountdown(0);
      playCurrentCry(firstPokemonRef.current, true);
      setIsGameFullyLoaded(true);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [countdown, isCountdownReady, isGameFullyLoaded, playCurrentCry]);

  useEffect(() => {
    if (!didInitialize.current) {
      if (!selectedGenerations || selectedGenerations.length === 0) {
        console.error("No generations selected! Using gen1 as fallback");
        const generationsToUse = ['gen1'];
        if (typeof setSelectedGenerations === 'function') {
          setSelectedGenerations(generationsToUse);
        }
      }
      
      didInitialize.current = true;
      
      initializeGame();
    }
  }, [initializeGame, selectedGenerations, setSelectedGenerations]);

  const updateVisiblePokemon = useCallback((nextRound) => {
    if (updateInProgress.current) return;
    updateInProgress.current = true;

    setGameState(prevState => {
      const newProgressCount = prevState.progressCount + 1;
      
      if ((limitedQuestions && newProgressCount > numberOfQuestions) ||
          (selectedGameMode === 'dontRepeatPokemon' && newProgressCount > pokemonList.length)) {
        endGame(false);
        return prevState;
      }

      setFilteredPokemonList(nextRound.visiblePokemon);

      return {
        ...prevState,
        currentPokemon: nextRound.pokemon,
        visiblePokemon: nextRound.visiblePokemon,
        progressCount: newProgressCount,
      };
    });

    setTimeout(() => {
      updateInProgress.current = false;
    }, 0);
  }, [limitedQuestions, numberOfQuestions, selectedGameMode, pokemonList, endGame]);

  const moveToNextPokemon = useCallback(() => {
    if (!isGameInitialized || updateInProgress.current) return;

    if (limitedQuestions && gameState.progressCount >= numberOfQuestions) {
      endGame();
      return;
    }

    if (selectedGameMode === 'dontRepeatPokemon' && gameState.progressCount >= pokemonList.length) {
      endGame();
      return;
    }

    const nextRound = ensurePlannedRound(gameState.progressCount);
    if (nextRound) {
      updateVisiblePokemon(nextRound);
      playCurrentCry(nextRound.pokemon, true);
    }
  }, [isGameInitialized, limitedQuestions, gameState.progressCount, numberOfQuestions, 
      selectedGameMode, pokemonList.length, ensurePlannedRound, playCurrentCry,
      endGame, updateVisiblePokemon]);

  // Add timestamp references to track time more precisely
  const startTimeRef = useRef(null);
  const lastTickRef = useRef(null);
  const remainingTimeRef = useRef(null);

  // Completely overhaul the timed run timer system to use a more precise approach
  useEffect(() => {
    // Clear any existing timer interval first
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    if (isGameFullyLoaded && timedRun && !isGameFinished) {
      // Initialize the timer only once at the beginning
      if (!gameStartTime) {
        const now = Date.now();
        setGameStartTime(now);
        startTimeRef.current = now;
        lastTickRef.current = now;
        
        // Calculate total milliseconds from settings
        const totalTimeMs = (timedRunSettings.minutes * 60 + timedRunSettings.seconds) * 1000;
        remainingTimeRef.current = totalTimeMs;
        
        // Set the visible time display
        setTimeLeftMs(totalTimeMs);
        
      }
      
      // Use a more precise timer that calculates actual elapsed time
      timerIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const elapsed = now - lastTickRef.current;
        lastTickRef.current = now;
        
        // Update the remaining time
        if (remainingTimeRef.current !== null) {
          remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
          
          // Update the visible time display (rounded to whole seconds for display)
          const displayTime = Math.ceil(remainingTimeRef.current / 1000) * 1000;
          setTimeLeftMs(displayTime);
          
          // End game when time runs out
          if (remainingTimeRef.current <= 0) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
            
            // Make sure we only end the game once
            setTimeout(() => {
              if (!isGameFinished) {
                endGame(true);
              }
            }, 0);
          }
        }
      }, 100); // Update more frequently for higher precision
      
      return () => {
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
      };
    }
  }, [isGameFullyLoaded, timedRun, isGameFinished, endGame, timedRunSettings, gameStartTime]);

  // Create functions to adjust time with precise control
  const addTime = useCallback((milliseconds) => {
    if (remainingTimeRef.current !== null) {
      remainingTimeRef.current = remainingTimeRef.current + milliseconds;
      
      // Update the visible time immediately
      const displayTime = Math.ceil(remainingTimeRef.current / 1000) * 1000;
      setTimeLeftMs(displayTime);
      
    }
  }, []);

  const subtractTime = useCallback((milliseconds) => {
    if (remainingTimeRef.current !== null) {
      remainingTimeRef.current = Math.max(0, remainingTimeRef.current - milliseconds);
      
      // Update the visible time immediately
      const displayTime = Math.ceil(remainingTimeRef.current / 1000) * 1000;
      setTimeLeftMs(displayTime);
      
      const willEndGame = remainingTimeRef.current <= 0;
      
      return willEndGame;
    }
    return false;
  }, []);

  // Modify handlePokemonClick to use the new precise time functions
  const handlePokemonClick = useCallback((clickedPokemon) => {
    if (!isGameInitialized || updateInProgress.current || isGameFinished) return undefined;

    const isCorrect = clickedPokemon.id === gameState.currentPokemon.id;

    setGameState(prevState => ({
      ...prevState,
      correctCount: isCorrect ? prevState.correctCount + 1 : prevState.correctCount,
      incorrectCount: !isCorrect ? prevState.incorrectCount + 1 : prevState.incorrectCount,
    }));

    if (isCorrect) {
      const nextStreak = correctStreak + 1;
      setCorrectStreak(nextStreak);
      setBestStreak(currentBest => Math.max(currentBest, nextStreak));

      if (nextStreak === 3 || nextStreak % 5 === 0) {
        if (streakTimeoutRef.current) clearTimeout(streakTimeoutRef.current);
        setStreakBurst(nextStreak);
        streakTimeoutRef.current = setTimeout(() => setStreakBurst(null), 900);
      }

      if (timedRun) {
        const gainTimeMs = timedRunSettings.gainTime * 1000;
        
        // Use precise time addition
        addTime(gainTimeMs);
        setTimeGained(gainTimeMs);
        
        setTimeout(() => setTimeGained(0), 500);
      }
      
      toast.dismiss();
      
      const toastContent = (
        <div className="answer-toast-content">
          <img 
            src={animatedPokemonSpriteUrl(gameState.currentPokemon.id)}
            alt={gameState.currentPokemon.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = pokemonSpriteUrl(gameState.currentPokemon.id);
            }}
          />
        </div>
      );
      rememberLastAnswerToast(toastContent, 'success');
      showToast(toastContent, 'success');
      resetSearch();
      moveToNextPokemon();
    } else {
      setCorrectStreak(0);
      setStreakBurst(null);
      if (streakTimeoutRef.current) clearTimeout(streakTimeoutRef.current);
      setFailedPokemon(prev => [...prev, gameState.currentPokemon]);

      const toastContent = keepCryOnError ?
        <div className="answer-toast-content">
          <img src={unknownPokemonSpriteUrl()} alt="Unknown Pokémon" />
        </div> :
        <div className="answer-toast-content">
          <img 
            src={animatedPokemonSpriteUrl(gameState.currentPokemon.id)}
            alt={gameState.currentPokemon.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = pokemonSpriteUrl(gameState.currentPokemon.id);
            }}
          />
        </div>;

      toast.dismiss();
      rememberLastAnswerToast(toastContent, 'error');
      showToast(toastContent, 'error');

      if (hardcoreMode) {
        endGame();
        return false;
      }
      
      if (timedRun) {
        const loseTimeMs = timedRunSettings.loseTime * 1000;
        
        // Use precise time subtraction and check if it will end the game
        const willEndGame = subtractTime(loseTimeMs);
        setTimeLost(loseTimeMs);
        
        setTimeout(() => setTimeLost(0), 500);
        
        // End the game if time ran out
        if (willEndGame) {
          setTimeout(() => {
            if (!isGameFinished) {
              endGame(true);
            }
          }, 100);
          return false;
        }
      }
      
      if (!keepCryOnError) {
        resetSearch();
        moveToNextPokemon();
      } else if (!isGameFinished) { 
        if (gameState.currentPokemon) {
          playCurrentCry(gameState.currentPokemon, false);
        }
      }
    }

    return isCorrect;
  }, [isGameInitialized, gameState.currentPokemon, keepCryOnError, moveToNextPokemon, playCurrentCry, resetSearch, timedRun, timedRunSettings, endGame, hardcoreMode, isGameFinished, showToast, rememberLastAnswerToast, addTime, subtractTime, correctStreak]);

  const handleSearch = useCallback((searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase()
      .replace(/♂/g, 'm')
      .replace(/♀/g, 'f')
      .replace(/[^a-z0-9mf]/g, '');
    
    const filtered = gameState.visiblePokemon.filter(pokemon => 
      pokemon.name.toLowerCase()
        .replace(/♂/g, 'm')
        .replace(/♀/g, 'f')
        .replace(/[^a-z0-9mf]/g, '')
        .includes(normalizedSearchTerm)
    );
    
    setFilteredPokemonList(filtered);
  }, [gameState.visiblePokemon]);

  const handleEnterPress = useCallback((searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase()
      .replace(/♂/g, 'm')
      .replace(/♀/g, 'f')
      .replace(/[^a-z0-9mf]/g, '');

    if (normalizedSearchTerm === 'sarrat' && !shinyPartyActivated) {
      setAllShiny(true);
      setShinyPartyActivated(true);
      
      if (!shinyAudioRef.current) {
        shinyAudioRef.current = new Audio(`${process.env.PUBLIC_URL}/media/sounds/shiny.mp3`);
      }
      
      shinyAudioRef.current.play().catch(error => console.error("Error playing shiny sound:", error));
      
      const existingToasts = document.getElementsByClassName('Toastify__toast');
      for (let i = 0; i < existingToasts.length; i++) {
        existingToasts[i].style.display = 'none';
      }

      toast.dismiss();

      toast(
        <div>
          <img 
            src={animatedPokemonSpriteUrl('272', true)}
            alt="Shiny Ludicolo"
            className="shiny-party-pokemon"
            style={{width: '100%', height: '100%', objectFit: 'contain'}} 
          />
          <p>🎉 Welcome to the shiny party! 🎉</p>
        </div>, 
        {
          position: "top-right",
          autoClose: 1500,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          progress: undefined,
          closeButton: false,
          className: 'custom-toast shiny-party-toast',
          onMouseEnter: toast.dismiss,
        }
      );
      if (navbarRef.current) {
        navbarRef.current.resetSearch();
      }
      return;
    }

    const exactMatch = filteredPokemonList.find(pokemon => 
      pokemon.name.toLowerCase()
        .replace(/♂/g, 'm')
        .replace(/♀/g, 'f')
        .replace(/[^a-z0-9mf]/g, '') === normalizedSearchTerm &&
      gameState.visiblePokemon.some(visible => visible.id === pokemon.id)
    );

    if (exactMatch) {
      handlePokemonClick(exactMatch);
      return;
    }

    const filteredVisiblePokemon = filteredPokemonList.filter(pokemon => 
      pokemon.name.toLowerCase()
        .replace(/♂/g, 'm')
        .replace(/♀/g, 'f')
        .replace(/[^a-z0-9mf]/g, '')
        .includes(normalizedSearchTerm) && 
      gameState.visiblePokemon.some(visible => visible.id === pokemon.id)
    );

    if (filteredVisiblePokemon.length === 1) {
      handlePokemonClick(filteredVisiblePokemon[0]);
    }
  }, [filteredPokemonList, gameState.visiblePokemon, handlePokemonClick, shinyPartyActivated]);

  const handleKeyPress = useCallback((event) => {
    const char = event.key;
    if ((/^[a-zA-Z0-9]$/.test(char) || char === 'Backspace') && navbarRef.current) {
      navbarRef.current.focusSearchInput();
    }
  }, []);

  const handleExitClick = () => {
    scrollToTop();
    endGame(true);
  };

  // Update formatTime to handle millisecond precision
  const formatTime = (time) => {
    const totalSeconds = typeof time === 'number' ? Math.ceil(time / 1000) : time;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    if (isGameFullyLoaded && !timedRun && !isGameFinished) {
      setTimer(0);
      
      if (!gameStartTime) {
        const startTime = Date.now();
        setGameStartTime(startTime);
      }
      
      const intervalId = setInterval(() => {
        if (gameStartTime) {
          const elapsedSeconds = Math.floor((Date.now() - gameStartTime) / 1000);
          setTimer(elapsedSeconds);
        } else {
          setTimer(prevTimer => prevTimer + 1);
        }
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [isGameFullyLoaded, timedRun, isGameFinished, gameStartTime]);

  const timerIntervalRef = useRef(null);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    if (gameOver) {
      setEndTime(Date.now());
    }
  }, [gameOver]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      if (streakTimeoutRef.current) {
        clearTimeout(streakTimeoutRef.current);
      }

      stopCurrentCry();
      
      if (shinyAudioRef.current) {
        shinyAudioRef.current.pause();
        shinyAudioRef.current.src = '';
        shinyAudioRef.current = null;
      }
    };
  }, [stopCurrentCry]);

  if (!isGameReady) {
    return <div className="game-container"></div>;
  }

  if (!isGameFullyLoaded && isGameReady) {
    return (
      <CountdownScreen
        count={countdown}
        isPreparing={!isCountdownReady}
        progress={gamePreloadProgress}
      />
    );
  }

  if (pokemonList.length === 0) {
    return (
      <div className="game-container">
        <p className="error-message">Loading Pokémon data... If this message persists, please return to the start screen.</p>
      </div>
    );
  }

  if (gameOver) {
    return (
      <GameOverScreen
        stats={{
          correctCount: gameState.correctCount,
          incorrectCount: gameState.incorrectCount,
          totalTime: formatTime(timedRun ? timeLeftMs : gameDuration),
          progressCount: gameState.progressCount,
          bestStreak,
        }}
        failedPokemon={failedPokemon}
        onPlayAgain={() => {
          setGameState(prevState => ({
            ...prevState,
            visiblePokemon: pokemonList,
          }));
          onExit();
        }}
        selectedGameMode={selectedGameMode}
        pokemonList={pokemonList}
        pokemonTypes={pokemonTypes}
        startTime={gameStartTime}
        endTime={endTime}
        lastAnswerToast={lastAnswerToast}
      />
    );
  }

  return (
    <div className="game-container">
      {streakBurst && (
        <div className="streak-burst" role="status" aria-live="polite">
          <span>Hot streak</span>
          <strong>×{streakBurst}</strong>
        </div>
      )}
      <Navbar
        ref={navbarRef}
        onPlayCry={() => playCurrentCry(gameState.currentPokemon, false)}
        correctCount={gameState.correctCount}
        incorrectCount={gameState.incorrectCount}
        onSearch={handleSearch}
        onEnterPress={handleEnterPress}
        isPlaying={isPlaying || isAutoPlaying}
        progressCount={gameState.progressCount}
        totalCount={limitedQuestions ? numberOfQuestions : (selectedGameMode === 'dontRepeatPokemon' ? shuffledPokemonList.length : undefined)}
        showProgress={true}
        timeLeft={timedRun ? timeLeftMs : timer * 1000}
        showTimer={true}
        timeGained={timeGained}
        timeLost={timeLost}
        formatTime={formatTime}
        timer={timer}
        selectedGameMode={selectedGameMode}
        hardcoreMode={hardcoreMode}
      />
      <div className="game-content">
        <div className="game-screen" data-card-count={filteredPokemonList.length}>
          <PokemonGrid
            pokemonList={pokemonList}
            visiblePokemonIds={visiblePokemonIds}
            onPokemonClick={handlePokemonClick}
            isGameOver={false}
            allShiny={allShiny}
            animatedSprites={!denseGrid}
            showAnswerFeedback={!limitedAnswers}
            denseGrid={denseGrid}
            pokemonTypes={pokemonTypes}
          />
        </div>
      </div>
      <footer className="game-footer">
        <p className="footer-text">
          <a href="https://github.com/davidsarrat" target="_blank" rel="noopener noreferrer">Made with ❤️ by <strong>David Sarrat González</strong></a>
        </p>
        <button className="exit-button" onClick={handleExitClick}>Exit Game</button>
      </footer>
      <ToastContainer className="toast-container-custom" />
    </div>
  );
}

export default React.memo(GameScreen);
