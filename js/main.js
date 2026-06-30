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

  // Course Enrollment Auto Population for Contact Form
  const programmeSelect = document.querySelector('select[name="programme-interest"]');
  if (programmeSelect) {
    const params = new URLSearchParams(window.location.search);
    const courseParam = params.get("course");

    if (courseParam) {
      // Mapping display names to form values
      const mapping = {
        "Project EiNasi": "project-eiinasi",
        "Kora Kobab Ada": "project-kora",
        "KwaXhosa Zibenza Zibutya": "project-kwaxhosa"
      };

      if (mapping[courseParam]) {
        programmeSelect.value = mapping[courseParam];
      }
    }
  }
});