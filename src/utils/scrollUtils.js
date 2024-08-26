export const scrollToTop = () => {
  setTimeout(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant' // Esto fuerza un scroll inmediato
    });
    document.body.scrollTop = 0; // Para Safari
    document.documentElement.scrollTop = 0; // Para Chrome, Firefox, IE y Opera
  }, 0);
};