/**
 * uNdoqo Application System Layer
 * Sandile Tukani University (STU) Core Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("STU Multi-Page Application Core Nodes Active.");

  // Automatic Menu State Reset Handler on Window Scaling
  const menuCheckbox = document.getElementById("menu-toggle-checkbox");
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024 && menuCheckbox && menuCheckbox.checked) {
      menuCheckbox.checked = false;
    }
  });

  // Intercept Simulation Layer for Contact Templates
  const asyncForm = document.querySelector("form");
  if (asyncForm) {
    asyncForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const actionBtn = asyncForm.querySelector("button");
      if (actionBtn) {
        const originalText = actionBtn.textContent;
        actionBtn.textContent = "TRANSMITTING TO BUREAU...";
        actionBtn.style.opacity = "0.7";
        actionBtn.style.pointerEvents = "none";

        setTimeout(() => {
          actionBtn.textContent = "TRANSMISSION SECURED";
          actionBtn.style.background = "#25d366";
          actionBtn.style.color = "#ffffff";
          asyncForm.reset();

          setTimeout(() => {
            actionBtn.textContent = originalText;
            actionBtn.style.background = "#14b8a6";
            actionBtn.style.color = "#071210";
            actionBtn.style.pointerEvents = "auto";
            actionBtn.style.opacity = "1";
          }, 2500);
        }, 1200);
      }
    });
  }
});