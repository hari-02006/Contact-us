# Contact Us Form Using Node.js and Express

A beginner-friendly contact form that demonstrates Express routing, URL-encoded form parsing, request/response handling, server-side validation, and an in-memory submission list. It uses no database or JSON file.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

From the project folder:

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). Use sample values only: the demo shows submitted information on a public history page and JSON API. The server uses `process.env.PORT || 3000`, so hosting platforms can provide their own port.

## Form rules

| Field | Server-side rule |
|---|---|
| Full Name | Required; at least 3 characters; letters and spaces only |
| Email Address | Required; valid email format |
| Phone Number | Required; exactly 10 digits |
| Message | Required; 10–500 characters |

On an invalid submission the server returns **400 Bad Request**, shows a field-specific error, and preserves the entered values. Valid submissions return **200 OK**, a success message, and are added to the in-memory submission list. User-provided values are HTML-escaped before being placed in HTML. The form also requires confirmation that the submitter understands history is public and is using sample data; submissions missing that confirmation are rejected.

## Submission history and API

- `GET /` displays the contact form.
- `POST /contact` validates the form and adds valid submissions to the in-memory list.
- `GET /history` displays the saved submissions as an HTML page.
- `GET /api/contacts` returns the submissions as JSON, in the shape `{ "submissions": [...] }`.
- `POST /api/contacts` accepts a JSON request body, independently validates each field, and returns a JSON success response or a `400` response with field errors. Include `"consent": true` to acknowledge that this public demo displays submissions.

This is only an assignment/demo storage approach. Anyone who can access the app can read every entry on `/history` and `/api/contacts`. **Do not submit real contact details.** The list is held in the Node.js process memory, not a JSON file or database, so it is cleared whenever the server restarts and is not shared between multiple server instances. Use private database storage and access controls for a real contact form.

## Test

```sh
npm test
```

The automated tests start the Express server and exercise the actual HTTP routes, including the history page and JSON API. The cases and expected results are:

| Test input | Expected result |
|---|---|
| All fields valid and public-history consent selected | HTTP 200, success message, and submission appears in `GET /history` and `GET /api/contacts` |
| All fields empty | HTTP 400 and required-field errors for all fields |
| Email `not-an-email` | HTTP 400 and valid-email error |
| Phone `123456789` or `12345678901` | HTTP 400 and exactly-10-digits error |
| Name `Al` | HTTP 400 and minimum-length error |
| Name `Alex1` or `Alex-Morgan` | HTTP 400 and letters-and-spaces-only error |
| Message `Too short` | HTTP 400 and minimum-length error |
| Message of 501 characters | HTTP 400 and maximum-length error |
| Invalid submission containing `<script>` in a field | HTTP 400; value is preserved as escaped text, not HTML |
| Valid fields without the public-history consent | HTTP 400; submission is not stored |
| Valid message containing HTML markup | HTTP 200; public history displays the markup as escaped text |

## Try the routes manually

The browser form uses `GET /` to display the page and `POST /contact` to submit it. The JSON API can be tested from PowerShell, like the terminal examples in the assignment screenshots. Start the app with `npm start` first.

Read all saved submissions:

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/contacts" -Method Get | ConvertTo-Json -Depth 5
```

Add a valid synthetic submission:

```powershell
$body = @{
  name = "Jordan Sample"
  email = "jordan@example.com"
  phone = "9876543210"
  message = "This is synthetic test data for the assignment."
  consent = $true
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/contacts" `
  -Method Post `
  -ContentType "application/json" `
  -Body $body | ConvertTo-Json -Depth 5
```

Try invalid data and print the server's JSON validation errors:

```powershell
$badBody = @{
  name = "Jo"
  email = "not-an-email"
  phone = "123"
  message = "Short"
  consent = $true
} | ConvertTo-Json

try {
  Invoke-RestMethod `
    -Uri "http://localhost:3000/api/contacts" `
    -Method Post `
    -ContentType "application/json" `
    -Body $badBody
} catch {
  $_.ErrorDetails.Message | ConvertFrom-Json | ConvertTo-Json -Depth 5
}
```

The invalid request returns HTTP **400** and the response lists the validation error for each incorrect field. Invalid requests are never saved. You can still test the HTML form using `POST /contact`:

```sh
curl -i http://localhost:3000/
curl -i http://localhost:3000/history
curl -i http://localhost:3000/api/contacts
```

Valid POST:

```sh
curl -i -X POST http://localhost:3000/contact \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "name=Alex Morgan" \
  --data-urlencode "email=alex@example.com" \
  --data-urlencode "phone=1234567890" \
  --data-urlencode "message=I would like to know more." \
  --data-urlencode "consent=on"
```

Invalid POST (returns HTTP 400 with errors in the HTML response):

```sh
curl -i -X POST http://localhost:3000/contact \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "name=Al" \
  --data-urlencode "email=not-an-email" \
  --data-urlencode "phone=123" \
  --data-urlencode "message=Short" \
  --data-urlencode "consent=on"
```

## Deploy to Render

1. Push this project to a GitHub repository.
2. In Render, choose **New → Web Service** and connect that repository.
3. Choose **Node** as the runtime. Set the build command to `npm install` and the start command to `npm start`.
4. Deploy. Render supplies `PORT`; the app binds to that port.
5. Open the service URL and submit only synthetic sample data to demonstrate the responses. On most hosting platforms, in-memory submissions are temporary and may be lost when the app restarts or scales.

## How the code works

- `server.js` creates the Express app, enables `express.urlencoded()` to parse regular HTML form submissions, serves the `public/` folder, and defines the form, submission, history, and JSON API routes.
- `validation.js` checks every submitted field independently on the server. Browser-side constraints are only helpful hints and are not trusted for validation.
- `submissions.js` stores validated submissions in a JavaScript array in server memory. It is intentionally temporary for demonstrating GET and POST without a database.
- `public/index.html` and `public/style.css` provide the responsive contact page.
- `test/server.test.js` sends real HTTP requests and checks status codes, error messages, successful submissions, and HTML escaping.
