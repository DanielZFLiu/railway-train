const express = require("express");
const cors = require("cors");
const routes = require("./routes");
require('dotenv').config();

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const corsOptions = {
    origin: FRONTEND_URL,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use("", routes);

module.exports = app;
