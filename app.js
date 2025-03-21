require("dotenv").config()
const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');
const port = process.env.PORT || 3000;
const { username, password } = require('./utils/decrypt.js');

app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use("/esri", express.static(path.join(__dirname, 'node_modules', '@arcgis', 'core')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/api/generateToken', async (req, res) => {
    try {
        const response = await fetch("https://www.arcgis.com/sharing/rest/generateToken", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                username: username,
                password: password,
                referer: "https://www.arcgis.com",
                f: "json"
            })
        });
        const data = await response.json();
        if (data.token) {
            res.json({ token: data.token });
        } else {
            res.status(500).json({ error: "Failed to generate token" });
        }
    } catch (error) {
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});