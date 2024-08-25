import React, { useState, useEffect, useCallback, useRef } from 'react';
import PokemonGrid from './PokemonGrid';
import Navbar from './Navbar';
import './GameScreen.css';
import pokemonData from '../data/pokemon.json';

function GameScreen({ selectedGenerations }) {
  const [pokemonList, setPokemonList] = useState([]);
  const [filteredPokemonList, setFilteredPokemonList] = useState([]);
  const [currentPokemon, setCurrentPokemon] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const navbarRef = useRef(null);

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

  const setRandomPokemon = (pokemonArray) => {
    const randomIndex = Math.floor(Math.random() * pokemonArray.length);
    setCurrentPokemon(pokemonArray[randomIndex]);
  };

  const playCurrentCry = () => {
    if (currentPokemon) {
      const audio = new Audio(`/media/cries/${currentPokemon.id}.mp3`);
      audio.play().catch(error => console.error('Error playing audio:', error));
    }
  };

  const handlePokemonClick = (clickedPokemon) => {
    if (clickedPokemon.id === currentPokemon.id) {
      setCorrectCount(correctCount + 1);
      alert('Correct!');
    } else {
      setIncorrectCount(incorrectCount + 1);
      alert('Incorrect. Try again!');
    }
    setRandomPokemon(pokemonList);
  };

  const handleSearch = (searchTerm) => {
    const normalizedSearchTerm = searchTerm.toLowerCase().replace(/[^a-z0-9]/g, '');
    const filtered = pokemonList.filter(pokemon => 
      pokemon.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(normalizedSearchTerm)
    );
    setFilteredPokemonList(filtered);
  };

  const handleKeyPress = useCallback((event) => {
    const char = event.key;
    if (/^[a-zA-Z0-9]$/.test(char) && navbarRef.current) {
      navbarRef.current.focusSearchInput(char);
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
    <div className="game-screen">
      <Navbar 
        ref={navbarRef}
        onPlayCry={playCurrentCry}
        correctCount={correctCount}
        incorrectCount={incorrectCount}
        onSearch={handleSearch}
      />
      <PokemonGrid pokemonList={filteredPokemonList} onPokemonClick={handlePokemonClick} />
    </div>
  );
}

export default GameScreen;