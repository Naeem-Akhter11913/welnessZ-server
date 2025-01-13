const mongoose = require('mongoose');

const mongoURI = process.env.MONGODB_CONNECTION_STARING


mongoose.connect(mongoURI).then(() => console.log('MongoDB connection established successfully!')).catch(e => console.log(e));