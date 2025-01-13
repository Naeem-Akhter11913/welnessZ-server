 const transporter = nodemailer.createTransport({
    host: "smtp.mailgun.org", // SMTP server
    port: 587,               // Port number (587 for TLS)
    secure: false,           // Use TLS
    auth: {
      user: "postmaster@sandbox08a9392a63a34b5491461b4ff3269bd8.mailgun.org", // Mailgun username
      pass: "3kh9umujora5"                                                   // Mailgun password
    }
  });


module.exports = {transporter}