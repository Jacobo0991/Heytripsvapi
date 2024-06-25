const nodeMailer = require("nodemailer");
require("dotenv").config();

exports.sendEmailWithNodemailer = (req, res, emailData) => {
  const transporter = nodeMailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: "foundhound09@gmail.com",
      pass: process.env.APP_PASS,
    },
    tls: {
      ciphers: "SSLv3",
    },
  });

  return transporter
    .sendMail(emailData)
    .catch((err) => console.log(`Problem sending email: ${err}`));
};