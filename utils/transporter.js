import "dotenv/config";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "c2390804.ferozo.com",
  port: 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

transporter.verify().then(() => {
  console.log("Ready for send mails");
});

export default transporter;
