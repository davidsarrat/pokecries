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
  pokemonVariantSpriteAssetUrls,
  preloadAssets,
  resetRuntimeAssetCache,
  unknownPokemonSpriteUrl,
} from '../utils/assetUrls';
import { createGamePlan } from '../utils/gamePlan';
import { EAGER_DENSE_POKEMON, shouldAnimatePokemon } from '../utils/renderPerformance';
import { selectPokemonSpriteVariant } from '../data/pokemonSpriteVariants';

const INITIAL_PLAN_SIZE = 10;
const PLAN_REFILL_THRESHOLD = 3;
const PRELOAD_AHEAD_ROUNDS = 3;
const PRELOAD_AHEAD_CRIES = 10;
const AUDIO_START_TIMEOUT_MS = 1800;
const SHINY_PARTY_TOAST_ID = 'shiny-party';
const VARIANT_PRELOAD_BATCH_SIZE = 24;

const normalizePokemonName = name => name.toLowerCase()
  .replace(/♂/g, 'm')
  .replace(/♀/g, 'f')
  .replace(/[^a-z0-9mf]/g, '');

const withRandomSpriteVariant = pokemon => {
  const spriteVariant = selectPokemonSpriteVariant(pokemon.id);
  return spriteVariant ? { ...pokemon, spriteVariant } : pokemon;
};

const randomizeRoundSpriteVariants = rounds => rounds.map(round => {
  const visiblePokemon = round.visiblePokemon.map(withRandomSpriteVariant);
  return {
    ...round,
    pokemon: visiblePokemon.find(pokemon => pokemon.id === round.pokemon.id),
    visiblePokemon,
  };
});

const animatedSpriteUrl = (pokemon, shiny = false) => (
  animatedPokemonSpriteUrl(pokemon.id, shiny, pokemon.spriteVariant)
);

const staticSpriteUrl = (pokemon, shiny = false) => (
  pokemonSpriteUrl(pokemon.id, shiny, pokemon.spriteVariant)
);

const getCriticalRoundAssetUrls = round => {
  const animateCards = shouldAnimatePokemon(round.visiblePokemon.length);
  return [
    pokemonCryUrl(round.pokemon.id),
    ...(!animateCards ? [animatedSpriteUrl(round.pokemon)] : []),
    ...round.visiblePokemon.map(pokemon => (
      animateCards ? animatedSpriteUrl(pokemon) : staticSpriteUrl(pokemon)
    )),
  ];
};

const getDeferredRoundAssetUrls = round => (
  shouldAnimatePokemon(round.visiblePokemon.length)
    ? round.visiblePokemon.map(pokemon => animatedSpriteUrl(pokemon, true))
    : []
);

const getCryAssetUrls = rounds => rounds.map(round => pokemonCryUrl(round.pokemon.id));

const getTargetAssetUrls = round => [animatedSpriteUrl(round.pokemon)];

const getPlannedAssetUrls = rounds => [
  ...rounds.flatMap(getCriticalRoundAssetUrls),
  ...rounds.flatMap(getDeferredRoundAssetUrls),
];

const getInitialRoundAssetUrls = (round, hasFullAnswerSet) => (
  hasFullAnswerSet
    ? [
      pokemonCryUrl(round.pokemon.id),
      animatedSpriteUrl(round.pokemon),
      ...round.visiblePokemon
        .slice(0, EAGER_DENSE_POKEMON)
        .map(pokemon => staticSpriteUrl(pokemon)),
    ]
    : getCriticalRoundAssetUrls(round)
);

