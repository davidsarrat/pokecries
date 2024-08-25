import React, { useState, useEffect, useCallback, useRef } from 'react';
import PokemonGrid from './PokemonGrid';
import Navbar from './Navbar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './GameScreen.css';
import pokemonData from '../data/pokemon.json';

function GameScreen({ selectedGenerations }) {
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredPokemonList, setFilteredPokemonList] = useState([]);
  const [currentPokemon, setCurrentPokemon] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const navbarRef = useRef(null);
  const audioRef = useRef(null);
  const [activeToast, setActiveToast] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const showToast = (content, type) => {
    if (activeToast) {
      const toastElement = document.getElementById(activeToast);
      if (toastElement) {
        toastElement.style.display = 'none';
      }
      toast.dismiss(activeToast);
    }

    const newToast = toast[type](content, {
      position: "bottom-right",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      onOpen: (props) => {
        setActiveToast(props.toastId);
      },
      onClose: () => setActiveToast(null),
    });

    setActiveToast(newToast);
  };

  useEffect(() => {
    const selectedPokemon = selectedGenerations.flatMap(genKey => {
      return pokemonData[genKey] || [];
    });
    setPokemonList(selectedPokemon);
    setFilteredPokemonList(selectedPokemon);
    if (selectedPokemon.length > 0) {
      setRandomPokemon(selectedPokemon);
    }
  }, [selectedGenerations]);

  useEffect(() => {
    if (currentPokemon) {
      playCurrentCry();
    }
  }, [currentPokemon]);

  const setRandomPokemon = (pokemonArray) => {
    const randomIndex = Math.floor(Math.random() * pokemonArray.length);
    setCurrentPokemon(pokemonArray[randomIndex]);
  };

  const playCurrentCry = () => {
    if (currentPokemon) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioRef.current = new Audio(`/media/cries/${currentPokemon.id}.mp3`);
      setIsPlaying(true);
      audioRef.current.play()
        .then(() => {
          audioRef.current.addEventListener('ended', () => setIsPlaying(false));
        })
        .catch(error => {
          console.error('Error playing audio:', error);
          setIsPlaying(false);
        });
    }
  };

  const resetSearch = () => {
    if (navbarRef.current) {
      navbarRef.current.resetSearch();
    }
    setFilteredPokemonList(pokemonList);
  };

  const handlePokemonClick = (clickedPokemon) => {
    if (isAnimating) return;

    setIsAnimating(true);
    setSelectedPokemon(clickedPokemon);

    if (clickedPokemon.id === currentPokemon.id) {
      setCorrectCount(correctCount + 1);
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
      setIncorrectCount(incorrectCount + 1);
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
    setTimeout(() => {
      resetSearch();
      setRandomPokemon(pokemonList);
      setSelectedPokemon(null);
      setIsAnimating(false);
    }, 1000);
  };

  const handleSearch = (searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filtered = pokemonList.filter(pokemon => 
      pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedSearchTerm)
    );
    setFilteredPokemonList(filtered);
  };

  const handleEnterPress = (searchTerm) => {
    if (isAnimating) return;

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

  if (pokemonList.length === 0) {
    return <div>No Pokémon selected. Please select at least one generation.</div>;
  }

  return (
    <div className="game-container">
      <Navbar 
        ref={navbarRef}
        onPlayCry={playCurrentCry}
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        onSearch={handleSearch}
        onEnterPress={handleEnterPress}
        isPlaying={isPlaying}
      />
      <div className="game-content">
        <div className="game-screen">
          <PokemonGrid 
            pokemonList={filteredPokemonList} 
            onPokemonClick={handlePokemonClick}
            currentPokemon={currentPokemon}
            selectedPokemon={selectedPokemon}
            isAnimating={isAnimating}
          />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default GameScreen;