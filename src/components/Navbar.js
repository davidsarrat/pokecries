import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import './Navbar.css';

const Navbar = forwardRef(({ onPlayCry, correctCount, incorrectCount, onSearch, onEnterPress }, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    focusSearchInput: () => {
      searchInputRef.current.focus();
    },
    resetSearch: () => {
      setSearchTerm('');
      onSearch('');
    }
  }));

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onEnterPress(searchTerm);
    }
  };

  return (
    <nav className="navbar">
      <button className="play-cry-button" onClick={onPlayCry}>
        Play Pokémon Cry
      </button>
      <div className="search-container">
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search Pokémon..."
          value={searchTerm}
          onChange={handleSearch}
          onKeyPress={handleKeyPress}
        />
      </div>
      <div className="score-container">
        <span className="correct">Correct: {correctCount}</span>
        <span className="incorrect">Incorrect: {incorrectCount}</span>
      </div>
    </nav>
  );
});

export default Navbar;