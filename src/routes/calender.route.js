const express = require('express');
const { getTokenController, callbackController, meetingScheduler, reminderScheduler, getCalenderConnection, getCalenderMetaDataController } = require('../controllers/google.calender.integration');
const authenticateUser = require('../middleware/authValidation');

const route = express();


route.get('/auth', getTokenController);
route.get('/auth/callback', callbackController);
route.post('/schedule', meetingScheduler);
route.post('/reminder-scheduler', authenticateUser, reminderScheduler);
route.get('/get-calender-credentials', authenticateUser, getCalenderConnection);
route.get('/get-all-calender-meta-data', authenticateUser, getCalenderMetaDataController);

module.exports = route;