const preloadVariantAssets = async (urls, isActive) => {
  let failedCount = 0;
  for (let index = 0; index < urls.length && isActive(); index += VARIANT_PRELOAD_BATCH_SIZE) {
    const failedUrls = await preloadAssets(
      urls.slice(index, index + VARIANT_PRELOAD_BATCH_SIZE),
      undefined,
      { priority: 10 }
    );
    failedCount += failedUrls.length;
  }
  return failedCount;
};

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
  const navbarRef = useRef(null);
  const audioRef = useRef(null);
  const audioPlaybackSequenceRef = useRef(0);
  const audioRecoveryTimerRef = useRef(null);
  const pokemonClickHandlerRef = useRef(null);
  const firstPokemonRef = useRef(null);
  const gamePlanRef = useRef([]);
  const gamePlanStartIndexRef = useRef(0);
  const isMountedRef = useRef(true);
  const streakTimeoutRef = useRef(null);
  const timeGainedTimeoutRef = useRef(null);
  const timeLostTimeoutRef = useRef(null);
  const answerToastExitTimerRef = useRef(null);
  const answerToastHideTimerRef = useRef(null);
  const answerToastSequenceRef = useRef(0);
  const isAudioPlaying = useRef(false);
  const didInitialize = useRef(false);
  const shinyAudioRef = useRef(null);
  const lastAnswerToastRef = useRef(null);
  const [isGameFullyLoaded, setIsGameFullyLoaded] = useState(false);
  const [isCountdownReady, setIsCountdownReady] = useState(false);
  const [gamePreloadProgress, setGamePreloadProgress] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [failedPokemon, setFailedPokemon] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [lastAnswerToast, setLastAnswerToast] = useState(null);
  const [answerToast, setAnswerToast] = useState(null);
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
  const pokemonSearchIndex = useMemo(
    () => new Map(pokemonList.map(pokemon => [pokemon.id, normalizePokemonName(pokemon.name)])),
    [pokemonList]
  );
  const denseGrid = !shouldAnimatePokemon(gameState.visiblePokemon.length);
  const handlePokemonGridClick = useCallback(
    pokemon => pokemonClickHandlerRef.current?.(pokemon),
    []
  );

  const resetSearch = useCallback(() => {
    if (navbarRef.current && navbarRef.current.getSearchTerm() !== '') {
      navbarRef.current.resetSearch();
      setFilteredPokemonList(pokemonList);
      scrollToTop();
    }
  }, [pokemonList]);

  const clearAnswerToast = useCallback(() => {
    if (answerToastExitTimerRef.current) clearTimeout(answerToastExitTimerRef.current);
    if (answerToastHideTimerRef.current) clearTimeout(answerToastHideTimerRef.current);
    setAnswerToast(null);
  }, []);

  const showToast = useCallback((content, type) => {
    if (answerToastExitTimerRef.current) clearTimeout(answerToastExitTimerRef.current);
    if (answerToastHideTimerRef.current) clearTimeout(answerToastHideTimerRef.current);

    answerToastSequenceRef.current += 1;
    const toastSequence = answerToastSequenceRef.current;
    setAnswerToast({ content, type, phase: 'enter', sequence: toastSequence });

    answerToastExitTimerRef.current = setTimeout(() => {
      setAnswerToast(current => (
        current?.sequence === toastSequence
          ? { ...current, phase: 'exit' }
          : current
      ));
    }, 1500);
    answerToastHideTimerRef.current = setTimeout(() => {
      setAnswerToast(current => (
        current?.sequence === toastSequence ? null : current
      ));
    }, 2000);
  }, []);

  const rememberLastAnswerToast = useCallback((content, type) => {
    const answerToast = { content, type, createdAt: Date.now() };
    lastAnswerToastRef.current = answerToast;
    setLastAnswerToast(answerToast);
  }, []);

  const stopCurrentCry = useCallback(() => {
    audioPlaybackSequenceRef.current += 1;
    if (audioRecoveryTimerRef.current) {
      clearTimeout(audioRecoveryTimerRef.current);
      audioRecoveryTimerRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      if (audioRef.current.readyState > 0) audioRef.current.currentTime = 0;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.onplaying = null;
      audioRef.current.onstalled = null;
      audioRef.current.onwaiting = null;
      audioRef.current = null;
    }
    isAudioPlaying.current = false;
  }, []);

  const addFailedPokemon = useCallback((pokemon) => {
    if (!pokemon) return;
    const failedEntry = { ...pokemon, isShiny: allShiny };
    preloadAssets(
      [staticSpriteUrl(failedEntry, failedEntry.isShiny)],
      undefined,
      { priority: 50 }
    );
    setFailedPokemon(previous => {
      const existingIndex = previous.findIndex(failed => failed.id === failedEntry.id);
      if (existingIndex === -1) return [...previous, failedEntry];
      const updated = [...previous];
      updated[existingIndex] = failedEntry;
      return updated;
    });
  }, [allShiny]);

  const endGame = useCallback((addCurrentToFailed = false) => {
    if (addCurrentToFailed && gameState.currentPokemon) {
      addFailedPokemon(gameState.currentPokemon);
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
  }, [addFailedPokemon, gameState.currentPokemon, gameStartTime, stopCurrentCry]);

  const playCurrentCry = useCallback((pokemon = gameState.currentPokemon, isAutoplay = false, forceReload = false) => {
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

    const playbackSequence = audioPlaybackSequenceRef.current;

    const finishPlayback = (audio, error) => {
      if (
        audioPlaybackSequenceRef.current !== playbackSequence
        || audioRef.current !== audio
      ) return;

      if (audioRecoveryTimerRef.current) {
        clearTimeout(audioRecoveryTimerRef.current);
        audioRecoveryTimerRef.current = null;
      }
      audioRef.current = null;
      setIsPlaying(false);
      isAudioPlaying.current = false;
      if (isAutoplay) setIsAutoPlaying(false);
      if (audio.readyState > 0) audio.currentTime = 0;
      audio.onended = null;
      audio.onerror = null;
      audio.onplaying = null;
      audio.onstalled = null;
      audio.onwaiting = null;

      if (error && error.name !== 'AbortError') {
        console.error('Error playing audio:', error);
      }
    };

    const attemptPlayback = (reloadAudio, retriesRemaining) => {
      const audio = getPokemonCryAudio(pokemonToPlay.id, { forceReload: reloadAudio });
      let retired = false;
      audioRef.current = audio;
      if (audio.readyState > 0) audio.currentTime = 0;

      const clearRecoveryTimer = () => {
        if (audioRecoveryTimerRef.current) {
          clearTimeout(audioRecoveryTimerRef.current);
          audioRecoveryTimerRef.current = null;
        }
      };

      const recoverOrFinish = (error) => {
        if (
          retired
          || audioPlaybackSequenceRef.current !== playbackSequence
          || audioRef.current !== audio
        ) return;

        retired = true;
        clearRecoveryTimer();
        audio.pause();
        audio.onended = null;
        audio.onerror = null;
        audio.onplaying = null;
        audio.onstalled = null;
        audio.onwaiting = null;

        if (retriesRemaining > 0) {
          attemptPlayback(true, retriesRemaining - 1);
        } else {
          finishPlayback(audio, error);
        }
      };

      const scheduleRecovery = () => {
        clearRecoveryTimer();
        audioRecoveryTimerRef.current = setTimeout(() => {
          recoverOrFinish(new Error(`Cry playback stalled for Pokémon ${pokemonToPlay.id}`));
        }, AUDIO_START_TIMEOUT_MS);
      };

      audio.onplaying = clearRecoveryTimer;
      audio.onstalled = scheduleRecovery;
      audio.onwaiting = scheduleRecovery;
      audio.onerror = () => recoverOrFinish(audio.error || new Error('Cry playback failed'));
      audio.onended = () => {
        if (retired) return;
        retired = true;
        finishPlayback(audio);
      };

      scheduleRecovery();
      Promise.resolve(audio.play()).then(clearRecoveryTimer).catch(recoverOrFinish);
    };

    attemptPlayback(forceReload, 1);
  }, [gameState.currentPokemon, isGameFinished, stopCurrentCry]);

  const replayCurrentCry = useCallback(() => {
    const activeAudio = audioRef.current;
    const shouldReload = Boolean(
      activeAudio
      && (activeAudio.error || activeAudio.readyState < 3 || activeAudio.networkState === 3)
    );
    playCurrentCry(gameState.currentPokemon, false, shouldReload);
  }, [gameState.currentPokemon, playCurrentCry]);

  const initializeGame = useCallback(() => {
    if (isGameInitialized) return;
    
    setIsGameInitialized(true);
    
    const selectedPokemon = selectedGenerations.flatMap(genKey => {
      return pokemonData[genKey] || [];
    });
    
    if (selectedPokemon.length === 0) {
      console.error("No Pokémon selected, but game initialized with generations:", selectedGenerations);
      return;
    }

    setIsGameReady(true);

    const hasFullAnswerSet = !limitedAnswers
      || Number(numberOfAnswers) >= selectedPokemon.length;
    const plannedPokemon = hasFullAnswerSet
      ? selectedPokemon.map(withRandomSpriteVariant)
      : selectedPokemon;
    setPokemonList(plannedPokemon);

    const roundCount = limitedQuestions
      ? Number(numberOfQuestions)
      : selectedGameMode === 'dontRepeatPokemon'
        ? plannedPokemon.length
        : INITIAL_PLAN_SIZE;
    const basePlan = createGamePlan({
      pokemonList: plannedPokemon,
      roundCount,
      dontRepeat: selectedGameMode === 'dontRepeatPokemon',
      limitedAnswers,
      numberOfAnswers: Number(numberOfAnswers),
    });
    const plan = hasFullAnswerSet
      ? basePlan
      : randomizeRoundSpriteVariants(basePlan);
    const firstRound = plan[0];

    gamePlanRef.current = plan;
    gamePlanStartIndexRef.current = 0;
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
      ...getInitialRoundAssetUrls(firstRound, hasFullAnswerSet),
      ...(keepCryOnError ? [unknownPokemonSpriteUrl()] : []),
    ];

    preloadAssets(initialAssetUrls, progress => {
      if (isMountedRef.current) setGamePreloadProgress(progress);
    }, { priority: 100 }).then(failedUrls => {
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
      const reportBackgroundFailures = backgroundFailures => {
        if (backgroundFailures.length > 0) {
          console.warn(`Could not preload ${backgroundFailures.length} background assets.`);
        }
      };
      preloadAssets(
        getCryAssetUrls(upcomingCryRounds),
        undefined,
        { priority: 90 }
      ).then(reportBackgroundFailures);
      preloadAssets([
        ...upcomingAssetUrls,
        ...getDeferredRoundAssetUrls(firstRound),
        animatedPokemonSpriteUrl('272', true),
        `${process.env.PUBLIC_URL}/media/sounds/shiny.mp3`,
      ], undefined, { priority: 10 }).then(reportBackgroundFailures);

      const animateVariantSprites = shouldAnimatePokemon(firstRound.visiblePokemon.length);
      const variantAssetUrls = selectedPokemon.flatMap(pokemon => (
        pokemonVariantSpriteAssetUrls(pokemon.id, { animated: animateVariantSprites })
      ));
      preloadVariantAssets(variantAssetUrls, () => isMountedRef.current).then(failedCount => {
        if (failedCount > 0 && isMountedRef.current) {
          console.warn(`Could not preload ${failedCount} form sprites.`);
        }
      });
    });
  }, [isGameInitialized, selectedGenerations, selectedGameMode, limitedQuestions, numberOfQuestions, limitedAnswers, numberOfAnswers, keepCryOnError]);

  const ensurePlannedRound = useCallback((roundIndex) => {
    const isUnlimitedNormalMode = !limitedQuestions && selectedGameMode === 'normal';
    let planIndex = roundIndex - gamePlanStartIndexRef.current;

    if (isUnlimitedNormalMode && planIndex >= INITIAL_PLAN_SIZE) {
      gamePlanRef.current = gamePlanRef.current.slice(planIndex);
      gamePlanStartIndexRef.current = roundIndex;
      planIndex = 0;
    }

    if (isUnlimitedNormalMode && gamePlanRef.current.length - planIndex <= PLAN_REFILL_THRESHOLD) {
      const previousRound = gamePlanRef.current[gamePlanRef.current.length - 1];
      const previousPokemonId = previousRound?.pokemon.id;
      const baseExtraRounds = createGamePlan({
        pokemonList,
        roundCount: INITIAL_PLAN_SIZE,
        dontRepeat: false,
        limitedAnswers,
        numberOfAnswers: Number(numberOfAnswers),
        previousPokemonId,
      });
      const hasFullAnswerSet = !limitedAnswers
        || Number(numberOfAnswers) >= pokemonList.length;
      const extraRounds = hasFullAnswerSet
        ? baseExtraRounds
        : randomizeRoundSpriteVariants(baseExtraRounds);
      gamePlanRef.current = [...gamePlanRef.current, ...extraRounds];
    }

    const upcomingRounds = gamePlanRef.current.slice(
      planIndex,
      planIndex + PRELOAD_AHEAD_ROUNDS
    );
    const upcomingCryRounds = gamePlanRef.current.slice(
      planIndex,
      planIndex + PRELOAD_AHEAD_CRIES
    );
    const hasFullAnswerSet = !limitedAnswers
      || Number(numberOfAnswers) >= pokemonList.length;
    const upcomingAssetUrls = hasFullAnswerSet
      ? upcomingRounds.flatMap(getTargetAssetUrls)
      : getPlannedAssetUrls(upcomingRounds);
    const reportUpcomingFailures = failedUrls => {
      if (failedUrls.length > 0) {
        console.warn(`Could not preload ${failedUrls.length} upcoming assets.`);
      }
    };
    preloadAssets(
      getCryAssetUrls(upcomingCryRounds),
      undefined,
      { priority: 90 }
    ).then(reportUpcomingFailures);
    preloadAssets(
      upcomingAssetUrls,
      undefined,
      { priority: 50 }
    ).then(reportUpcomingFailures);

    return gamePlanRef.current[planIndex] || null;
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
      }, 250);
      
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
        if (timeGainedTimeoutRef.current) clearTimeout(timeGainedTimeoutRef.current);
        timeGainedTimeoutRef.current = setTimeout(() => setTimeGained(0), 500);
      }
      
      const toastContent = (
        <div className="answer-toast-content">
          <img 
            src={animatedSpriteUrl(gameState.currentPokemon, allShiny)}
            alt={gameState.currentPokemon.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = staticSpriteUrl(gameState.currentPokemon, allShiny);
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
      addFailedPokemon(gameState.currentPokemon);

      const toastContent = keepCryOnError ?
        <div className="answer-toast-content">
          <img src={unknownPokemonSpriteUrl()} alt="Unknown Pokémon" />
        </div> :
        <div className="answer-toast-content">
          <img 
            src={animatedSpriteUrl(gameState.currentPokemon, allShiny)}
            alt={gameState.currentPokemon.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = staticSpriteUrl(gameState.currentPokemon, allShiny);
            }}
          />
        </div>;

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
        if (timeLostTimeoutRef.current) clearTimeout(timeLostTimeoutRef.current);
        timeLostTimeoutRef.current = setTimeout(() => setTimeLost(0), 500);
        
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
  }, [addFailedPokemon, allShiny, isGameInitialized, gameState.currentPokemon, keepCryOnError, moveToNextPokemon, playCurrentCry, resetSearch, timedRun, timedRunSettings, endGame, hardcoreMode, isGameFinished, showToast, rememberLastAnswerToast, addTime, subtractTime, correctStreak]);

  const handleSearch = useCallback((searchTerm) => {
    const normalizedSearchTerm = normalizePokemonName(searchTerm);
    
    const filtered = gameState.visiblePokemon.filter(pokemon => 
      pokemonSearchIndex.get(pokemon.id)?.includes(normalizedSearchTerm)
    );
    
    setFilteredPokemonList(filtered);
  }, [gameState.visiblePokemon, pokemonSearchIndex]);

  const handleEnterPress = useCallback((searchTerm) => {
    const normalizedSearchTerm = normalizePokemonName(searchTerm);

    if (normalizedSearchTerm === 'sarrat' && !shinyPartyActivated) {
      setAllShiny(true);
      setShinyPartyActivated(true);
      
      if (!shinyAudioRef.current) {
        shinyAudioRef.current = new Audio(`${process.env.PUBLIC_URL}/media/sounds/shiny.mp3`);
      }
      
      shinyAudioRef.current.play().catch(error => console.error("Error playing shiny sound:", error));
      
      clearAnswerToast();

      toast(
        <div className="shiny-party-content">
          <span className="shiny-party-label">Shiny Party</span>
          <img 
            src={animatedPokemonSpriteUrl('272', true)}
            alt="Shiny Ludicolo"
            className="shiny-party-pokemon"
            style={{width: '100%', height: '100%', objectFit: 'contain'}} 
          />
          <p>Welcome to the shiny party!</p>
        </div>, 
        {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: true,
          closeOnClick: true,
          pauseOnHover: false,
          draggable: false,
          progress: undefined,
          closeButton: false,
          className: 'custom-toast shiny-party-toast',
          toastId: SHINY_PARTY_TOAST_ID,
        }
      );
      if (navbarRef.current) {
        navbarRef.current.resetSearch();
      }
      return;
    }

    const exactMatch = filteredPokemonList.find(
      pokemon => pokemonSearchIndex.get(pokemon.id) === normalizedSearchTerm
    );

    if (exactMatch) {
      handlePokemonClick(exactMatch);
      return;
    }

    if (filteredPokemonList.length === 1) {
      handlePokemonClick(filteredPokemonList[0]);
    }
  }, [clearAnswerToast, filteredPokemonList, handlePokemonClick, pokemonSearchIndex, shinyPartyActivated]);

  pokemonClickHandlerRef.current = handlePokemonClick;

  const handleKeyPress = useCallback((event) => {
    const char = event.key;
    if ((/^[a-zA-Z0-9]$/.test(char) || char === 'Backspace') && navbarRef.current) {
      navbarRef.current.focusSearchInput();
    }
  }, []);

  const handleExitClick = () => {
    scrollToTop();
    if (gameState.currentPokemon) {
      const toastContent = (
        <div className="answer-toast-content">
          <img
            src={animatedSpriteUrl(gameState.currentPokemon, allShiny)}
            alt={gameState.currentPokemon.name}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = staticSpriteUrl(gameState.currentPokemon, allShiny);
            }}
          />
        </div>
      );
      rememberLastAnswerToast(toastContent, 'error');
    }
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
      if (timeGainedTimeoutRef.current) clearTimeout(timeGainedTimeoutRef.current);
      if (timeLostTimeoutRef.current) clearTimeout(timeLostTimeoutRef.current);
      if (answerToastExitTimerRef.current) clearTimeout(answerToastExitTimerRef.current);
      if (answerToastHideTimerRef.current) clearTimeout(answerToastHideTimerRef.current);

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
          resetRuntimeAssetCache();
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
        lastAnswerToast={lastAnswerToastRef.current || lastAnswerToast}
      />
    );
  }

  return (
    <>
      {answerToast && (
        <div className="Toastify__toast-container Toastify__toast-container--top-right toast-container-custom">
          <div
            key={answerToast.sequence}
            className={`Toastify__toast Toastify__toast-theme--light Toastify__toast--default Toastify--animate Toastify__bounce-${answerToast.phase}--top-right custom-toast ${answerToast.type === 'success' ? 'correct-toast' : 'incorrect-toast'}`}
            role="alert"
          >
            <div className="Toastify__toast-body">
              <div>{answerToast.content}</div>
            </div>
          </div>
        </div>
      )}
      <div className="game-container">
      {streakBurst && (
        <div className="streak-burst" role="status" aria-live="polite">
          <span>Hot streak</span>
          <strong>×{streakBurst}</strong>
        </div>
      )}
      <Navbar
        ref={navbarRef}
        onPlayCry={replayCurrentCry}
        correctCount={gameState.correctCount}
        incorrectCount={gameState.incorrectCount}
        onSearch={handleSearch}
        onEnterPress={handleEnterPress}
        isPlaying={isPlaying || isAutoPlaying}
        progressCount={gameState.progressCount}
        totalCount={limitedQuestions ? numberOfQuestions : (selectedGameMode === 'dontRepeatPokemon' ? pokemonList.length : undefined)}
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
        <div className={`game-screen ${denseGrid ? 'is-dense-game-screen' : ''} ${filteredPokemonList.length === 0 ? 'is-empty' : ''}`.trim()} data-card-count={filteredPokemonList.length}>
          <PokemonGrid
            pokemonList={gameState.visiblePokemon}
            visiblePokemonIds={visiblePokemonIds}
            onPokemonClick={handlePokemonGridClick}
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
    </>
  );
}

export default React.memo(GameScreen);
