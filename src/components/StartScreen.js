import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import './StartScreen.css';
import GenerationSelector from './GenerationSelector';
import LimitedAnswersSelector from './LimitedAnswersSelector';
import GameOptionsSelector from './GameOptionsSelector';
import GameScreen from './GameScreen';
import { scrollToTop } from '../utils/scrollUtils';
import LimitedQuestionsSelector from './LimitedQuestionsSelector';
import pokemonData from '../data/pokemon.json';
import LegalNotice from './LegalNotice';
import { loadPokemonTypes } from '../utils/pokemonTypes';
import {
  animatedPokemonSpriteUrl,
  generationIconUrl,
  getPokemonCryAudio,
  pokemonCryUrl,
  preloadAssets,
} from '../utils/assetUrls';

const LOCAL_STORAGE_KEY = 'pokecries_start_screen_config';
const GENERATION_KEYS = ['gen1', 'gen2', 'gen3', 'gen4', 'gen5'];
const MENU_POKEMON_IDS = ['25', '250', '384', '448', '571', '441', '491'];
const MENU_ASSET_URLS = [
  ...GENERATION_KEYS.map(generationIconUrl),
  animatedPokemonSpriteUrl('441'),
  animatedPokemonSpriteUrl('491'),
  ...MENU_POKEMON_IDS.map(pokemonCryUrl),
];

