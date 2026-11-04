// Serves the Make Another Choice prototype with a shared password.
// Set PREVIEW_USER and PREVIEW_PASS in Render's environment settings.
// If they are not set, the site is served without a password.
const express = require("express");
const path = require("path");
const app = express();

const USER = process.env.PREVIEW_USER;
const PASS = process.env.PREVIEW_PASS;

if (USER && PASS) {
  app.use((req, res, next) => {
    const header = req.headers.authorization || "";
    const [scheme, encoded] = header.split(" ");
    if (scheme === "Basic" && encoded) {
      const [u, p] = Buffer.from(encoded, "base64").toString().split(":");
      if (u === USER && p === PASS) return next();
    }
    res.set("WWW-Authenticate", 'Basic realm="Make Another Choice preview"');
    res.status(401).send("This preview needs a password.");
  });
}

app.use(express.static(path.join(__dirname, "public")));
app.listen(process.env.PORT || 3000);
