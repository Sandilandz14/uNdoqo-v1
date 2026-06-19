/**
 * uNdoqo Application System Layer
 * Sandile Tukani University (STU) Core Logic
 */

document.addEventListener("DOMContentLoaded", () => {
  console.log("STU Multi-Page Application Core Nodes Active.");

  const menuCheckbox = document.getElementById("menu-toggle-checkbox");
  const navLinks = document.querySelectorAll(".nav-links a");

  // Dynamic Active Navigation Handler
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  navLinks.forEach((link) => {
    const linkPath = link.getAttribute("href").split("/").pop();

    if (linkPath === currentPath) {
      link.classList.add("active-nav");
    }

    link.addEventListener("click", () => {
      if (menuCheckbox && menuCheckbox.checked) {
        menuCheckbox.checked = false;
        document.body.classList.remove("menu-open");
      }
    });
  });

  // Mobile Menu Body Lock Handler
  if (menuCheckbox) {
    menuCheckbox.addEventListener("change", () => {
      document.body.classList.toggle("menu-open", menuCheckbox.checked);
    });
  }

  // Automatic Menu State Reset Handler on Window Scaling
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1024 && menuCheckbox && menuCheckbox.checked) {
      menuCheckbox.checked = false;
      document.body.classList.remove("menu-open");
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