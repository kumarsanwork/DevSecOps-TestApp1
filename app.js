// ============================================================
// DevSecOps Demo App - Node.js Express API
// WARNING: This app contains INTENTIONAL vulnerabilities
// for DevSecOps pipeline demonstration purposes ONLY.
// DO NOT use in production.
// ============================================================

const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const serialize = require('node-serialize');   // Known vulnerable package (RCE)
const lodash = require('lodash');              // Old version - prototype pollution vuln
const axios = require('axios');

const app = express();
app.use(express.json());

// ============================================================
// INTENTIONAL SECRET LEAK (for Secret Scan to detect)
// ============================================================
const DB_PASSWORD = "SuperSecret@123!";         // Hardcoded credential
const AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";  // Fake AWS key pattern
const AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const JWT_SECRET = "mysecretkey123";            // Weak hardcoded JWT secret
const MONGO_URI = "mongodb://admin:password123@mongo:27017/appdb"; // Creds in URI

// ============================================================
// DATABASE CONNECTION
// ============================================================
mongoose.connect(MONGO_URI, { useNewUrlParser: true });

const UserSchema = new mongoose.Schema({
  username: String,
  password: String,   // SAST: passwords stored in plaintext
  email: String,
  role: String
});
const User = mongoose.model('User', UserSchema);

// ============================================================
// ROUTES
// ============================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

// SAST Finding: SQL-style NoSQL Injection vulnerability
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  // VULNERABILITY: No input sanitization - NoSQL Injection possible
  // Attacker can pass { "$gt": "" } as username/password
  const user = await User.findOne({ username: username, password: password });

  if (user) {
    // VULNERABILITY: Weak JWT secret + no expiry
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET);
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// SAST Finding: Prototype Pollution via lodash merge
app.post('/merge-config', (req, res) => {
  let config = {};
  // VULNERABILITY: Unsafe merge - prototype pollution if old lodash used
  lodash.merge(config, req.body);
  res.json({ config });
});

// SAST Finding: Remote Code Execution via node-serialize
app.post('/deserialize', (req, res) => {
  const data = req.body.data;
  // VULNERABILITY: Deserializing untrusted user input - RCE possible
  const obj = serialize.unserialize(data);
  res.json({ result: obj });
});

// SAST Finding: Path Traversal
app.get('/file', (req, res) => {
  const fs = require('fs');
  const filename = req.query.name;
  // VULNERABILITY: No path sanitization - directory traversal possible
  // Attacker can use: ?name=../../etc/passwd
  const content = fs.readFileSync('/app/data/' + filename, 'utf8');
  res.send(content);
});

// SAST Finding: SSRF - Server Side Request Forgery
app.get('/fetch', async (req, res) => {
  const url = req.query.url;
  // VULNERABILITY: Fetching arbitrary user-supplied URLs - SSRF possible
  // Attacker can probe internal services: ?url=http://169.254.169.254/metadata
  const response = await axios.get(url);
  res.json({ data: response.data });
});

// ============================================================
// START SERVER
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`DevSecOps Demo App running on port ${PORT}`);
});

module.exports = app;
