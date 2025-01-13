const userModel = require('../schema/userSchema');
const employeeAuditModel = require('../schema/employee.audit.meta.modal');
const employeeModel = require('../schema/employess.modal');
const referecetokenModel = require('../schema/token.user.modal');
const jwt = require('jsonwebtoken');
const postmark = require("postmark");
const generateToken = require('../utilities/generateToken');
const hashPassword = require('../utilities/hash.password');
const bcrypt = require('bcryptjs');


const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const Sentry = require("@sentry/node");




const salt = 10;
const nodemailer = require('nodemailer');

// Create a transporter
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", // Corrected the host from 'smtp.gmai.com'
    port: 587,
    secure: false, // Use TLS
    auth: {
        user: "dreamabroad83@gmail.com", // Your email
        pass: "mqsfbhofbvxbbbyb",         // Your password
    },
    tls: {
        rejectUnauthorized: false, // Allow self-signed certificates
    },
});

const cloudinary = require("cloudinary").v2;

cloudinary.config({
    cloud_name: "dsk3ibtuu",
    api_key: "472321536327483",
    api_secret: "eRgilrqISpqL5HdSPkAH_fPuwPY",
});
// console.log(process.env.POSTMARK_KEY)
const client = new postmark.ServerClient(process.env.POSTMARK_KEY);

const userRegistration = async (req, res) => {
    const { name, email, password, typeOfUser } = req.body;
    try {
        if (!name || !email || !password || !typeOfUser) {
            return res.status(404).send({
                status: false,
                message: 'Please provide all the required credentials'
            });
        }

        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(409).send({
                status: false,
                message: 'User already exists with this email'
            });
        }
        const hashedPassword = await hashPassword(password, salt);
        if (!hashedPassword) {
            return res.status(404).send({
                status: false,
                message: 'Pasward did not hashed'
            });
        }
        const newUser = new userModel({
            name,
            email,
            password: hashedPassword,
            typeOfUser
        });
        await newUser.save();
        res.status(200).send({
            status: true,
            message: "Account created successfully"
        })
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message
        })
    }
}



const userLoginController = async (req, res) => {
    const { email, password } = req.body;
    try {
        if (!email || !password) {
            return res.status(404).send({
                status: false,
                message: 'Please provide all the required credentials'
            });
        }

        const isUserExist = await userModel.findOne({ email });
        if (!isUserExist) {
            return res.status(409).send({
                status: false,
                message: 'You have no account'
            });
        }


        const isMatchedPassword = await bcrypt.compare(password, isUserExist.password)

        if (!isMatchedPassword) {
            return res.status(400).send({
                status: false,
                message: 'Incorrect password'
            });
        }
        const { createdAt, updatedAt, __v, ...restData } = isUserExist._doc
        delete restData.password;

        const accessToken = await generateToken(restData, secrete_key = process.env.ACCESS_TOKEN_KEY, tokenExp = process.env.ACCESS_TOKEN_EXPIRE_TIME)
        const refereshToken = await generateToken(restData, secrete_key = process.env.REFERESH_TOKEN_KEY, tokenExp = process.env.REFRESH_TOKEN_EXPIRE_TIME)

        const { token, status } = refereshToken;

        if (!status) {
            return res.status(400).send({
                status: false,
                message: 'Connect with developer team'
            });
        }

        // save the referece token for regenerate the access token
        await referecetokenModel.create({
            userId: restData._id,
            refereshToken: refereshToken.token
        });



        res.cookie('token', token, {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
            httpOnly: true,
            secure: true,
            sameSite: "None",
            path: "/",
            signed: true,
        });


        res.status(200).send({
            status: true,
            message: "Logged in successfully",
            redirectUrl: 'http://localhost:5173',
            user: isUserExist,
            accessToken: accessToken.token
        });

    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message
        })
    }
}

const getAllEmployeeController = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const { typeOfUser, department } = req.user
    try {
        const skip = (page - 1) * limit;
        let total = await employeeModel.countDocuments();
        let allUsers = await employeeModel
            .find({
                typeOfUser: { $nin: ['admin', 'manager'] }
            })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).send({
            status: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            data: allUsers,
            message: "All users fetched successfully"
        });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message
        });
    }
};

