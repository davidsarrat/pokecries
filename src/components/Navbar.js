import React, { useState, useRef, forwardRef, useImperativeHandle, useEffect } from 'react';
import { FaPlay, FaCheck, FaTimes, FaClock } from 'react-icons/fa';
import './Navbar.css';

const Navbar = forwardRef(({ 
  onPlayCry, 
  correctCount, 
  incorrectCount, 
  onSearch, 
  onEnterPress, 
  isPlaying, 
  progressCount, 
  totalPokemon, 
  timer,
  showProgress, 
  timeLeft,
  showTimer,
  timeGained,
  timeLost,
  formatTime,
  selectedGameMode
}, ref) => {
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [timerClass, setTimerClass] = useState('');

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

  useEffect(() => {
    if (timeGained > 0) {
      setTimerClass('time-gained');
      setTimeout(() => setTimerClass(''), 500);
    } else if (timeLost > 0) {
      setTimerClass('time-lost');
      setTimeout(() => setTimerClass(''), 500);
    }
  }, [timeGained, timeLost]);

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
        {showProgress && selectedGameMode !== 'time_attack' && (
          <div className="score-item progress">
            <span>{progressCount}</span>
          </div>
        )}
        {showTimer && (
          <div className={`score-item timer ${timerClass}`}>
            <FaClock className="score-icon" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        )}
      </div>
    </nav>
  );
});

export default Navbar;