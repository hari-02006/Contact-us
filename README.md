# Contact Us Form Using Node.js and Express

A beginner-friendly contact form that demonstrates Express routing, URL-encoded form parsing, request/response handling, and server-side validation. It uses no database and does not store submitted information.

## Requirements

- Node.js 18 or newer
- npm

## Run locally

From the project folder:

```sh
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000). The server uses `process.env.PORT || 3000`, so hosting platforms can provide their own port.

## Form rules

| Field | Server-side rule |
|---|---|
| Full Name | Required; at least 3 characters; letters and spaces only |
| Email Address | Required; valid email format |
| Phone Number | Required; exactly 10 digits |
| Message | Required; 10–500 characters |

On an invalid submission the server returns **400 Bad Request**, shows a field-specific error, and preserves the entered values. Valid submissions return **200 OK** and a success message. User-provided values are HTML-escaped before being placed back into the response.

## Test

```sh
npm test
```

The automated tests start the Express server and exercise the actual HTTP routes. The cases and expected results are:

| Test input | Expected result |
|---|---|
| All fields valid: `Alex Morgan`, `alex@example.com`, `1234567890`, a message of 10–500 characters | HTTP 200 and successful-submission message |
| All fields empty | HTTP 400 and required-field errors for all fields |
| Email `not-an-email` | HTTP 400 and valid-email error |
| Phone `123456789` or `12345678901` | HTTP 400 and exactly-10-digits error |
| Name `Al` | HTTP 400 and minimum-length error |
| Name `Alex1` or `Alex-Morgan` | HTTP 400 and letters-and-spaces-only error |
| Message `Too short` | HTTP 400 and minimum-length error |
| Message of 501 characters | HTTP 400 and maximum-length error |
| Invalid submission containing `<script>` in a field | HTTP 400; value is preserved as escaped text, not HTML |

## Try the routes manually

The browser form uses `GET /` to display the page and `POST /contact` to submit it. You can also test the server without the browser:

```sh
curl -i http://localhost:3000/
```

Valid POST:

```sh
curl -i -X POST http://localhost:3000/contact \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "name=Alex Morgan" \
  --data-urlencode "email=alex@example.com" \
  --data-urlencode "phone=1234567890" \
  --data-urlencode "message=I would like to know more."
```

Invalid POST (returns HTTP 400 with errors in the HTML response):

```sh
curl -i -X POST http://localhost:3000/contact \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "name=Al" \
  --data-urlencode "email=not-an-email" \
  --data-urlencode "phone=123" \
  --data-urlencode "message=Short"
```

## Deploy to Render

1. Push this project to a GitHub repository.
2. In Render, choose **New → Web Service** and connect that repository.
3. Choose **Node** as the runtime. Set the build command to `npm install` and the start command to `npm start`.
4. Deploy. Render supplies `PORT`; the app binds to that port.
5. Open the service URL and submit both valid and invalid data to demonstrate the responses.

## How the code works

- `server.js` creates the Express app, enables `express.urlencoded()` to parse regular HTML form submissions, serves the `public/` folder, and defines the GET and POST routes.
- `validation.js` checks every submitted field independently on the server. Browser-side constraints are only helpful hints and are not trusted for validation.
- `public/index.html` and `public/style.css` provide the responsive contact page.
- `test/server.test.js` sends real HTTP requests and checks status codes, error messages, successful submissions, and HTML escaping.
