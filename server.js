// Serves Make Another Choice.
// Preview: set PREVIEW_USER and PREVIEW_PASS in Render to require a password.
// Launch: unset those two, and set PRIMARY_HOST=makeanotherchoice.org so that
// www. and the onrender.com address redirect to the real domain.
const express = require("express");
const compression = require("compression");
const path = require("path");
const app = express();
app.set("trust proxy", 1);

const USER = process.env.PREVIEW_USER;
const PASS = process.env.PREVIEW_PASS;
const PRIMARY = process.env.PRIMARY_HOST; // e.g. makeanotherchoice.org

// Canonical host and https (only once PRIMARY_HOST is set)
app.use((req, res, next) => {
  if (!PRIMARY) return next();
  const host = (req.headers.host || "").toLowerCase();
  const insecure = req.protocol !== "https";
  if (host !== PRIMARY || insecure) {
    return res.redirect(301, "https://" + PRIMARY + req.originalUrl);
  }
  next();
});

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

app.use(compression());

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (PRIMARY) res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

const PUBLIC = path.join(__dirname, "public");
app.use(express.static(PUBLIC, {
  setHeaders(res, filePath) {
    if (filePath.endsWith("index.html")) {
      res.set("Cache-Control", "no-cache");
    } else {
      res.set("Cache-Control", "public, max-age=86400");
    }
  },
}));

// Anything else: the page itself, with a 404 status so search engines don't index stray paths.
app.use((req, res) => {
  res.status(404).sendFile(path.join(PUBLIC, "index.html"));
});

app.listen(process.env.PORT || 3000);
