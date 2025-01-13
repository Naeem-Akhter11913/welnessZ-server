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

// Email options
const mailOptions = {
    from: '"Dream Abroad" <dreamabroad83@gmail.com>', // Sender address
    to: "akhternaeem4567889@email.com",                      // List of recipients
    subject: "Hello from Node.js",                    // Subject line
    text: "This is a plain text email!",              // Plain text body
    html: "<b>This is an HTML email!</b>",            // HTML body
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        return console.log("Error:", error);
    }
    console.log("Email sent:", info.response);
});
