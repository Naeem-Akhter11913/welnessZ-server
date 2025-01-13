const mongoose = require('mongoose');

const metaData = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'usermodel',
        require: true,
    },
    metaKey: {
        type: String,
        require: true,
    },
    metaValue: {
        type: String,
        require: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('metaData', metaData);