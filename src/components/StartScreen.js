import React, { useState, useEffect, useMemo } from 'react';
import './StartScreen.css';
import GenerationSelector from './GenerationSelector';
import LimitedAnswersSelector from './LimitedAnswersSelector';
import GameOptionsSelector from './GameOptionsSelector';
import GameScreen from './GameScreen';
import { scrollToTop } from '../utils/scrollUtils';
import LimitedQuestionsSelector from './LimitedQuestionsSelector';
import pokemonData from '../data/pokemon.json';

const LOCAL_STORAGE_KEY = 'pokecries_start_screen_config';

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
    scrollToTop();
    const generationsToUse = selectedGenerations.length > 0 ? selectedGenerations : ['gen1'];
    console.log("Starting game with generations:", generationsToUse);
    setSelectedGenerations(generationsToUse);
    setGameStarted(true);
  };

  const handleExitGame = () => {
    setGameStarted(false);
  };

  const startButtonClass = hardcoreMode ? 'start-button hardcore' : 'start-button';
  const gifSrc = hardcoreMode ? `${process.env.PUBLIC_URL}/media/images/darkrai.gif` : `${process.env.PUBLIC_URL}/media/images/chatot.gif`;
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
      />
    );
  }

  return (
    <div className="start-screen">
      <h1 className="title">PokéCries</h1>
      <p className="subtitle">Can you guess the Pokémon by its cry?</p>
      <GenerationSelector 
        selectedGenerations={selectedGenerations}
        setSelectedGenerations={setSelectedGenerations}
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
        setHardcoreMode={setHardcoreMode}
      />
      <button 
        className={startButtonClass}
        onClick={handleStartGame}
        disabled={isStartButtonDisabled()}
      >
        Start Game
        <img 
          src={gifSrc} 
          alt={hardcoreMode ? "Darkrai" : "Chatot"} 
          className={gifClass}
        />
      </button>
      {error && <p className="error-message">{error}</p>}
      <footer className="start-screen-footer">
        <a href="https://davidsarratgonzalez.github.io" target="_blank" rel="noopener noreferrer">
          Made with ❤️ by <strong>David Sarrat González</strong>
        </a>
      </footer>
    </div>
  );
}

export default StartScreen;