import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { FaPlay, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import './Navbar.css';

const Navbar = forwardRef(({ onPlayCry, correctCount, incorrectCount, onSearch, onEnterPress, isPlaying, progressCount, totalPokemon, timer, showProgress }, ref) => {
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

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  return (
    <nav className="navbar">
      <button 
        className={`play-cry-button ${isPlaying ? 'playing' : ''}`} 
        onClick={onPlayCry}
      >
        <FaPlay className="play-icon" />
        <span>Play Cry</span>
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
        <div className="score-item correct">
          <FaCheck className="score-icon" />
          <span>{correctCount}</span>
        </div>
        <div className="score-item incorrect">
          <FaTimes className="score-icon" />
          <span>{incorrectCount}</span>
        </div>
        {showProgress && (
          <>
            <div className="score-item progress">
              <span>{progressCount + 1}/{totalPokemon}</span>
            </div>
            <div className="score-item timer">
              <FaClock className="score-icon" />
              <span>{formatTime(timer)}</span>
            </div>
          </>
        )}
      </div>
    </nav>
  );
});

export default Navbar;