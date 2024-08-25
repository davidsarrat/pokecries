import React, { useState, useEffect } from 'react';
import PokemonGrid from './PokemonGrid';
import './GameScreen.css';
import pokemonData from '../data/pokemon.json';

function GameScreen({ selectedGenerations }) {
  const [pokemonList, setPokemonList] = useState([]);
  const [currentPokemon, setCurrentPokemon] = useState(null);

  useEffect(() => {
    const selectedPokemon = selectedGenerations.flatMap(genKey => {
      return pokemonData[genKey] || [];
    });
    console.log('Selected Generations:', selectedGenerations);
    console.log('Selected Pokemon:', selectedPokemon);
    setPokemonList(selectedPokemon);
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
      alert('Correct!');
    } else {
      alert('Incorrect. Try again!');
    }
    setRandomPokemon(pokemonList);
  };

  if (pokemonList.length === 0) {
    return <div>No Pokémon selected. Please select at least one generation.</div>;
  }

  return (
    <div className="game-screen">
      <button className="play-cry-button" onClick={playCurrentCry} disabled={!currentPokemon}>
        Play Pokémon Cry
      </button>
      <PokemonGrid pokemonList={pokemonList} onPokemonClick={handlePokemonClick} />
    </div>
  );
}

export default GameScreen;