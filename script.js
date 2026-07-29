document.getElementById("year").textContent = new Date().getFullYear();

const CONTACT_EMAIL = "jimmy.mieuzet@gmail.com";
const form = document.getElementById("request-form");
const note = document.getElementById("form-note");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const appName = form["app-name"].value.trim();
  const description = form.description.value.trim();

  const subject = `Nouvelle idée d'application${appName ? " : " + appName : ""}`;
  const body =
    `Nom : ${name}\n` +
    `Email : ${email}\n` +
    (appName ? `Projet : ${appName}\n` : "") +
    `\nDescription :\n${description}`;

  const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  window.location.href = mailtoUrl;

  note.textContent = "Votre client email va s'ouvrir pour envoyer votre demande. À très vite !";
});
