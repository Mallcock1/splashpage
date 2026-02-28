const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function bindMissionContactForm(formEl, endpointUrl) {
  if (!formEl || !endpointUrl) {
    return;
  }

  const nameInput = formEl.querySelector("#contact-name");
  const emailInput = formEl.querySelector("#contact-email");
  const messageInput = formEl.querySelector("#contact-message");
  const status = formEl.querySelector("#mission-form-status");
  const button = formEl.querySelector("button[type='submit']");

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!nameInput || !emailInput || !messageInput || !status || !button) {
      return;
    }

    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message || !EMAIL_REGEX.test(email)) {
      status.className = "form-status error";
      status.textContent = "Please complete name, email, and message.";
      return;
    }

    button.disabled = true;
    status.className = "form-status";
    status.textContent = "Submitting...";

    let submitted = false;
    try {
      const response = await fetch(endpointUrl, {
        method: "POST",
        mode: "cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
          source: "website_contact"
        })
      });
      submitted = response.ok;
    } catch {
      try {
        await fetch(endpointUrl, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            message,
            source: "website_contact"
          })
        });
        submitted = true;
      } catch {
        submitted = false;
      }
    } finally {
      if (submitted) {
        status.className = "form-status success";
        status.textContent = "Thanks - we'll reply shortly.";
        nameInput.value = "";
        emailInput.value = "";
        messageInput.value = "";
      } else {
        status.className = "form-status error";
        status.textContent = "Couldn't send right now. Email contact@neowatt.co.uk.";
      }
      button.disabled = false;
    }
  });
}