const deleteUserController = async (req, res) => {
    const { itemID } = req.query;
    try {
        if (!itemID) {
            return res.status(400).send({
                status: false,
                message: "Item is required."
            })
        }
        const isUserExist = await employeeModel.findOne({ _id: itemID })
        if (!isUserExist) {
            return res.status(400).send({
                status: false,
                message: "Item is required."
            })
        }

        await employeeModel.findOneAndDelete({ _id: itemID });

        res.status(200).send({
            status: true,
            message: "Item Delete success"
        })
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message
        })
    }
}

const verifyTokenController = async (req, res) => {
    try {
        // Retrieve the token from cookies
        const user = req.user;
        // console.log(token)
        const { iat, exp, ...loggedInUser } = user;
        res.status(200).send({
            status: true,
            message: 'Token verified successfully',
            user: loggedInUser, // Contains user details like email, name, etc.
        });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
};

const addEmployeeController = async (req, res) => {
    const { name, email, position, department, dateOfJoining, status } = req.body;

    try {
        if (!req.file) {
            return res.status(400).send({
                status: false,
                message: "No file uploaded",
            });
        }

        // Check if the user is already present
        const isUserPresent = await userModel.findOne({ email });
        if (isUserPresent) {
            return res.status(409).send({
                status: false,
                message: "User already exists",
            });
        }

        // Upload image to Cloudinary
        cloudinary.uploader.upload_stream({ resource_type: "auto" }, async (error, result) => {
            if (error) {
                console.error(error);
                return res.status(500).send({
                    status: false,
                    error: "Error uploading to Cloudinary",
                });
            }

            // Prepare employee data
            const credentials = {
                name,
                email,
                position,
                department,
                dateOfJoining,
                status: status === "Active",
                image: result.secure_url,
            };

            // Save the employee in the database
            const toSaveEmployee = new employeeModel(credentials);
            await toSaveEmployee.save();

            const mailOptions = {
                from: '"Dream Abroad" <dreamabroad83@gmail.com>', // Sender address
                to: email,              // List of recipients
                subject: "Your Account Has Been Created",         // Subject line
                text: "Hello,\n\nYour account has been successfully created. Please use the credentials provided to log in to your account.", // Plain text body
                html: `
                    <html>
                        <body>
                            <h2>Welcome to Dream Abroad!</h2>
                            <p>Dear ${name},</p>
                            <p>We are pleased to inform you that your account has been successfully created. You can now log in to the system using the credentials provided.</p>
                            <p>If you have any questions or need further assistance, feel free to contact us.</p>
                            <br>
                            <p>Best regards,<br>Dream Abroad Team</p>
                        </body>
                    </html>
                `, // HTML body
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log("Error:", error);
                }
                console.log("Email sent:");
            });
            res.status(201).send({
                status: true,
                message: "Employee added successfully",
            });
        }).end(req.file.buffer);
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
};


const updateEmployeeController = async (req, res) => {
    const { id } = req.query; // Employee ID
    const { name, email, position, department, dateOfJoining, status, image } = req.body;
    const { _id } = req.user
    try {
        const employee = await employeeModel.findById(id);
        const oldEmployee = JSON.stringify(employee);
        if (!employee) {
            return res.status(404).send({
                status: false,
                message: 'Employee not found',
            });
        }

        let updatedImage;

        if (req.file) {
            await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        updatedImage = result.secure_url;
                        resolve(result);
                    }
                }).end(req.file.buffer);
            });
        } else if (image) {
            updatedImage = image;
        } else {
            updatedImage = employee.image;
        }

        employee.name = name || employee.name;
        employee.email = email || employee.email;
        employee.position = position || employee.position;
        employee.department = department || employee.department;
        employee.dateOfJoining = dateOfJoining || employee.dateOfJoining;
        employee.status = status === 'Active' ? true : status === 'Inactive' ? false : employee.status;
        employee.image = updatedImage;
        // console.log(JSON.parse(oldEmployee))
        // console.log(employee)
        const auditEmployee = {
            userId: _id,
            metaKey: "employeeAudit",
            metaValue: {
                oldValue: oldEmployee,
                newValue: JSON.stringify(employee)
            }
        }
        const audit = new employeeAuditModel(auditEmployee)
        await audit.save();
        await employee.save();
        const mailOptions = {
            from: '"Dream Abroad" <dreamabroad83@gmail.com>', // Sender address
            to: email,                                        // List of recipients
            subject: "Your Status Has Been Updated",          // Subject line
            text: "Hello,\n\nYour account status has been updated. Please check the details below for more information.", // Plain text body
            html: `
                <html>
                    <body>
                        <h2>Status Update from Dream Abroad</h2>
                        <p>Dear ${name},</p>
                        <p>We would like to inform you that your account status has been updated successfully.</p>
                        <p><strong>New Status:</strong> ${status}</p>
                        <p>Please log in to your account to view the details of this update.</p>
                        <p>If you have any questions or require further assistance, don't hesitate to reach out to us.</p>
                        <br>
                        <p>Best regards,<br>Dream Abroad Team</p>
                    </body>
                </html>
            `, // HTML body
        };
        const ss = status === "Active"
        const p = JSON.parse(oldEmployee)
        if (ss !== p.status) {
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    return console.log("Error:", error);
                }
                console.log("Email sent:");
            });
        }

        res.status(200).send({
            status: true,
            message: 'Employee updated successfully',
            data: employee,
        });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
};


