import React, { useEffect, useState } from 'react';
import './GradientOverlay.css';

const GradientOverlay = () => {
  const [navbarHeight, setNavbarHeight] = useState(0);

  useEffect(() => {
    const updateNavbarHeight = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        setNavbarHeight(navbar.offsetHeight);
      }
    };

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);

    return () => {
      window.removeEventListener('resize', updateNavbarHeight);
    };
  }, []);

  return (
    <div
      className="gradient-overlay"
      style={{
        top: `${navbarHeight}px`,
        height: `calc(100% - ${navbarHeight}px)`,
      }}
    />
  );
};

export default GradientOverlay;