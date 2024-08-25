import React, { useEffect, useRef } from 'react';
import PokemonCard from './PokemonCard';
import './PokemonGrid.css';

function PokemonGrid({ pokemonList, visiblePokemon, onPokemonClick, currentPokemon, animatingCards }) {
  const gridRef = useRef(null);

  useEffect(() => {
    const handleImageLoad = () => {
      const images = gridRef.current.querySelectorAll('img');
      const allImagesLoaded = Array.from(images).every(img => img.complete);

      if (allImagesLoaded) {
        window.scrollTo(0, 0);
      }
    };

    const images = gridRef.current.querySelectorAll('img');
    images.forEach(img => {
      if (img.complete) {
        handleImageLoad();
      } else {
        img.addEventListener('load', handleImageLoad);
        img.addEventListener('error', handleImageLoad);
      }
    });

    return () => {
      images.forEach(img => {
        img.removeEventListener('load', handleImageLoad);
        img.removeEventListener('error', handleImageLoad);
      });
    };
  }, [pokemonList]);

  return (
    <div className="pokemon-grid" ref={gridRef}>
      {pokemonList.map(pokemon => {
        const animationInfo = animatingCards.get(pokemon.id);
        const isVisible = visiblePokemon.some(p => p.id === pokemon.id);
        return (
          <PokemonCard
            key={pokemon.id}
            pokemon={pokemon}
            onClick={() => onPokemonClick(pokemon)}
            isAnimating={!!animationInfo}
            isCorrect={animationInfo?.isCorrect}
            isVisible={isVisible}
          />
        );
      })}
    </div>
  );
}

export default PokemonGrid;