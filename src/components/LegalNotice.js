import React from 'react';

function LegalNotice() {
  return (
    <details className="legal-notice">
      <summary>Legal<span className="legal-summary-extra"> &amp; credits</span></summary>
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
          Pokémon data references, sprites, and cries are provided by{' '}
          <a href="https://pokeapi.co/" target="_blank" rel="noopener noreferrer">PokéAPI</a>.
          {' '}Pokémon and Pokémon character names are trademarks of Nintendo.
        </p>
        <p>
          <a href="https://github.com/davidsarrat/pokecries" target="_blank" rel="noopener noreferrer">Source code</a>
          {' · '}
          <a href="https://github.com/PokeAPI/sprites" target="_blank" rel="noopener noreferrer">Sprite source</a>
          {' · '}
          <a href="https://github.com/PokeAPI/cries" target="_blank" rel="noopener noreferrer">Cry source</a>
        </p>
      </div>
    </details>
  );
}

export default LegalNotice;
