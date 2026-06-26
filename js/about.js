/**
 * About Page Slideshow Engine
 */
document.addEventListener("DOMContentLoaded", () => {
  const images = ["../assets/images/heritage1.jpg", "../assets/images/heritage2.jpg", "../assets/images/heritage3.jpg"];
  let currentIndex = 0;
  const slideElement = document.querySelector(".hero-slideshow");

  if (slideElement) {
    setInterval(() => {
      currentIndex = (currentIndex + 1) % images.length;
      slideElement.style.backgroundImage = `url(${images[currentIndex]})`;
    }, 5000);
  }
});