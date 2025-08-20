import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Use environment variable
    pass: process.env.EMAIL_PASS, // Gmail App Password, not your normal password
  },
});

export const sendOtpEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: '"Tapsy" <yashv9409@gmail.com>', // Sender
    to, // Recipient
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
    html: `<b>Your OTP code is ${otp}</b>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to', to);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
