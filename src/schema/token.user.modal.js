const mongoose = require('mongoose');

const refereceToken = new mongoose.Schema({
    userId: {
        type: mongoose.Types.ObjectId,
        ref: 'usermodel',
        require: true,
    },
    refereshToken: {
        type: String,
        require: true,
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('referecetoken', refereceToken);