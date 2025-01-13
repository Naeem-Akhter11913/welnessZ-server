const mongoose = require('mongoose');

const employeemodel = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: false
    },
    dateOfJoining: {
        type: String,
        required: false
    },
    position: {
        type: String,
        required: false
    },
    department: {
        type: String,
        enum: ['Full Stack', 'Front End', 'Back End'],
        default: 'Full Stack'
    },
    status: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('employeemodel', employeemodel);
