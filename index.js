require('dotenv').config();
const express = require('express');
require('./src/utilities/instrument')
const cors = require('cors');
require('./src/mongodb/mongoose.connection');
const cookieParser = require('cookie-parser');

const userRoutes = require('./src/routes/user.route')
const calendarRoute = require('./src/routes/calender.route');
const app = express();

const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

Sentry.init({
    dsn: "https://5edf8a28b826d161eb62c826b404a5d5@o4508608480608256.ingest.us.sentry.io/4508627228557312",
    integrations: [
        nodeProfilingIntegration(),
    ],
    // Tracing
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    profilesSampler:1.0
});





const corsOptions = {
    // origin: 'http://localhost:5173',
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,  
};

app.use(cors(corsOptions));
app.use(cookieParser(process.env.ACCESS_TOKEN_KEY));
app.use(express.json());

app.use('/api/1.0/user', userRoutes);
app.use('/api/1.0/calender', calendarRoute);


// Start the server
app.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});