function StartScreen() {
  const [selectedGenerations, setSelectedGenerations] = useState(['gen1']);
  const [gameStarted, setGameStarted] = useState(false);
  const [timedRunSettings, setTimedRunSettings] = useState({
    minutes: 2,
    seconds: 0,
    gainTime: 0,
    loseTime: 0
  });
  const [limitedAnswers, setLimitedAnswers] = useState(true);
  const [numberOfAnswers, setNumberOfAnswers] = useState(4);
  const [keepCryOnError, setKeepCryOnError] = useState(false);
  const [error, setError] = useState('');
  const [limitedQuestions, setLimitedQuestions] = useState(true);
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [hardcoreMode, setHardcoreMode] = useState(false);
  const [timedRun, setTimedRun] = useState(false);
  const [dontRepeatPokemon, setDontRepeatPokemon] = useState(true);
  const [preloadProgress, setPreloadProgress] = useState(0);
  const [isPreloadComplete, setIsPreloadComplete] = useState(false);
  const [pokemonTypes, setPokemonTypes] = useState({});
  const [isLeavingForGame, setIsLeavingForGame] = useState(false);
  const [isReturningFromGame, setIsReturningFromGame] = useState(false);
  const screenTransitionTimerRef = useRef(null);
  const menuAudioRef = useRef(null);
  const menuAudioSequenceRef = useRef(0);

  const stopMenuCry = useCallback(() => {
    menuAudioSequenceRef.current += 1;
    if (!menuAudioRef.current) return;

    menuAudioRef.current.pause();
    if (menuAudioRef.current.readyState > 0) menuAudioRef.current.currentTime = 0;
    menuAudioRef.current.onended = null;
    menuAudioRef.current = null;
  }, []);

  const playMenuCry = useCallback((pokemonId) => {
    stopMenuCry();
    const playbackSequence = menuAudioSequenceRef.current;
    const audio = getPokemonCryAudio(pokemonId);
    if (audio.readyState > 0) audio.currentTime = 0;
    menuAudioRef.current = audio;

    audio.onended = () => {
      if (
        menuAudioSequenceRef.current === playbackSequence
        && menuAudioRef.current === audio
      ) {
        menuAudioRef.current = null;
        audio.onended = null;
      }
    };

    audio.play().catch(error => {
      if (
        menuAudioSequenceRef.current === playbackSequence
        && menuAudioRef.current === audio
      ) {
        menuAudioRef.current = null;
        audio.onended = null;
        if (error.name !== 'AbortError') {
          console.error('Error playing menu audio:', error);
        }
      }
    });
  }, [stopMenuCry]);

  useEffect(() => {
    const savedConfig = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setSelectedGenerations(config.selectedGenerations || ['gen1']);
      setTimedRunSettings(config.timedRunSettings || { minutes: 2, seconds: 0, gainTime: 0, loseTime: 0 });
      setLimitedAnswers(config.limitedAnswers !== undefined ? config.limitedAnswers : true);
      setNumberOfAnswers(config.numberOfAnswers !== undefined ? config.numberOfAnswers : 4);
      setKeepCryOnError(config.keepCryOnError !== undefined ? config.keepCryOnError : false);
      setLimitedQuestions(config.limitedQuestions !== undefined ? config.limitedQuestions : true);
      setNumberOfQuestions(config.numberOfQuestions !== undefined ? config.numberOfQuestions : 10);
      setHardcoreMode(config.hardcoreMode !== undefined ? config.hardcoreMode : false);
      setTimedRun(config.timedRun !== undefined ? config.timedRun : false);
      setDontRepeatPokemon(config.dontRepeatPokemon !== undefined ? config.dontRepeatPokemon : true);
    }
  }, []);

  useEffect(() => {
    const config = {
      selectedGenerations,
      timedRunSettings,
      limitedAnswers,
      numberOfAnswers,
      keepCryOnError,
      limitedQuestions,
      numberOfQuestions,
      hardcoreMode,
      timedRun,
      dontRepeatPokemon
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  }, [
    selectedGenerations,
    timedRunSettings,
    limitedAnswers,
    numberOfAnswers,
    keepCryOnError,
    limitedQuestions,
    numberOfQuestions,
    hardcoreMode,
    timedRun,
    dontRepeatPokemon
  ]);

  const totalAvailablePokemon = useMemo(() => {
    return selectedGenerations.reduce((total, gen) => {
      return total + (pokemonData[gen] ? pokemonData[gen].length : 0);
    }, 0);
  }, [selectedGenerations]);

  const isTimedRunValid = () => {
    const { minutes, seconds } = timedRunSettings;
    return minutes > 0 || seconds > 0;
  };

  useEffect(() => {
    scrollToTop();

    return () => {
      if (screenTransitionTimerRef.current) {
        clearTimeout(screenTransitionTimerRef.current);
      }
      stopMenuCry();
    };
  }, [stopMenuCry]);

  useEffect(() => {
    let isMounted = true;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const loadAssets = async () => {
      const fontReady = document.fonts?.load
        ? Promise.all([
          document.fonts.load('76px "Pocket Monk"'),
          document.fonts.load('12px "Press Start 2P"'),
        ]).catch(error => {
          console.warn('Could not preload the game typefaces.', error);
        })
        : Promise.resolve();
      const typesReady = loadPokemonTypes().catch(error => {
        console.warn('Could not load Pokémon type colors.', error);
        return {};
      });
      const [failedUrls, loadedPokemonTypes] = await Promise.all([
        preloadAssets(MENU_ASSET_URLS, progress => {
          if (isMounted) setPreloadProgress(progress);
        }, { priority: 100 }),
        typesReady,
        fontReady,
      ]);

      if (failedUrls.length > 0) {
        console.warn(`Could not preload ${failedUrls.length} assets; the game will load them on demand.`);
      }

      if (isMounted) {
        setPokemonTypes(loadedPokemonTypes);
        setPreloadProgress(100);
        setIsPreloadComplete(true);
        document.body.style.overflow = previousOverflow;
      }
    };

    loadAssets();

    return () => {
      isMounted = false;
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const isStartButtonDisabled = () => {
    if (selectedGenerations.length === 0) return true;
    if (timedRun && !isTimedRunValid()) return true;
    if (limitedAnswers && (numberOfAnswers === '' || numberOfAnswers < 2)) return true;
    if (limitedQuestions && (numberOfQuestions === '' || numberOfQuestions < 1)) return true;
    if (dontRepeatPokemon && limitedQuestions && numberOfQuestions > totalAvailablePokemon) return true;
    return false;
  };

  const handleStartGame = () => {
    if (isLeavingForGame) return;

    if (selectedGenerations.length === 0) {
      setError('You must select at least one generation!');
      return;
    }
    if (timedRun && timedRunSettings.minutes === 0 && timedRunSettings.seconds === 0) {
      setError('Please set a time greater than 00:00 for timed runs!');
      return;
    }
    if (limitedAnswers && numberOfAnswers < 2) {
      setError('Number of answers must be at least 2 when Limited answers is enabled!');
      return;
    }
    if (limitedQuestions && numberOfQuestions < 1) {
      setError('Number of questions must be at least 1 when Limited questions is enabled!');
      return;
    }
    if (dontRepeatPokemon && limitedQuestions && numberOfQuestions > totalAvailablePokemon) {
      setError(`Number of questions (${numberOfQuestions}) exceeds the total number of available Pokémon (${totalAvailablePokemon}) for the selected generations!`);
      return;
    }
    setError('');
    stopMenuCry();
    scrollToTop();
    const generationsToUse = selectedGenerations.length > 0 ? selectedGenerations : ['gen1'];
    setSelectedGenerations(generationsToUse);
    setIsReturningFromGame(false);
    setIsLeavingForGame(true);
    screenTransitionTimerRef.current = setTimeout(() => {
      setGameStarted(true);
      setIsLeavingForGame(false);
    }, 240);
  };

  const handleExitGame = () => {
    preloadAssets(MENU_ASSET_URLS, undefined, { priority: 100 });
    setIsReturningFromGame(true);
    setGameStarted(false);
  };

  const handleHardcoreModeChange = (enabled) => {
    setHardcoreMode(enabled);
    playMenuCry(enabled ? '491' : '441');
  };

  const startButtonClass = hardcoreMode ? 'start-button hardcore' : 'start-button';
  const gifSrc = hardcoreMode
    ? animatedPokemonSpriteUrl('491')
    : animatedPokemonSpriteUrl('441');
  const gifClass = hardcoreMode ? "darkrai-gif" : "chatot-gif";

  const handleTimeSettingChange = (field, value) => {
    const parsedValue = value === '' ? 0 : Math.max(0, parseInt(value, 10));
    setTimedRunSettings(prev => ({ ...prev, [field]: parsedValue }));
  };

  if (gameStarted) {
    return (
      <GameScreen 
        selectedGenerations={[...selectedGenerations].sort()}
        setSelectedGenerations={setSelectedGenerations}
        selectedGameMode={dontRepeatPokemon ? 'dontRepeatPokemon' : 'normal'}
        onExit={handleExitGame}
        timedRun={timedRun}
        timedRunSettings={timedRunSettings}
        limitedAnswers={limitedAnswers}
        setLimitedAnswers={setLimitedAnswers}
        numberOfAnswers={numberOfAnswers}
        setNumberOfAnswers={setNumberOfAnswers}
        keepCryOnError={keepCryOnError}
        setKeepCryOnError={setKeepCryOnError}
        limitedQuestions={limitedQuestions}
        numberOfQuestions={numberOfQuestions}
        hardcoreMode={hardcoreMode}
        isTimeAttack={timedRun}
        pokemonTypes={pokemonTypes}
      />
    );
  }

  return (
    <div className={`start-screen ${isPreloadComplete ? 'is-ready' : ''} ${isLeavingForGame ? 'is-leaving-for-game' : ''} ${isReturningFromGame ? 'is-returning-from-game' : ''}`}>
      {!isPreloadComplete && (
        <div className="initial-loader" role="status" aria-live="polite">
          <div className="initial-loader-card">
            <div className="initial-loader-title">PokéCries</div>
            <p>Loading the menu...</p>
            <div
              className="initial-loader-track"
              role="progressbar"
              aria-label="Loading menu assets"
              aria-valuemin="0"
              aria-valuemax="100"
              aria-valuenow={preloadProgress}
            >
              <div className="initial-loader-progress" style={{ width: `${preloadProgress}%` }} />
            </div>
            <span className="initial-loader-percentage">{preloadProgress}%</span>
          </div>
        </div>
      )}
      <h1 className="title" data-text="PokéCries">PokéCries</h1>
      <p className="subtitle">Can you guess the Pokémon by its cry?</p>
      <GenerationSelector 
        selectedGenerations={selectedGenerations}
        setSelectedGenerations={setSelectedGenerations}
        onPokemonCry={playMenuCry}
      />
      <h2 className="settings-title">Game Rules</h2>
      <div className="dont-repeat-pokemon-checkbox">
        <input
          type="checkbox"
          id="dontRepeatPokemon"
          checked={dontRepeatPokemon}
          onChange={(e) => setDontRepeatPokemon(e.target.checked)}
        />
        <label htmlFor="dontRepeatPokemon">Don't repeat Pokémon</label>
      </div>
      <div className="time-attack-checkbox">
        <input
          type="checkbox"
          id="timedRun"
          checked={timedRun}
          onChange={(e) => setTimedRun(e.target.checked)}
        />
        <label htmlFor="timedRun">Timed run</label>
      </div>
      {timedRun && (
        <div className="time-attack-settings">
          <div className="time-setting">
            <label>Time:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={timedRunSettings.minutes === 0 ? '' : timedRunSettings.minutes} 
                onChange={(e) => handleTimeSettingChange('minutes', e.target.value)} 
                name="minutes"
                min="0" 
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                placeholder="0"
              />
              <span>min</span>
              <input 
                type="number" 
                value={timedRunSettings.seconds === 0 ? '' : timedRunSettings.seconds} 
                onChange={(e) => handleTimeSettingChange('seconds', e.target.value)} 
                name="seconds"
                min="0" 
                max="59"
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                placeholder="0"
              />
              <span>sec</span>
            </div>
          </div>
          {!isTimedRunValid() && (
            <p className="error-message">Time must be greater than 00:00!</p>
          )}
          <div className="time-setting">
            <label>Time gain on correct:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={timedRunSettings.gainTime === 0 ? '' : timedRunSettings.gainTime} 
                onChange={(e) => handleTimeSettingChange('gainTime', e.target.value)} 
                name="gainTime"
                min="0" 
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                placeholder="0"
              />
              <span>sec</span>
            </div>
          </div>
          <div className="time-setting">
            <label>Time loss on incorrect:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={timedRunSettings.loseTime === 0 ? '' : timedRunSettings.loseTime} 
                onChange={(e) => handleTimeSettingChange('loseTime', e.target.value)} 
                name="loseTime"
                min="0" 
                onKeyDown={(e) => {
                  if (e.key === '-' || e.key === 'e') {
                    e.preventDefault();
                  }
                }}
                placeholder="0"
              />
              <span>sec</span>
            </div>
          </div>
        </div>
      )}
      <LimitedQuestionsSelector
        limitedQuestions={limitedQuestions}
        setLimitedQuestions={setLimitedQuestions}
        numberOfQuestions={numberOfQuestions}
        setNumberOfQuestions={setNumberOfQuestions}
        selectedGenerations={selectedGenerations}
        selectedGameMode={dontRepeatPokemon ? 'dontRepeatPokemon' : 'normal'}
      />
      <LimitedAnswersSelector
        limitedAnswers={limitedAnswers}
        setLimitedAnswers={setLimitedAnswers}
        numberOfAnswers={numberOfAnswers}
        setNumberOfAnswers={setNumberOfAnswers}
      />
      <GameOptionsSelector
        keepCryOnError={keepCryOnError}
        setKeepCryOnError={setKeepCryOnError}
        hardcoreMode={hardcoreMode}
        setHardcoreMode={handleHardcoreModeChange}
      />
      <button 
        className={startButtonClass}
        onClick={handleStartGame}
        disabled={isStartButtonDisabled() || isLeavingForGame}
      >
        <span className="start-button-label">Start Game</span>
        <img
          src={gifSrc}
          alt={hardcoreMode ? "Darkrai" : "Chatot"}
          className={gifClass}
        />
      </button>
      {error && <p className="error-message">{error}</p>}
      <footer className="start-screen-footer">
        <a href="https://github.com/davidsarrat" target="_blank" rel="noopener noreferrer">
          Made with ❤️ by <strong>David Sarrat González</strong>
        </a>
      </footer>
      <LegalNotice />
    </div>
  );
}

export default StartScreen;
