/**
 * About Page Slideshow Component
 */
let slideIndex = 1;

function showSlides(n) {
  const slides = document.getElementsByClassName("slide");
  const dots = document.getElementsByClassName("dot");
  if (n > slides.length) slideIndex = 1;
  if (n < 1) slideIndex = slides.length;
  
  for (let i = 0; i < slides.length; i++) { slides[i].style.display = "none"; }
  for (let i = 0; i < dots.length; i++) { dots[i].className = dots[i].className.replace(" active", ""); }
  
  slides[slideIndex-1].style.display = "block";
  dots[slideIndex-1].className += " active";
}

function moveSlides(n) { showSlides(slideIndex += n); }
function currentSlide(n) { showSlides(slideIndex = n); }

document.addEventListener("DOMContentLoaded", () => {
  showSlides(slideIndex);
  // Auto-play every 5 seconds
  setInterval(() => moveSlides(1), 5000);
});