const express = require('express');
const {
    userRegistration,
    userLoginController,
    verifyTokenController,
    getAllEmployeeController,
    deleteUserController,
    logoutController,
    addEmployeeController,
    updateEmployeeController,
    getAllEmployeeAudit,
    refreshController,
    isRefereceTokenIsValid
} = require('../controllers/user.controller');

const route = express();

const multer = require('multer');
const authenticateUser = require('../middleware/authValidation');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


route.post('/registration', userRegistration);
route.post('/user-login', userLoginController);
route.post('/add-employeee', authenticateUser, upload.single('image'), addEmployeeController);
route.put('/edit-employee', authenticateUser, upload.single('image'), updateEmployeeController);
route.get('/get-all-log-audit', authenticateUser, getAllEmployeeAudit);
route.post('/verify-token', authenticateUser, verifyTokenController);
route.get('/get-all-employee', authenticateUser, getAllEmployeeController);
route.delete('/delete-users', authenticateUser, deleteUserController);
route.post('/refresh', refreshController);
route.post('/verify-refresh-token', isRefereceTokenIsValid);
route.post('/log-out-users', authenticateUser, logoutController);

// SG.PAmCIVp8SmyYE46603L1nQ.IPzFXc19Iwn_MxQ13LJsYLcaq@SSDD_Kx7RGL7Vy320

module.exports = route;