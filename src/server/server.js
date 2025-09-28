/* eslint-disable no-undef */
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Ejemplo de ruta
app.get("/ping", (req, res) => {
    res.json({ message: "pong" });
});

app.listen(5000, () => console.log("API running on http://localhost:5000"));
