require('dotenv').config(); // load .env variables

const mongoose = require('mongoose');

mongoose.connect(process.env.DATABASE);
