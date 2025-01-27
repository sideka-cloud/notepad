const express = require('express');
const bodyParser = require('body-parser');
const CryptoJS = require('crypto-js');
const path = require('path');

const app = express();
const PORT = 3000;

let notes = {}; // In-memory store for notes, use a proper database for production

// Middleware to parse request bodies
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (e.g., CSS, JS)
app.use(express.static(path.join(__dirname, 'public')));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Home page where users create a note
app.get('/', (req, res) => {
  res.render('index', { url: null, error: null });
});

// Handle note creation, encryption, and URL generation
app.post('/save', (req, res) => {
  const { note, password } = req.body;

  if (!note || !password) {
    return res.render('index', { url: null, error: 'Note and password are required!' });
  }

  // Encrypt the note with the provided password
  const encryptedNote = CryptoJS.AES.encrypt(note, password).toString();

  // Generate a random ID for the note
  const noteId = Math.random().toString(36).substr(2, 9);
  notes[noteId] = encryptedNote; // Save the encrypted note

  // Generate the URL for the note
  const noteUrl = `${req.protocol}://${req.get('host')}/decrypt/${noteId}`;

  res.render('index', { url: noteUrl, error: null }); // Display the generated URL
});

// Render the decryption page
app.get('/decrypt/:id', (req, res) => {
  const { id } = req.params;
  res.render('note', { id, note: null, error: null }); // Initial state with empty note and no error
});

// Handle note decryption
app.post('/decrypt/:id', (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  const noteData = notes[id];

  if (!noteData) {
    return res.render('note', { id, note: null, error: 'Note not found.' });
  }

  try {
    // Decrypt the note with the provided password
    const bytes = CryptoJS.AES.decrypt(noteData, password);
    const decryptedNote = bytes.toString(CryptoJS.enc.Utf8);

    if (!decryptedNote) {
      throw new Error('Invalid password');
    }

    // Render the decrypted note
    res.render('note', { id, note: decryptedNote, error: null });
  } catch (err) {
    // If decryption fails (e.g., wrong password)
    res.render('note', { id, note: null, error: 'Invalid password. Please try again.' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

