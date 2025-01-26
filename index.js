const express = require('express');
const mysql = require('mysql2');
const userRoutes = require('./routes/userRoutes'); // Import user routes
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const port = 3000;

// Middleware to parse JSON
app.use(express.json());
app.use('/api', userRoutes);

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err);
        return;
    }
    console.log('Connected to SQL database!');
});

// Test route
app.get('/ping', (req, res) => {
  res.send('Server is running!');
});

// Add a database test route
app.get('/db-test', (req, res) => {
    db.query('SELECT 1 + 1 AS solution', (err, results) => {
      if (err) {
        res.status(500).send('Database test failed');
        return;
      }
      res.send(`Database test succeeded: ${results[0].solution}`);
    });
  });

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
