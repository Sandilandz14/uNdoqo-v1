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

  // Course Enrollment Auto Population
  const courseField = document.getElementById("selected-course");
  const selectedCourseDisplay = document.getElementById(  "selected-course-display");

  if (courseField) {
  const params = new URLSearchParams(window.location.search);
  const course = params.get("course");

  if (course) {
    courseField.value = course;
    if (selectedCourseDisplay) {
      selectedCourseDisplay.textContent =
        "Selected Course: " + course;
    }
  }
}
  });
});