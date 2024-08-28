import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  setSelectedGenerations,
  selectedGameMode, 
  setSelectedGameMode,
  onExit, 
  timeAttackSettings, 
  setTimeAttackSettings,
  limitedAnswers, 
  setLimitedAnswers,
  numberOfAnswers, 
  setNumberOfAnswers,
  keepCryOnError,
  setKeepCryOnError,
  hardcoreMode,
  limitedQuestions, 
  numberOfQuestions 
}) {
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredPokemonList, setFilteredPokemonList] = useState([]);
  const [currentPokemon, setCurrentPokemon] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [shuffledPokemonList, setShuffledPokemonList] = useState([]);
  const [currentPokemonIndex, setCurrentPokemonIndex] = useState(0);
  const [progressCount, setProgressCount] = useState(0);
  const navbarRef = useRef(null);
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const timerRef = useRef(null);
  const [failedPokemon, setFailedPokemon] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [animatingCards, setAnimatingCards] = useState(new Map());
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [timeLeftMs, setTimeLeftMs] = useState((timeAttackSettings.minutes * 60 + timeAttackSettings.seconds) * 1000);
  const [timeGained, setTimeGained] = useState(0);
  const [timeLost, setTimeLost] = useState(0);
  const lastUpdateTimeRef = useRef(Date.now());
  const [visiblePokemon, setVisiblePokemon] = useState([]);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [startTime, setStartTime] = useState(Date.now());
  const [endTime, setEndTime] = useState(null);

  const resetSearch = useCallback(() => {
    if (navbarRef.current) {
      navbarRef.current.resetSearch();
    }
    setFilteredPokemonList(pokemonList);
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
    clearInterval(timerRef.current);
    setEndTime(Date.now());
    setGameOver(true);
  }, []);

  const playCurrentCry = useCallback((pokemon = currentPokemon, isAutoplay = false) => {
    if (pokemon) {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        audioRef.current = new Audio(`${process.env.PUBLIC_URL}/media/cries/${pokemon.id}.mp3`);
        setIsPlaying(true);
        audioRef.current.play()
          .then(() => {
            audioRef.current.addEventListener('ended', () => {
              setIsPlaying(false);
              if (isAutoplay) {
                setIsAutoPlaying(false);
              }
            });
          })
          .catch(error => {
            console.error('Error playing audio:', error);
            setIsPlaying(false);
            if (isAutoplay) {
              setIsAutoPlaying(false);
            }
          });
      } catch (error) {
        console.error('Error setting up audio:', error);
        setIsPlaying(false);
        if (isAutoplay) {
          setIsAutoPlaying(false);
        }
      }
    }
  }, [currentPokemon]);

  const getRandomPokemon = useCallback((excludePokemon = null) => {
    let newPokemon;
    do {
      const randomIndex = Math.floor(Math.random() * pokemonList.length);
      newPokemon = pokemonList[randomIndex];
    } while (excludePokemon && newPokemon.id === excludePokemon.id);
    return newPokemon;
  }, [pokemonList]);

  const moveToNextPokemon = useCallback(() => {
    if (selectedGameMode === 'time_attack' || selectedGameMode === 'freestyle') {
      const nextPokemon = getRandomPokemon(currentPokemon);
      setCurrentPokemon(nextPokemon);
      setProgressCount(prevCount => prevCount + 1);
      setTimeout(() => {
        setIsAutoPlaying(true);
        playCurrentCry(nextPokemon, true);
      }, 0);
    } else if (selectedGameMode === 'pokedex_completer') {
      let nextIndex;
      let nextPokemon;
      do {
        nextIndex = (currentPokemonIndex + 1) % shuffledPokemonList.length;
        nextPokemon = shuffledPokemonList[nextIndex];
      } while (nextPokemon.id === currentPokemon.id);

      const nextProgressCount = progressCount + 1;
      
      if (nextProgressCount === shuffledPokemonList.length) {
        endGame();
      } else {
        setCurrentPokemonIndex(nextIndex);
        setCurrentPokemon(nextPokemon);
        setProgressCount(nextProgressCount);
        setTimeout(() => {
          setIsAutoPlaying(true);
          playCurrentCry(nextPokemon, true);
        }, 0);
      }
    }

    if (limitedQuestions && progressCount + 1 >= numberOfQuestions) {
      endGame();
    }
  }, [selectedGameMode, shuffledPokemonList, progressCount, currentPokemonIndex, currentPokemon, getRandomPokemon, playCurrentCry, endGame, limitedQuestions, numberOfQuestions]);

  const handlePokemonClick = useCallback((clickedPokemon) => {
    const isCorrect = clickedPokemon.id === currentPokemon.id;

    if (isCorrect) {
      setCorrectCount(prevCount => prevCount + 1);
      if (selectedGameMode === 'time_attack') {
        const gainTimeMs = timeAttackSettings.gainTime * 1000;
        setTimeLeftMs(prevTime => prevTime + gainTimeMs);
        setTimeGained(gainTimeMs);
        setTimeout(() => setTimeGained(0), 500);
      }
      showToast(
        <div>
          <img 
            src={`${process.env.PUBLIC_URL}/media/sprites/${currentPokemon.id}.png`} 
            alt={currentPokemon.name} 
            style={{width: '100%', height: '100%', objectFit: 'contain'}} 
          />
        </div>,
        'success'
      );
      resetSearch();
      moveToNextPokemon();
    } else {
      setIncorrectCount(prevCount => prevCount + 1);
      setFailedPokemon(prev => [...prev, currentPokemon]);
      
      if (hardcoreMode) {
        endGame();
        return;
      }
      
      if (selectedGameMode === 'time_attack') {
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
              src={`${process.env.PUBLIC_URL}/media/sprites/${currentPokemon.id}.png`} 
              alt={currentPokemon.name} 
              style={{width: '100%', height: '100%', objectFit: 'contain'}} 
            />
          </div>,
          'error'
        );
      }
      
      playCurrentCry();
      
      if (!keepCryOnError) {
        resetSearch();
        moveToNextPokemon();
      }
    }

    const shouldShowAnimations = !(limitedAnswers && !keepCryOnError) && 
                                 !(limitedAnswers && keepCryOnError && isCorrect);
    if (shouldShowAnimations) {
      setAnimatingCards(new Map([[clickedPokemon.id, { isCorrect }]]));
      
      setTimeout(() => {
        setAnimatingCards(new Map());
      }, 500);
    }
  }, [currentPokemon, keepCryOnError, limitedAnswers, moveToNextPokemon, playCurrentCry, resetSearch, selectedGameMode, timeAttackSettings, timeLeftMs, endGame, hardcoreMode]);

  const handleSearch = (searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase()
      .replace(/♂/g, 'm')
      .replace(/♀/g, 'f')
      .replace(/[^a-z0-9mf]/g, '');
    const filtered = pokemonList.filter(pokemon => 
      pokemon.name.toLowerCase()
        .replace(/♂/g, 'm')
        .replace(/♀/g, 'f')
        .replace(/[^a-z0-9mf]/g, '')
        .includes(normalizedSearchTerm)
    );
    setFilteredPokemonList(filtered);
  };

  const handleEnterPress = useCallback((searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase()
      .replace(/♂/g, 'm')
      .replace(/♀/g, 'f')
      .replace(/[^a-z0-9mf]/g, '');
  
    const exactMatch = filteredPokemonList.find(pokemon => 
      pokemon.name.toLowerCase()
        .replace(/♂/g, 'm')
        .replace(/♀/g, 'f')
        .replace(/[^a-z0-9mf]/g, '') === normalizedSearchTerm &&
      visiblePokemon.some(visible => visible.id === pokemon.id)
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
      visiblePokemon.some(visible => visible.id === pokemon.id)
    );

    if (filteredVisiblePokemon.length === 1) {
      handlePokemonClick(filteredVisiblePokemon[0]);
    }
  }, [filteredPokemonList, visiblePokemon, handlePokemonClick]);

  const handleKeyPress = useCallback((event) => {
    const char = event.key;
    if ((/^[a-zA-Z0-9]$/.test(char) || char === 'Backspace') && navbarRef.current) {
      navbarRef.current.focusSearchInput();
    }
  }, []);

  const handleExitClick = () => {
    scrollToTop();
    onExit();
  };

  const formatTime = (time) => {
    const totalSeconds = typeof time === 'number' ? Math.floor(time / 1000) : time;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const updateVisiblePokemon = useCallback(() => {
    if (!limitedAnswers || numberOfAnswers >= pokemonList.length) {
      setVisiblePokemon(pokemonList);
    } else {
      const availablePokemon = pokemonList.filter(p => p.id !== currentPokemon.id);
      const randomPokemon = [];
      const usedIndices = new Set();

      while (randomPokemon.length < numberOfAnswers - 1) {
        const randomIndex = Math.floor(Math.random() * availablePokemon.length);
        if (!usedIndices.has(randomIndex)) {
          usedIndices.add(randomIndex);
          randomPokemon.push(availablePokemon[randomIndex]);
        }
      }

      setVisiblePokemon([...randomPokemon, currentPokemon].sort(() => 0.5 - Math.random()));
    }
  }, [limitedAnswers, numberOfAnswers, pokemonList, currentPokemon]);

  useEffect(() => {
    updateVisiblePokemon();
  }, [currentPokemon, updateVisiblePokemon]);

  useEffect(() => {
    const selectedPokemon = selectedGenerations.flatMap(genKey => {
      return pokemonData[genKey] || [];
    });
    setPokemonList(selectedPokemon);
    setFilteredPokemonList(selectedPokemon);
    
    const shuffled = [...selectedPokemon].sort(() => Math.random() - 0.5);
    setShuffledPokemonList(shuffled);
    
    if (shuffled.length > 0) {
      setCurrentPokemon(shuffled[0]);
      setCurrentPokemonIndex(0);
      setProgressCount(0);
    }
  }, [selectedGenerations]);

  useEffect(() => {
    if (currentPokemon) {
      playCurrentCry();
    }
  }, [currentPokemon, playCurrentCry]);

  useEffect(() => {
    let intervalId;
    if ((selectedGameMode === 'freestyle' || selectedGameMode === 'pokedex_completer') && !isGameFinished) {
      intervalId = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [selectedGameMode, isGameFinished]);

  useEffect(() => {
    let animationFrameId;
    
    const updateTimer = () => {
      if (selectedGameMode === 'time_attack' && timeLeftMs > 0 && !isGameFinished) {
        const now = Date.now();
        const deltaTime = now - lastUpdateTimeRef.current;
        lastUpdateTimeRef.current = now;

        setTimeLeftMs(prevTime => {
          const newTime = prevTime - deltaTime;
          if (newTime <= 0) {
            cancelAnimationFrame(animationFrameId);
            endGame();
            return 0;
          }
          return newTime;
        });

        animationFrameId = requestAnimationFrame(updateTimer);
      }
    };

    if (selectedGameMode === 'time_attack' && !isGameFinished) {
      animationFrameId = requestAnimationFrame(updateTimer);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [selectedGameMode, isGameFinished, timeLeftMs, endGame]);

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

  if (gameOver) {
    return (
      <GameOverScreen
        stats={{
          correctCount,
          incorrectCount,
          totalTime: formatTime(timer * 1000)
        }}
        failedPokemon={failedPokemon}
        onPlayAgain={() => {
          setVisiblePokemon(pokemonList); 
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
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        onSearch={handleSearch}
        onEnterPress={handleEnterPress}
        isPlaying={isPlaying || isAutoPlaying}
        progressCount={progressCount}
        totalCount={limitedQuestions ? numberOfQuestions : (selectedGameMode === 'pokedex_completer' ? shuffledPokemonList.length : undefined)}
        showProgress={true}
        timeLeft={selectedGameMode === 'time_attack' ? timeLeftMs : timer * 1000}
        showTimer={selectedGameMode === 'time_attack' || selectedGameMode === 'pokedex_completer' || selectedGameMode === 'freestyle'}
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
            pokemonList={filteredPokemonList} 
            visiblePokemon={visiblePokemon}
            onPokemonClick={handlePokemonClick}
            currentPokemon={currentPokemon}
            animatingCards={animatingCards}
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

export default GameScreen;