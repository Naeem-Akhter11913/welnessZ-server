const mongoose = require('mongoose');

const usermodel = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: false
    },
    image: {
        type: String,
        required: false
    },
    typeOfUser: {
        type: String,
        enum: ['admin', 'manager', 'regular'],
        default: 'regular'
    },
    department: {
        type: String,
        enum: ['Full Stack', 'Front End', 'Back End'],
        default: 'Full Stack'
    },
    // isActive: {
    //     type: Boolean,
    //     default: false
    // }
}, {
    timestamps: true
});

module.exports = mongoose.model('usermodel', usermodel);
