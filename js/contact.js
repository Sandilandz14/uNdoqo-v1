
/*
 * uNdoqo / STU Contact Form
 * Netlify Forms AJAX Submission
 *
 * Preserves:
 * - Original form layout and fields
 * - Native browser validation
 * - Existing navigation and branding
 */

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("stu-contact-form");

  if (!form) return;

  const submitButton = form.querySelector(
    'button[type="submit"]'
  );

  const statusMessage = document.getElementById(
    "contact-form-status"
  );

  const originalButtonText = submitButton.textContent.trim();

  let isSubmitting = false;

  function showStatus(message, type) {
    statusMessage.hidden = false;
    statusMessage.textContent = message;

    statusMessage.style.marginTop = "16px";
    statusMessage.style.padding = "14px 16px";
    statusMessage.style.borderRadius = "6px";
    statusMessage.style.fontSize = "15px";
    statusMessage.style.lineHeight = "1.6";

    if (type === "success") {
      statusMessage.style.backgroundColor = "#e7f7ef";
      statusMessage.style.color = "#14532d";
      statusMessage.style.border = "1px solid #86efac";
    } else {
      statusMessage.style.backgroundColor = "#fef2f2";
      statusMessage.style.color = "#991b1b";
      statusMessage.style.border = "1px solid #fca5a5";
    }
  }

  function setLoading(loading) {
    isSubmitting = loading;

    submitButton.disabled = loading;
    submitButton.textContent = loading
      ? "Sending…"
      : originalButtonText;

    submitButton.setAttribute(
      "aria-busy",
      String(loading)
    );

    submitButton.style.opacity = loading ? "0.7" : "1";
    submitButton.style.cursor = loading
      ? "wait"
      : "pointer";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (isSubmitting) return;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    statusMessage.hidden = true;
    statusMessage.textContent = "";

    const formData = new FormData(form);

    // Explicitly identify the registered Netlify form.
    formData.set("form-name", "stu-contact");

    const encodedData = new URLSearchParams(formData);

    setLoading(true);

    try {
      const response = await fetch(
        form.getAttribute("action") || "/",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded"
          },
          body: encodedData.toString(),
          credentials: "same-origin",
          redirect: "follow"
        }
      );

      if (!response.ok) {
        throw new Error(
          `Form submission failed (HTTP ${response.status})`
        );
      }

      // Avoid treating an unexpected redirect as success.
      if (
        response.redirected &&
        new URL(response.url).pathname !== "/"
      ) {
        throw new Error(
          "Unexpected response from the form service."
        );
      }

      showStatus(
        "Thank you! Your enquiry has been submitted successfully. " +
        "The STU team will review your message and respond " +
        "as soon as possible.",
        "success"
      );

      form.reset();

    } catch (error) {
      console.error(
        "uNdoqo contact form submission error:",
        error
      );

      showStatus(
        "We could not confirm your submission. " +
        "Please try again, or email " +
        "ask_stu@outlook.com directly. " +
        "If you have already submitted, please check " +
        "with us before sending a duplicate enquiry.",
        "error"
      );

    } finally {
      setLoading(false);
    }
  });
});
