import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateContactForm } from "./validation.js";

const app = express();
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");

app.use(express.urlencoded({ extended: false, limit: "10kb" }));
app.use(express.static(publicDirectory, { index: false }));

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}

function renderResult({ values, errors = {}, success = false }) {
  const heading = success ? "Message sent" : "Please check your details";
  const notice = success
    ? "Thanks for reaching out! Your contact form was submitted successfully."
    : "Some details need your attention. Please correct the highlighted fields.";
  const fields = [
    { name: "name", label: "Full Name", type: "text", autocomplete: "name", placeholder: "e.g. Alex Morgan" },
    { name: "email", label: "Email Address", type: "email", autocomplete: "email", placeholder: "alex@example.com" },
    { name: "phone", label: "Phone Number", type: "tel", autocomplete: "tel", placeholder: "10-digit phone number" },
    { name: "message", label: "Message", type: "textarea", placeholder: "How can we help?" }
  ];
  const formFields = fields.map((field) => {
    const error = errors[field.name];
    const accessibility = error
      ? `aria-invalid="true" aria-describedby="${field.name}-error"`
      : "";
    const control = field.type === "textarea"
      ? `<textarea id="${field.name}" name="${field.name}" rows="5" placeholder="${field.placeholder}" required ${accessibility}>${escapeHtml(values[field.name])}</textarea>`
      : `<input id="${field.name}" name="${field.name}" type="${field.type}" autocomplete="${field.autocomplete}" ${field.name === "phone" ? 'inputmode="numeric"' : ""} value="${escapeHtml(values[field.name])}" placeholder="${field.placeholder}" required ${accessibility}>`;
    const hint = field.name === "name"
      ? '<p class="hint">Letters and spaces only, at least 3 characters.</p>'
      : field.name === "phone"
        ? '<p class="hint">Enter exactly 10 digits.</p>'
        : field.name === "message"
          ? '<p class="hint">10–500 characters.</p>'
          : field.name === "email"
            ? '<p class="hint">We’ll only use this to reply.</p>'
          : "";

    return `<div class="field">
      <label for="${field.name}">${field.label}<span aria-hidden="true"> *</span></label>
      ${control}
      ${hint}
      ${error ? `<p class="field-error" id="${field.name}-error">${escapeHtml(error)}</p>` : ""}
    </div>`;
  }).join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#f4f7f5">
  <title>${heading} | Contact Us</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <main class="page">
    <header class="topbar"><a class="brand" href="/">KINSHIP<span>.</span></a><span class="topbar-note">HERE WHEN YOU NEED US</span></header>
    <section class="contact-layout" aria-labelledby="page-title">
      <div class="side-copy">
        <p class="eyebrow">LET'S START A CONVERSATION</p>
        <h1 id="page-title">Good things<br>start with<br><span>a hello.</span></h1>
        <p class="side-intro">Questions, ideas, or just want to say hi? Send us a note and our team will be glad to hear from you.</p>
        <div class="contact-note"><span class="note-icon" aria-hidden="true">↗</span><span>We typically reply within<br><strong>one business day.</strong></span></div>
      </div>
      <div class="form-card">
        <div class="form-heading">
          <div><p class="eyebrow">CONTACT FORM</p><h2>Send us a message</h2></div>
          <span class="required-note"><span aria-hidden="true">*</span> Required</span>
        </div>
        ${success ? `<div class="notice success" role="status"><span class="notice-icon" aria-hidden="true">✓</span><span>${notice}</span></div>` : `<div class="notice error" role="alert"><span class="notice-icon" aria-hidden="true">!</span><span>${notice}</span></div>`}
        ${success ? '<a class="return-link" href="/">← Return to the contact form</a>' : ""}
        <form action="/contact" method="post" novalidate>
          ${formFields}
          <button class="button" type="submit">Send message <span aria-hidden="true">→</span></button>
        </form>
        <p class="privacy-note"><span aria-hidden="true">◇</span> Your details are only used to respond to your message.</p>
      </div>
    </section>
    <footer class="footer"><span>MADE FOR MEANINGFUL CONVERSATIONS</span><span>CONTACT / 01</span></footer>
  </main>
</body>
</html>`;
}

app.get("/", (request, response) => {
  response.sendFile(path.join(publicDirectory, "index.html"));
});

app.post("/contact", (request, response) => {
  const { values, errors } = validateContactForm(request.body);
  if (Object.keys(errors).length > 0) {
    response.status(400).send(renderResult({ values, errors }));
    return;
  }

  response.status(200).send(renderResult({ values, success: true }));
});

app.use((request, response) => {
  response.status(404).send("Page not found.");
});

export default app;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = process.env.PORT || 3000;
  app.listen(port, "0.0.0.0", () => {
    console.log(`Contact form app listening on port ${port}`);
  });
}
