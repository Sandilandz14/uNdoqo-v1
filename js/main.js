/**
 * Sandile Tukani University (STU) - Core Web App Layer
 * Verification & Interactive Framework Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("STU Framework System Node initialized. Epistemic parameters validated.");

  // Clean Navigation Scroll Padding Handler
  const navbar = document.querySelector(".navbar");
  if (navbar) {
    const setScrollPadding = () => {
      const navHeight = navbar.offsetHeight;
      document.documentElement.style.scrollPaddingTop = `${navHeight}px`;
    };
    setScrollPadding();
    window.addEventListener("resize", setScrollPadding);
  }

  // Smooth Form Intercept Simulation
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const submitBtn = contactForm.querySelector(".submit-btn");
      if (submitBtn) {
        submitBtn.textContent = "TRANSMITTING DATA...";
        submitBtn.style.opacity = "0.7";
        submitBtn.style.pointerEvents = "none";
        
        setTimeout(() => {
          submitBtn.textContent = "TRANSMISSION SECURED";
          submitBtn.style.background = "#25d366";
          submitBtn.style.color = "#ffffff";
          contactForm.reset();
          
          setTimeout(() => {
            submitBtn.textContent = "Transmit Formal Inquiry";
            submitBtn.style.background = "#14b8a6";
            submitBtn.style.color = "#071210";
            submitBtn.style.pointerEvents = "auto";
            submitBtn.style.opacity = "1";
          }, 3000);
        }, 1500);
      }
    });
  }
});