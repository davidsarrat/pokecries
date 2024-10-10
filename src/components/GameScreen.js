import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import PokemonGrid from './PokemonGrid';
import Navbar from './Navbar';
import GameOverScreen from './GameOverScreen';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './GameScreen.css';
import pokemonData from '../data/pokemon.json';
import { scrollToTop } from '../utils/scrollUtils';

function GameScreen({ 
  selectedGenerations, 
  selectedGameMode, 
  onExit, 
  isTimeAttack,
  timeAttackSettings, 
  limitedAnswers, 
  numberOfAnswers, 
  keepCryOnError,
  hardcoreMode,
  limitedQuestions, 
  numberOfQuestions 
}) {
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredPokemonList, setFilteredPokemonList] = useState([]);
  const [shuffledPokemonList, setShuffledPokemonList] = useState([]);
  const navbarRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [failedPokemon, setFailedPokemon] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [animatingCards, setAnimatingCards] = useState(new Map());
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState((timeAttackSettings.minutes * 60 + timeAttackSettings.seconds) * 1000);
  const [timeGained, setTimeGained] = useState(0);
  const [timeLost, setTimeLost] = useState(0);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [startTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(null);
  const [allShiny, setAllShiny] = useState(false);
  const [shinyPartyActivated, setShinyPartyActivated] = useState(false);
  const [shinyAudio] = useState(new Audio(`${process.env.PUBLIC_URL}/media/sounds/shiny.mp3`));
  const [timer, setTimer] = useState(0);
  const [availablePokemonIndices, setAvailablePokemonIndices] = useState([]);
  const [isGameInitialized, setIsGameInitialized] = useState(false);
  const [gameState, setGameState] = useState({
    currentPokemon: null,
    visiblePokemon: [],
    progressCount: 0,
    correctCount: 0,
    incorrectCount: 0,
  });
  const updateInProgress = useRef(false);
  const [isGameReady, setIsGameReady] = useState(false);

  const memoizedPokemonList = useMemo(() => pokemonList, [pokemonList]);

  const resetSearch = useCallback(() => {
    if (navbarRef.current && navbarRef.current.getSearchTerm() !== '') {
      navbarRef.current.resetSearch();
      setFilteredPokemonList(pokemonList);
    }
  }, [pokemonList]);

  const showToast = (content, type) => {
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
  };

  const endGame = useCallback(() => {
    setIsGameFinished(true);
    setEndTime(Date.now());
    audioRef.current.pause();
    setGameOver(true);
  }, []);

  const playCurrentCry = useCallback((pokemon = gameState.currentPokemon, isAutoplay = false) => {
    if (pokemon) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
      audioRef.current = new Audio(`${process.env.PUBLIC_URL}/media/cries/${pokemon.id}.mp3`);
      setIsPlaying(true);
      audioRef.current.play()
        .then(() => {
          const handleEnded = () => {
            setIsPlaying(false);
            if (isAutoplay) {
              setIsAutoPlaying(false);
            }
            audioRef.current.removeEventListener('ended', handleEnded);
          };
          audioRef.current.addEventListener('ended', handleEnded);
        })
        .catch(error => {
          if (error.name !== 'AbortError') {
            console.error('Error playing audio:', error);
          }
          setIsPlaying(false);
          if (isAutoplay) {
            setIsAutoPlaying(false);
          }
        });
    }
  }, [gameState.currentPokemon]);

  const getRandomPokemon = useCallback(() => {
    if (selectedGameMode === 'pokedex_completer') {
      if (availablePokemonIndices.length === 0) {
        endGame();
        return null;
      }
      const randomIndex = Math.floor(Math.random() * availablePokemonIndices.length);
      const pokemonIndex = availablePokemonIndices[randomIndex];
      setAvailablePokemonIndices(prev => prev.filter((_, index) => index !== randomIndex));
      return pokemonList[pokemonIndex];
    } else {
      let randomPokemon;
      do {
        randomPokemon = pokemonList[Math.floor(Math.random() * pokemonList.length)];
      } while (randomPokemon.id === gameState.currentPokemon?.id);
      return randomPokemon;
    }
  }, [selectedGameMode, availablePokemonIndices, pokemonList, gameState.currentPokemon, endGame]);

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const selectVisiblePokemon = useCallback((allPokemon, currentPokemon) => {
    if (!limitedAnswers || numberOfAnswers >= allPokemon.length) {
      return allPokemon;
    } else {
      const availablePokemon = allPokemon.filter(p => p.id !== currentPokemon.id);
      const randomPokemon = [];
      const usedIndices = new Set();

      while (randomPokemon.length < numberOfAnswers - 1) {
        const randomIndex = Math.floor(Math.random() * availablePokemon.length);
        if (!usedIndices.has(randomIndex)) {
          usedIndices.add(randomIndex);
          randomPokemon.push(availablePokemon[randomIndex]);
        }
      }

      return [...randomPokemon, currentPokemon].sort(() => 0.5 - Math.random());
    }
  }, [limitedAnswers, numberOfAnswers]);

  const initializeGame = useCallback(() => {
    if (isGameInitialized) return;

    const selectedPokemon = selectedGenerations.flatMap(genKey => {
      return pokemonData[genKey] || [];
    });
    setPokemonList(selectedPokemon);
    
    const shuffled = shuffleArray([...selectedPokemon]);
    setShuffledPokemonList(shuffled);
    
    if (shuffled.length > 0) {
      const firstPokemon = shuffled[0];
      const initialVisiblePokemon = selectVisiblePokemon(selectedPokemon, firstPokemon);

      setGameState({
        currentPokemon: firstPokemon,
        visiblePokemon: initialVisiblePokemon,
        progressCount: -1,
        correctCount: 0,
        incorrectCount: 0,
      });
      
      setFilteredPokemonList(initialVisiblePokemon);
      
      if (selectedGameMode === 'pokedex_completer') {
        setAvailablePokemonIndices(prev => {
          const indexToRemove = selectedPokemon.findIndex(p => p.id === firstPokemon.id);
          return prev.filter((_, index) => index !== indexToRemove);
        });
      }
    }

    setIsGameInitialized(true);
    setIsGameReady(true);
  }, [selectedGenerations, selectedGameMode, selectVisiblePokemon]);

  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  const updateVisiblePokemon = useCallback((nextPokemon) => {
    if (updateInProgress.current) return;
    updateInProgress.current = true;

    setGameState(prevState => {
      const newProgressCount = prevState.progressCount + 1;
      
      if ((limitedQuestions && newProgressCount >= numberOfQuestions) ||
          (selectedGameMode === 'pokedex_completer' && newProgressCount >= pokemonList.length)) {
        endGame();
        return prevState;
      }

      const newVisiblePokemon = selectVisiblePokemon(pokemonList, nextPokemon);
      setFilteredPokemonList(newVisiblePokemon);

      return {
        ...prevState,
        currentPokemon: nextPokemon,
        visiblePokemon: newVisiblePokemon,
        progressCount: newProgressCount,
      };
    });

    setTimeout(() => {
      updateInProgress.current = false;
    }, 0);
  }, [limitedQuestions, numberOfQuestions, selectedGameMode, pokemonList, endGame, selectVisiblePokemon]);

  const moveToNextPokemon = useCallback(() => {
    if (!isGameInitialized || updateInProgress.current) return;

    if (limitedQuestions && gameState.progressCount + 1 >= numberOfQuestions) {
      endGame();
      return;
    }

    if (selectedGameMode === 'pokedex_completer' && gameState.progressCount + 1 >= pokemonList.length) {
      endGame();
      return;
    }

    const nextPokemon = getRandomPokemon();
    if (nextPokemon) {
      updateVisiblePokemon(nextPokemon);
      setTimeout(() => {
        setIsAutoPlaying(true);
        playCurrentCry(nextPokemon, true);
      }, 0);
    }
  }, [isGameInitialized, limitedQuestions, gameState.progressCount, numberOfQuestions, selectedGameMode, pokemonList.length, getRandomPokemon, playCurrentCry, endGame, updateVisiblePokemon]);

  const handlePokemonClick = useCallback((clickedPokemon) => {
    if (!isGameInitialized || updateInProgress.current) return;

    const isCorrect = clickedPokemon.id === gameState.currentPokemon.id;

    setGameState(prevState => ({
      ...prevState,
      correctCount: isCorrect ? prevState.correctCount + 1 : prevState.correctCount,
      incorrectCount: !isCorrect ? prevState.incorrectCount + 1 : prevState.incorrectCount,
    }));

    if (isCorrect) {
      if (isTimeAttack) {
        const gainTimeMs = timeAttackSettings.gainTime * 1000;
        setTimeLeftMs(prevTime => prevTime + gainTimeMs);
        setTimeGained(gainTimeMs);
        setTimeout(() => setTimeGained(0), 500);
      }
      showToast(
        <div>
          <img 
            src={`${process.env.PUBLIC_URL}/media/sprites/${gameState.currentPokemon.id}.png`} 
            alt={gameState.currentPokemon.name} 
            style={{width: '100%', height: '100%', objectFit: 'contain'}} 
          />
        </div>,
        'success'
      );
      resetSearch();
      moveToNextPokemon();
    } else {
      setFailedPokemon(prev => [...prev, gameState.currentPokemon]);
      
      if (hardcoreMode) {
        endGame();
        return;
      }
      
      if (isTimeAttack) {
        const loseTimeMs = timeAttackSettings.loseTime * 1000;
        const newTime = Math.max(0, timeLeftMs - loseTimeMs);
        setTimeLeftMs(newTime);
        setTimeLost(loseTimeMs);
        setTimeout(() => setTimeLost(0), 500);
        
        if (newTime <= 0) {
          endGame();
          return;
        }
      }
      
      if (keepCryOnError) {
        showToast(
          <div>
            <img 
              src={`${process.env.PUBLIC_URL}/media/sprites/0.png`} 
              alt="Unknown Pokémon"
              style={{width: '100%', height: '100%', objectFit: 'contain'}} 
            />
          </div>,
          'error'
        );
      } else {
        showToast(
          <div>
            <img 
              src={`${process.env.PUBLIC_URL}/media/sprites/${gameState.currentPokemon.id}.png`} 
              alt={gameState.currentPokemon.name} 
              style={{width: '100%', height: '100%', objectFit: 'contain'}} 
            />
          </div>,
          'error'
        );
        resetSearch();
        moveToNextPokemon();
      }
      
      playCurrentCry();
    }

    const shouldShowAnimations = !(limitedAnswers && !keepCryOnError) && 
                                 !(limitedAnswers && keepCryOnError && isCorrect);
    if (shouldShowAnimations) {
      setAnimatingCards(new Map([[clickedPokemon.id, { isCorrect }]]));
      
      setTimeout(() => {
        setAnimatingCards(new Map());
      }, 500);
    }
  }, [isGameInitialized, gameState.currentPokemon, keepCryOnError, limitedAnswers, moveToNextPokemon, playCurrentCry, resetSearch, isTimeAttack, timeAttackSettings, timeLeftMs, endGame, hardcoreMode]);

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
    scrollToTop();
  }, [gameState.visiblePokemon]);

  const handleEnterPress = useCallback((searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase()
      .replace(/♂/g, 'm')
      .replace(/♀/g, 'f')
      .replace(/[^a-z0-9mf]/g, '');

    if (normalizedSearchTerm === 'sarrat' && !shinyPartyActivated) {
      setAllShiny(true);
      setShinyPartyActivated(true);
      
      shinyAudio.play().catch(error => console.error("Error playing shiny sound:", error));
      
      const existingToasts = document.getElementsByClassName('Toastify__toast');
      for (let i = 0; i < existingToasts.length; i++) {
        existingToasts[i].style.display = 'none';
      }

      toast.dismiss();

      toast(
        <div>
          <img 
            src={`${process.env.PUBLIC_URL}/media/images/ludicolo.gif`}
            alt="Shiny Ludicolo"
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
  }, [filteredPokemonList, gameState.visiblePokemon, handlePokemonClick, shinyPartyActivated, shinyAudio]);

  const handleKeyPress = useCallback((event) => {
    const char = event.key;
    if ((/^[a-zA-Z0-9]$/.test(char) || char === 'Backspace') && navbarRef.current) {
      navbarRef.current.focusSearchInput();
    }
  }, []);

  const handleExitClick = () => {
    scrollToTop();
    endGame();
  };

  const formatTime = (time) => {
    const totalSeconds = typeof time === 'number' ? Math.floor(time / 1000) : time;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  useEffect(() => {
    if (isGameInitialized && gameState.currentPokemon) {
      playCurrentCry();
    }
  }, [isGameInitialized, gameState.currentPokemon, playCurrentCry]);

  useEffect(() => {
    if (!isTimeAttack && !isGameFinished) {
      const intervalId = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [isTimeAttack, isGameFinished]);

  useEffect(() => {
    if (isTimeAttack && !isGameFinished) {
      const intervalId = setInterval(() => {
        setTimeLeftMs(prevTime => {
          const newTime = prevTime - 1000;
          if (newTime <= 0) {
            clearInterval(intervalId);
            endGame();
            return 0;
          }
          return newTime;
        });
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [isTimeAttack, isGameFinished, endGame]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  useEffect(() => {
    if (navbarRef.current) {
      setNavbarHeight(navbarRef.current.offsetHeight);
    }
  }, [navbarRef]);

  useEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    if (gameOver) {
      setEndTime(Date.now());
    }
  }, [gameOver]);

  useEffect(() => {
    if (selectedGameMode === 'pokedex_completer') {
      setAvailablePokemonIndices([...Array(pokemonList.length).keys()]);
    }
  }, [selectedGameMode, pokemonList]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  if (!isGameReady) {
    return <div>Loading...</div>;
  }

  if (gameOver) {
    return (
      <GameOverScreen
        stats={{
          correctCount: gameState.correctCount,
          incorrectCount: gameState.incorrectCount,
          totalTime: formatTime(isTimeAttack ? Date.now() - startTime : timer * 1000)
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
        startTime={startTime}
        endTime={endTime}
      />
    );
  }

  if (pokemonList.length === 0) {
    return (
      <div className="game-container">
        <p className="error-message">No Pokémon selected. Please select at least one generation.</p>
      </div>
    );
  }

  return (
    <div className="game-container" style={{ paddingTop: `${navbarHeight}px` }}>
      <Navbar 
        ref={navbarRef}
        onPlayCry={() => playCurrentCry()}
        correctCount={gameState.correctCount}
        incorrectCount={gameState.incorrectCount}
        onSearch={handleSearch}
        onEnterPress={handleEnterPress}
        isPlaying={isPlaying || isAutoPlaying}
        progressCount={gameState.progressCount}
        totalCount={limitedQuestions ? numberOfQuestions : (selectedGameMode === 'pokedex_completer' ? shuffledPokemonList.length : undefined)}
        showProgress={true}
        timeLeft={isTimeAttack ? timeLeftMs : timer * 1000}
        showTimer={true}
        timeGained={timeGained}
        timeLost={timeLost}
        formatTime={formatTime}
        timer={timer}
        selectedGameMode={selectedGameMode}
        hardcoreMode={hardcoreMode}
      />
      <div className="game-content">
        <div className="game-screen">
          <PokemonGrid 
            pokemonList={memoizedPokemonList}
            visiblePokemonIds={filteredPokemonList.map(p => p.id)}
            onPokemonClick={handlePokemonClick}
            currentPokemon={gameState.currentPokemon}
            animatingCards={animatingCards}
            isGameOver={false}
            totalAvailablePokemon={memoizedPokemonList.length}
            allShiny={allShiny}
          />
        </div>
      </div>
      <footer className="game-footer">
        <p className="footer-text">
        <a href="https://davidsarratgonzalez.github.io" target="_blank" rel="noopener noreferrer">Made with ❤️ by <strong>David Sarrat González</strong></a>
        </p>
        <button className="exit-button" onClick={handleExitClick}>Exit Game</button>
      </footer>
      <ToastContainer className="toast-container-custom" />
    </div>
  );
}

export default React.memo(GameScreen);