import React, { useEffect, useRef, useState } from 'react';

function LegalNotice() {
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  }, []);

  const handleSummaryClick = (event) => {
    event.preventDefault();
    if (isClosing) return;

    if (!isOpen) {
      setIsOpen(true);
      return;
    }

    setIsClosing(true);
    closeTimerRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 300);
  };

  return (
    <details className={`legal-notice ${isClosing ? 'is-closing' : ''}`} open={isOpen}>
      <summary onClick={handleSummaryClick}>Legal information</summary>
      <div className="legal-notice-reveal">
        <div className="legal-notice-content">
          <p><strong>Unofficial, non-commercial fan project.</strong></p>
          <p>
            PokéCries is not affiliated with, sponsored, endorsed, or approved by
            Nintendo, Creatures Inc., GAME FREAK inc., The Pokémon Company, or
            The Pokémon Company International.
          </p>
          <p>
            The MIT License applies only to original source code authored for
            this project. Pokémon names, characters, sprites, audio, artwork, and
            other third-party material are not covered by that license and remain
            subject to the rights of their respective owners.
          </p>
          <p>
            Pokémon data references and sprites are provided by{' '}
            <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokéAPI</a>.
            {' '}Cries are provided in MP3 format by{' '}
            <a href="https://pokemonshowdown.com/" target="_blank" rel="noopener noreferrer">Pokémon Showdown</a>.
            {' '}Pokémon and Pokémon character names are trademarks of Nintendo.
          </p>
          <p>
            Generation menu icons are also provided by PokéAPI.
            {' '}The Pocket Monk typeface is by{' '}
            <a href="https://chequered.ink/" target="_blank" rel="noopener noreferrer">Chequered Ink</a>
            {' '}and is used under its non-commercial terms.
          </p>
          <p>
            <a href="https://github.com/davidsarrat/pokecries" target="_blank" rel="noopener noreferrer">Source code</a>
            {' · '}
            <a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">Sprite source</a>
            {' · '}
            <a href="https://play.pokemonshowdown.com/audio/cries/" target="_blank" rel="noopener noreferrer">Cry source</a>
          </p>
        </div>
      </div>
    </details>
  );
}

export default LegalNotice;
