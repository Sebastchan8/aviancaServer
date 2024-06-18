const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, 
  auth: {
    user: "cptravelertrip@gmail.com",
    pass: "zukbxqmqpcclsyqp",
  },
});

module.exports = transporter;
