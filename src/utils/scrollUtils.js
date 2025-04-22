export const scrollToTop = () => {
  setTimeout(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto'
    });
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
  }, 0);
};
