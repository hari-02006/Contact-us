import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import app from "../server.js";

describe("Contact Us form routes and validation", () => {
  let server;
  let baseUrl;

  before(async () => {
    server = app.listen(0, "127.0.0.1");
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  });

  async function submit(overrides = {}) {
    const response = await fetch(`${baseUrl}/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        name: "Alex Morgan",
        email: "alex@example.com",
        phone: "1234567890",
        message: "I would like to know more.",
        ...overrides
      })
    });
    return { response, html: await response.text() };
  }

  it("GET / serves the contact form", async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Contact Us/);
    assert.match(html, /action="\/contact" method="post"/);
    const stylesheetResponse = await fetch(`${baseUrl}/style.css`);
    assert.equal(stylesheetResponse.status, 200);
    assert.match(stylesheetResponse.headers.get("content-type"), /text\/css/);
    assert.match(await stylesheetResponse.text(), /\.form-card/);
  });

  it("accepts valid data with HTTP 200 and a success message", async () => {
    const { response, html } = await submit();
    assert.equal(response.status, 200);
    assert.match(html, /submitted successfully/);
    assert.match(html, /Return to the contact form/);
  });

  it("rejects empty required fields with HTTP 400", async () => {
    const { response, html } = await submit({ name: "", email: "", phone: "", message: "" });
    assert.equal(response.status, 400);
    for (const field of ["Full name is required", "Email address is required", "Phone number is required", "Message is required"]) {
      assert.match(html, new RegExp(field));
    }
  });

  it("rejects an invalid email address", async () => {
    const { response, html } = await submit({ email: "not-an-email" });
    assert.equal(response.status, 400);
    assert.match(html, /Enter a valid email address/);
  });

  it("rejects phone numbers with fewer or more than 10 digits", async () => {
    for (const phone of ["123456789", "12345678901"]) {
      const { response, html } = await submit({ phone });
      assert.equal(response.status, 400);
      assert.match(html, /exactly 10 digits/);
    }
  });

  it("rejects names shorter than 3 characters or containing non-letters", async () => {
    for (const name of ["Al", "Alex1", "Alex-Morgan"]) {
      const { response, html } = await submit({ name });
      assert.equal(response.status, 400);
      assert.match(html, /Full name/);
    }
  });

  it("rejects messages shorter than 10 or longer than 500 characters", async () => {
    for (const message of ["Too short", "x".repeat(501)]) {
      const { response, html } = await submit({ message });
      assert.equal(response.status, 400);
      assert.match(html, /Message must/);
    }
  });

  it("accepts the inclusive name and message length boundaries", async () => {
    for (const [name, message] of [["Amy", "1234567890"], ["Amy", "x".repeat(500)]]) {
      const { response, html } = await submit({ name, message });
      assert.equal(response.status, 200);
      assert.match(html, /submitted successfully/);
    }
  });

  it("preserves values and escapes user-provided HTML on validation errors", async () => {
    const { response, html } = await submit({ name: "<script>" });
    assert.equal(response.status, 400);
    assert.match(html, /value="&lt;script&gt;"/);
    assert.doesNotMatch(html, /value="<script>"/);
  });
});
