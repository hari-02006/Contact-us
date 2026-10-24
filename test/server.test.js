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
        consent: "on",
        ...overrides
      })
    });
    return { response, html: await response.text() };
  }

  async function submitJson(overrides = {}) {
    const response = await fetch(`${baseUrl}/api/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Jordan Sample",
        email: "jordan@example.com",
        phone: "9876543210",
        message: "This is synthetic test data for the assignment.",
        consent: true,
        ...overrides
      })
    });
    return { response, result: await response.json() };
  }

  it("GET / serves the contact form", async () => {
    const response = await fetch(baseUrl);
    const html = await response.text();
    assert.equal(response.status, 200);
    assert.match(html, /Contact Us/);
    assert.match(html, /action="\/contact" method="post"/);
    assert.match(html, /public history page/);
    const stylesheetResponse = await fetch(`${baseUrl}/style.css`);
    assert.equal(stylesheetResponse.status, 200);
    assert.match(stylesheetResponse.headers.get("content-type"), /text\/css/);
    assert.match(await stylesheetResponse.text(), /\.form-card/);
  });

  it("accepts valid data with HTTP 200 and a success message", async () => {
    const { response, html } = await submit();
    assert.equal(response.status, 200);
    assert.match(html, /submitted successfully/);
    assert.match(html, /View saved submissions/);
  });

  it("GET /api/contacts returns valid submissions as JSON and GET /history displays them", async () => {
    const apiResponse = await fetch(`${baseUrl}/api/contacts`);
    assert.equal(apiResponse.status, 200);
    assert.match(apiResponse.headers.get("content-type"), /application\/json/);
    const { submissions } = await apiResponse.json();
    assert.ok(submissions.length >= 1);
    assert.equal(submissions[0].name, "Alex Morgan");
    assert.equal(submissions[0].email, "alex@example.com");
    assert.equal(submissions[0].phone, "1234567890");
    assert.equal(submissions[0].message, "I would like to know more.");

    const historyResponse = await fetch(`${baseUrl}/history`);
    const html = await historyResponse.text();
    assert.equal(historyResponse.status, 200);
    assert.match(html, /Submission history/);
    assert.match(html, /Alex Morgan/);
    assert.match(html, /alex@example\.com/);
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

  it("requires public-history consent and does not save without it", async () => {
    const beforeResponse = await fetch(`${baseUrl}/api/contacts`);
    const before = (await beforeResponse.json()).submissions.length;
    const { response, html } = await submit({ consent: "" });
    assert.equal(response.status, 400);
    assert.match(html, /Confirm that you are using sample data/);
    const afterResponse = await fetch(`${baseUrl}/api/contacts`);
    const after = (await afterResponse.json()).submissions.length;
    assert.equal(after, before);
  });

  it("does not store invalid submissions", async () => {
    const beforeResponse = await fetch(`${baseUrl}/api/contacts`);
    const before = (await beforeResponse.json()).submissions.length;
    const { response } = await submit({ email: "invalid-email" });
    assert.equal(response.status, 400);
    const afterResponse = await fetch(`${baseUrl}/api/contacts`);
    const after = (await afterResponse.json()).submissions.length;
    assert.equal(after, before);
  });

  it("escapes saved messages when displaying public history", async () => {
    const message = "<script>alert(1)</script>";
    const { response } = await submit({ message });
    assert.equal(response.status, 200);

    const historyResponse = await fetch(`${baseUrl}/history`);
    const html = await historyResponse.text();
    assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    assert.doesNotMatch(html, /<script>alert\(1\)<\/script>/);
  });

  it("accepts a valid JSON POST and returns the saved submission", async () => {
    const { response, result } = await submitJson();
    assert.equal(response.status, 200);
    assert.equal(result.success, true);
    assert.match(result.message, /submitted successfully/i);
    assert.equal(result.submission.name, "Jordan Sample");
    assert.equal(result.submission.email, "jordan@example.com");

    const listResponse = await fetch(`${baseUrl}/api/contacts`);
    const { submissions } = await listResponse.json();
    assert.ok(submissions.some((submission) => submission.id === result.submission.id));
  });

  it("returns JSON field errors and does not save an invalid JSON POST", async () => {
    const beforeResponse = await fetch(`${baseUrl}/api/contacts`);
    const before = (await beforeResponse.json()).submissions.length;
    const { response, result } = await submitJson({
      name: "Jo",
      email: "not-an-email",
      phone: "123",
      message: "Short"
    });
    assert.equal(response.status, 400);
    assert.equal(result.success, false);
    assert.match(result.errors.name, /at least 3 characters/);
    assert.match(result.errors.email, /valid email/);
    assert.match(result.errors.phone, /exactly 10 digits/);
    assert.match(result.errors.message, /at least 10 characters/);

    const afterResponse = await fetch(`${baseUrl}/api/contacts`);
    const after = (await afterResponse.json()).submissions.length;
    assert.equal(after, before);
  });

  it("requires explicit consent for JSON API submissions", async () => {
    const { response, result } = await submitJson({ consent: false });
    assert.equal(response.status, 400);
    assert.match(result.errors.consent, /Set consent to true/);
  });
});
