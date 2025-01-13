const { google } = require('googleapis');
const metaDataModel = require('../schema/metaDataModal')
// const fs = require('fs');


// const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf8'));
// const { client_id, client_secret, redirect_uris } = credentials.web;

const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDER_CLIENT_ID,
    process.env.GOOGLE_CALENDER_CLIENT_SECRET,
    process.env.GOOGLE_CALENDER_REDIRECT_URIS
);
const Sentry = require("@sentry/node");


const getTokenController = async (req, res) => {
    const { userId } = req.query;
    let authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar'],
        state: userId, // Another example
    });
    res.redirect(authUrl);
};

const callbackController = async (req, res) => {
    const code = req.query.code;
    const state = req.query.state;
    try {
        const { tokens } = await oAuth2Client.getToken(code);
        oAuth2Client.setCredentials(tokens);

        const mongooseInstance = new metaDataModel({
            userId: state,
            metaKey: "calenderMetaKey",
            metaValue: JSON.stringify(tokens)
        })
        await mongooseInstance.save();
        res.redirect("http://localhost:5173?redirect-from=redirect")
    } catch (error) {
        res.status(500).send('Authentication failed.');
    }
};

const reminderScheduler = async (req, res) => {
    const {
        summary,
        description,
        location,
        startDateTime,
        endDateTime,
        timeZone,
        attendees,
        userId,
        assigneeId
    } = req.body;
    try {
        const metaValueToken = await metaDataModel.findOne({
            userId: assigneeId,
            metaKey: 'calenderMetaKey'
        });


        if (!metaValueToken) {
            return res.status(400).send({
                status: false,
                message: "Connect to the calender first"
            })
        }
        const token = JSON.parse(metaValueToken.metaValue)

        oAuth2Client.setCredentials(token);

        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        const event = {
            summary,
            description,
            location,
            start: { dateTime: startDateTime, timeZone },
            end: { dateTime: endDateTime, timeZone },
            attendees: attendees?.map(email => ({ email })),
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 30 },  // Email reminder 30 minutes before
                    { method: 'popup', minutes: 10 }, // Popup reminder 10 minutes before
                ],
            },
        };
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
        });
        const stringifyResponse = JSON.stringify(response.data)
        const eventResponseMongooseInstance = new metaDataModel({
            userId,
            metaKey: "dumpEvent",
            metaValue: stringifyResponse
        })
        await eventResponseMongooseInstance.save();
        res.status(200).send({
            status: true,
            message: "reminder schudle success",
            event: response.data
        });
    } catch (error) {
        console.log(error)
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
};


const meetingScheduler = async (req, res) => {
    const { summary, description, location, startDateTime, endDateTime, timeZone, attendees } = req.body;

    try {
        const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf8'));
        oAuth2Client.setCredentials(tokens);

        const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
        const event = {
            summary,
            description,
            location,
            start: { dateTime: startDateTime, timeZone },
            end: { dateTime: endDateTime, timeZone },
            attendees: attendees?.map(email => ({ email })),
            conferenceData: {
                createRequest: {
                    requestId: `meet-${Date.now()}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            },
        };

        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
        });

        res.json({
            event: response.data,
            meetLink: response.data.conferenceData?.entryPoints?.[0]?.uri,
        });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send('Error scheduling meeting.');
    }
};


const getCalenderConnection = async (req, res) => {
    const { userId } = req.query;
    try {
        if (!userId) {
            return res.status(400).send({
                status: false,
                message: "You have to loing"
            })
        }

        const calenderData = await metaDataModel.findOne({ userId, metaKey: "calenderMetaKey" });
        res.status(200).send({
            status: true,
            calenderData,
            message: 'calender connection retrieve success'
        })
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message
        })
    }
}


const getCalenderMetaDataController = async (req, res) => {
    try {
        const allMetaData = await metaDataModel.find();

        res.status(200).send({
            status: false,
            message: 'Retrieve all the meta data',
            reminderMetaData: allMetaData
        })
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message
        })
    }
}

module.exports = {
    getTokenController,
    callbackController,
    meetingScheduler,
    reminderScheduler,
    getCalenderConnection,
    getCalenderMetaDataController
}
