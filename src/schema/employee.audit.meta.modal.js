const mongoose = require('mongoose');

const auditLogs = new mongoose.Schema({
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
        oldValue: {
            type: String,
            required: true,
        },
        newValue: {
            type: String,
            required: true,
        },
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('auditLogs', auditLogs);