const getAllEmployeeAudit = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query; // Default values: page 1, 10 items per page

        const auditData = await employeeAuditModel
            .find()
            .populate('userId', 'name email')
            .skip((page - 1) * limit) // Skip documents for previous pages
            .limit(Number(limit)) // Limit the number of documents
            .exec();

        const totalDocuments = await employeeAuditModel.countDocuments(); // Total number of documents

        res.status(200).send({
            status: true,
            message: "Log Audit retrieved",
            data: auditData,
            totalDocuments,
        });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
};

const refreshController = async (req, res) => {
    try {
        const refreshToken = req.signedCookies.token;
        if (!refreshToken) {
            return res.status(403).json({ message: 'Refresh token not provided' });
        }

        const existingToken = await referecetokenModel.findOne({ refereshToken: refreshToken });

        if (!existingToken) {
            return res.status(403).json({ message: 'Refresh token not provided' });
        }
        const userCredentials = await jwt.verify(existingToken.refereshToken, process.env.REFERESH_TOKEN_KEY)

        if (!userCredentials) {
            return res.status(403).json({ message: 'Invalid or expired refresh token' });
        };
        const { iat, exp, ...restUserCredentials } = userCredentials
        const accessToken = await generateToken(restUserCredentials, secrete_key = process.env.ACCESS_TOKEN_KEY, tokenExp = process.env.ACCESS_TOKEN_EXPIRE_TIME)

        const { status, token } = accessToken
        if (!status) {
            return res.status(403).json({ message: 'expired refresh token' });
        }

        res.status(200).send({ accessToken: accessToken.token });

    } catch (error) {
        console.error('Error in refresh controller:', error.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const isRefereceTokenIsValid = async (req, res) => {
    try {
        const refreshToken = req.signedCookies.token; // Assuming you store the refresh token in a cookie

        if (!refreshToken) return res.status(401).json({ success: false, message: 'No token provided' });

        let validUser = null;
        jwt.verify(refreshToken, process.env.REFERESH_TOKEN_KEY, (err, user) => {
            if (err) return res.status(403).json({ success: false, message: 'Invalid token' });
            validUser = user;
        });
        if (!validUser) {
            return res.status(401).json({ success: false, message: 'No token provided' });
        }
        res.status(200).json({ success: true, validUser });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: error.message,
        });
    }
}

const logoutController = async (req, res) => {

    try {
        const { _id } = req.user
        await referecetokenModel.deleteMany({ userId: _id });
        res.clearCookie("token", {
            path: "/",
            secure: true,
            httpOnly: true,
            sameSite: "None",
        });
        res.status(200).send({
            status: 200,
            message: "Logged out successfully",
        });
    } catch (error) {
        Sentry.captureException(error);
        res.status(500).send({
            status: false,
            message: 'hello',
        });
    }
};

module.exports = {
    userRegistration,
    userLoginController,
    verifyTokenController,
    getAllEmployeeController,
    deleteUserController,
    addEmployeeController,
    updateEmployeeController,
    getAllEmployeeAudit,
    refreshController,
    isRefereceTokenIsValid,
    logoutController,
}