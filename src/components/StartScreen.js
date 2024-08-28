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
  const [timeAttackSettings, setTimeAttackSettings] = useState({
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
  const [isTimeAttack, setIsTimeAttack] = useState(false);
  const [dontRepeatPokemon, setDontRepeatPokemon] = useState(true);

  // Load configuration from localStorage
  useEffect(() => {
    const savedConfig = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setSelectedGenerations(config.selectedGenerations || ['gen1']);
      setTimeAttackSettings(config.timeAttackSettings || { minutes: 2, seconds: 0, gainTime: 0, loseTime: 0 });
      setLimitedAnswers(config.limitedAnswers !== undefined ? config.limitedAnswers : true);
      setNumberOfAnswers(config.numberOfAnswers !== undefined ? config.numberOfAnswers : 4);
      setKeepCryOnError(config.keepCryOnError !== undefined ? config.keepCryOnError : false);
      setLimitedQuestions(config.limitedQuestions !== undefined ? config.limitedQuestions : true);
      setNumberOfQuestions(config.numberOfQuestions !== undefined ? config.numberOfQuestions : 10);
      setHardcoreMode(config.hardcoreMode !== undefined ? config.hardcoreMode : false);
      setIsTimeAttack(config.isTimeAttack !== undefined ? config.isTimeAttack : false);
      setDontRepeatPokemon(config.dontRepeatPokemon !== undefined ? config.dontRepeatPokemon : true);
    }
  }, []);

  // Save configuration to localStorage
  useEffect(() => {
    const config = {
      selectedGenerations,
      timeAttackSettings,
      limitedAnswers,
      numberOfAnswers,
      keepCryOnError,
      limitedQuestions,
      numberOfQuestions,
      hardcoreMode,
      isTimeAttack,
      dontRepeatPokemon
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  }, [
    selectedGenerations,
    timeAttackSettings,
    limitedAnswers,
    numberOfAnswers,
    keepCryOnError,
    limitedQuestions,
    numberOfQuestions,
    hardcoreMode,
    isTimeAttack,
    dontRepeatPokemon
  ]);

  const totalAvailablePokemon = useMemo(() => {
    return selectedGenerations.reduce((total, gen) => {
      return total + (pokemonData[gen] ? pokemonData[gen].length : 0);
    }, 0);
  }, [selectedGenerations]);

  const isTimeAttackValid = () => {
    const { minutes, seconds } = timeAttackSettings;
    return minutes > 0 || seconds > 0;
  };

  useEffect(() => {
    scrollToTop();
  }, []);

  const isStartButtonDisabled = () => {
    if (selectedGenerations.length === 0) return true;
    if (isTimeAttack && !isTimeAttackValid()) return true;
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
    if (isTimeAttack && timeAttackSettings.minutes === 0 && timeAttackSettings.seconds === 0) {
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
    setTimeout(() => {
      setGameStarted(true);
    }, 100);
  };

  const handleExitGame = () => {
    setGameStarted(false);
  };

  const startButtonClass = hardcoreMode ? 'start-button hardcore' : 'start-button';
  const gifSrc = hardcoreMode ? `${process.env.PUBLIC_URL}/media/images/darkrai.gif` : `${process.env.PUBLIC_URL}/media/images/chatot.gif`;
  const gifClass = hardcoreMode ? "darkrai-gif" : "chatot-gif";

  if (gameStarted) {
    return (
      <GameScreen 
        selectedGenerations={[...selectedGenerations].sort()} // Sort here
        setSelectedGenerations={setSelectedGenerations}
        selectedGameMode={dontRepeatPokemon ? 'pokedex_completer' : 'freestyle'}
        onExit={handleExitGame}
        timeAttackSettings={timeAttackSettings}
        setTimeAttackSettings={setTimeAttackSettings}
        limitedAnswers={limitedAnswers}
        setLimitedAnswers={setLimitedAnswers}
        numberOfAnswers={numberOfAnswers}
        setNumberOfAnswers={setNumberOfAnswers}
        keepCryOnError={keepCryOnError}
        setKeepCryOnError={setKeepCryOnError}
        limitedQuestions={limitedQuestions}
        numberOfQuestions={numberOfQuestions}
        hardcoreMode={hardcoreMode}
        isTimeAttack={isTimeAttack}
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
          id="timeAttack"
          checked={isTimeAttack}
          onChange={(e) => setIsTimeAttack(e.target.checked)}
        />
        <label htmlFor="timeAttack">Timed run</label>
      </div>
      {isTimeAttack && (
        <div className="time-attack-settings">
          <div className="time-setting">
            <label>Time:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={timeAttackSettings.minutes === 0 ? '' : timeAttackSettings.minutes} 
                onChange={(e) => setTimeAttackSettings(prev => ({ ...prev, minutes: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} 
                name="minutes"
                min="0" 
                placeholder="0"
              />
              <span>min</span>
              <input 
                type="number" 
                value={timeAttackSettings.seconds === 0 ? '' : timeAttackSettings.seconds} 
                onChange={(e) => setTimeAttackSettings(prev => ({ ...prev, seconds: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} 
                name="seconds"
                min="0" 
                max="59"
                placeholder="0"
              />
              <span>sec</span>
            </div>
          </div>
          {!isTimeAttackValid() && (
            <p className="error-message">Time must be greater than 00:00!</p>
          )}
          <div className="time-setting">
            <label>Time gain on correct:</label>
            <div className="time-inputs">
              <input 
                type="number" 
                value={timeAttackSettings.gainTime === 0 ? '' : timeAttackSettings.gainTime} 
                onChange={(e) => setTimeAttackSettings(prev => ({ ...prev, gainTime: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} 
                name="gainTime"
                min="0" 
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
                value={timeAttackSettings.loseTime === 0 ? '' : timeAttackSettings.loseTime} 
                onChange={(e) => setTimeAttackSettings(prev => ({ ...prev, loseTime: e.target.value === '' ? 0 : parseInt(e.target.value, 10) }))} 
                name="loseTime"
                min="0" 
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
        selectedGameMode={dontRepeatPokemon ? 'pokedex_completer' : 'freestyle'}
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