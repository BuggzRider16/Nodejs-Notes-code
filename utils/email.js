/*
-) nodemailer is the package used for sending emails (npm i nodemailer)
*/

const nodemailer = require('nodemailer')

const sendEmail = async options => {
/*
Step 1) Create a transporter
      -) It is the carrier of our email
      -) We can use Gmail but it have some restrictions so we will be using mailtrap and it is used for testing mails as well
      -) Mailtrap with nodemailer require these options-- 
*/
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  })

  // 2) Define the email options
  const mailOptions = {
    from: 'Buggz <hello@natours.io>',
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  }

  // 3) Actually send the email
  await transporter.sendMail(mailOptions)
}

module.exports = sendEmail
