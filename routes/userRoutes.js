const express = require('express');
const router = express.Router();
const db = require('../config/db');

// Add or load a user
router.post('/users', (req, res) => {
    const { username, major } = req.body;

    // Check if the user already exists
    const sqlCheck = 'SELECT * FROM users WHERE username = ?';
    const sqlInsert = 'INSERT INTO users (username, major) VALUES (?, ?)';

    db.query(sqlCheck, [username], (err, results) => {
        if (err) return res.status(500).send('Database error');
        
        // If the user exists, return their details
        if (results.length > 0) {
            return res.json(results[0]);
        }

        // Otherwise, create a new user
        db.query(sqlInsert, [username, major], (err, result) => {
            if (err) return res.status(500).send('Database error');
            res.json({ id: result.insertId, username, major });
        });
    });
});

module.exports = router;
