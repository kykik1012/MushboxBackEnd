const express = require('express');
const router = express.Router();

// Endpoint sederhana untuk mengecek apakah server hidup
router.get('/status', (req, res) => {
    res.json({ message: "Backend MushBox berjalan dengan normal! 🍄" });
});

module.exports = router;