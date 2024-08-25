import React, { useState, useEffect, useCallback, useRef } from 'react';
import PokemonGrid from './PokemonGrid';
import Navbar from './Navbar';
import GameOverScreen from './GameOverScreen';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './GameScreen.css';
import pokemonData from '../data/pokemon.json';

function GameScreen({ selectedGenerations, selectedGameMode, onExit }) {
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

  const showToast = (content, type) => {
    const existingToasts = document.getElementsByClassName('Toastify__toast');
    for (let i = 0; i < existingToasts.length; i++) {
      existingToasts[i].style.display = 'none';
    }

    toast.dismiss();

    toast[type](content, {
      position: "bottom-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

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
  }, [currentPokemon]);

  useEffect(() => {
    if (selectedGameMode === 'pokedex_completer' && !isGameFinished) {
      timerRef.current = setInterval(() => {
        setTimer(prevTimer => prevTimer + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [selectedGameMode, isGameFinished]);

  const handlePokemonClick = (clickedPokemon) => {
    const isCorrect = clickedPokemon.id === currentPokemon.id;

    if (isCorrect) {
      setCorrectCount(prevCount => prevCount + 1);
      showToast(
        <div>
          <p>Correct!</p>
          <img 
            src={`/media/sprites/${currentPokemon.id}.png`} 
            alt={currentPokemon.name} 
            style={{width: '80px', height: '80px', objectFit: 'contain'}} 
          />
        </div>,
        'success'
      );
    } else {
      setIncorrectCount(prevCount => prevCount + 1);
      setFailedPokemon(prev => [...prev, currentPokemon]);
      showToast(
        <div>
          <p>Incorrect. It was <strong>{currentPokemon.name}</strong>!</p>
          <img 
            src={`/media/sprites/${currentPokemon.id}.png`} 
            alt={currentPokemon.name} 
            style={{width: '80px', height: '80px', objectFit: 'contain'}} 
          />
        </div>,
        'error'
      );
    }

    // Resetear la búsqueda inmediatamente
    resetSearch();

    // Mover al siguiente Pokémon inmediatamente
    moveToNextPokemon();

    // Iniciar o extender la animación para la carta clickeada
    setAnimatingCards(prev => {
      const newMap = new Map(prev);
      const now = Date.now();
      const existingTimeout = newMap.get(clickedPokemon.id);
      
      if (existingTimeout) {
        clearTimeout(existingTimeout.timeoutId);
      }

      const timeoutId = setTimeout(() => {
        setAnimatingCards(current => {
          const updatedMap = new Map(current);
          updatedMap.delete(clickedPokemon.id);
          return updatedMap;
        });
      }, 1000);

      newMap.set(clickedPokemon.id, {
        timeoutId,
        startTime: now,
        isCorrect: isCorrect
      });

      return newMap;
    });
  };

  const playCurrentCry = useCallback((pokemon = currentPokemon, isAutoplay = false) => {
    if (pokemon) {
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
        audioRef.current = new Audio(`/media/cries/${pokemon.id}.mp3`);
        setIsPlaying(true);
        audioRef.current.play()
          .then(() => {
            audioRef.current.addEventListener('ended', () => {
              setIsPlaying(false);
              if (isAutoplay) {
                // Si es autoplay, actualizar el estado para detener la animación del botón
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

  const moveToNextPokemon = useCallback(() => {
    const nextIndex = (currentPokemonIndex + 1) % shuffledPokemonList.length;
    const nextProgressCount = progressCount + 1;
    
    if (selectedGameMode === 'pokedex_completer' && nextProgressCount === shuffledPokemonList.length) {
      endGame();
    } else {
      const nextPokemon = shuffledPokemonList[nextIndex];
      setCurrentPokemonIndex(nextIndex);
      setCurrentPokemon(nextPokemon);
      setProgressCount(nextProgressCount);
      
      // Iniciar el autoplay y la animación del botón
      setIsAutoPlaying(true);
      setTimeout(() => {
        playCurrentCry(nextPokemon, true);
      }, 0);
    }
  }, [currentPokemonIndex, shuffledPokemonList, progressCount, selectedGameMode, playCurrentCry]);

  const resetSearch = () => {
    if (navbarRef.current) {
      navbarRef.current.resetSearch();
    }
    setFilteredPokemonList(pokemonList);
  };

  const handleSearch = (searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filtered = pokemonList.filter(pokemon => 
      pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedSearchTerm)
    );
    setFilteredPokemonList(filtered);
  };

  const handleEnterPress = (searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (filteredPokemonList.length === 1) {
      handlePokemonClick(filteredPokemonList[0]);
    } else {
      const exactMatches = pokemonList.filter(pokemon => 
        pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedSearchTerm
      );
      if (exactMatches.length === 1) {
        handlePokemonClick(exactMatches[0]);
      } else if (exactMatches.length > 1) {
        console.log('Multiple exact matches found');
      }
    }
  };

  const handleKeyPress = useCallback((event) => {
    const char = event.key;
    if ((/^[a-zA-Z0-9]$/.test(char) || char === 'Backspace') && navbarRef.current) {
      navbarRef.current.focusSearchInput();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleKeyPress]);

  const handleExitClick = () => {
    if (window.confirm("Are you sure you want to exit the game?")) {
      onExit();
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const endGame = () => {
    setIsGameFinished(true);
    clearInterval(timerRef.current);
    setGameOver(true);
  };

  if (gameOver) {
    return (
      <GameOverScreen
        stats={{
          correctCount,
          incorrectCount,
          totalTime: formatTime(timer)
        }}
        failedPokemon={failedPokemon}
        onPlayAgain={onExit}
      />
    );
  }

  if (pokemonList.length === 0) {
    return <div>No Pokémon selected. Please select at least one generation.</div>;
  }

  return (
    <div className="game-container">
      <Navbar 
        ref={navbarRef}
        onPlayCry={() => playCurrentCry()}
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        onSearch={handleSearch}
        onEnterPress={handleEnterPress}
        isPlaying={isPlaying || isAutoPlaying}
        progressCount={progressCount}
        totalPokemon={shuffledPokemonList.length}
        timer={timer}
        showProgress={selectedGameMode === 'pokedex_completer'}
      />
      <div className="game-content">
        <div className="game-screen">
          <PokemonGrid 
            pokemonList={filteredPokemonList} 
            onPokemonClick={handlePokemonClick}
            currentPokemon={currentPokemon}
            animatingCards={animatingCards}
          />
        </div>
      </div>
      <footer className="game-footer">
        <p className="footer-text">
          Made with ❤️ by <a href="https://davidsarratgonzalez.github.io" target="_blank" rel="noopener noreferrer">David Sarrat González</a>
        </p>
        <button className="exit-button" onClick={handleExitClick}>Exit Game</button>
      </footer>
      <ToastContainer />
    </div>
  );
}

export default GameScreen;