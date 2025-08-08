import nodemailer from 'nodemailer';

// TODO: Use environment variables for these settings in production
const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'testuser@example.com', // generated ethereal user
    pass: 'password', // generated ethereal password
  },
});

export const sendOtpEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: '"Tapsy" <noreply@tapsy.com>',
    to,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`,
    html: `<b>Your OTP code is ${otp}</b>`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  } catch (error) {
    console.error('Error sending email:', error);
  }
};
