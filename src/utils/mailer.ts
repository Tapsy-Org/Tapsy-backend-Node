import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Gmail address
    pass: process.env.EMAIL_PASS, // App Password (not your real Gmail password)
  },
});

export const sendOtpEmail = async (to: string, otp: string) => {
  const mailOptions = {
    from: `"Tapsy Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: '🔐 Your Tapsy OTP Code',
    text: `Hello, your One-Time Password (OTP) is: ${otp}. This code will expire in 10 minutes. 
If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6; max-width: 600px; margin: 20px auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color:#2d89ef;">Tapsy Verification</h2>
        <p>Hello,</p>
        <p>Your One-Time Password (OTP) is:</p>
        <h1 style="color:#2d89ef; letter-spacing: 4px;">${otp}</h1>
        <p>This code is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
        <hr style="margin:20px 0;">
        <p style="font-size:12px; color:#888;">If you did not request this, you can safely ignore this email.</p>
        <p style="font-size:12px; color:#888;">— Tapsy Security Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP email sent successfully to ${to}`);
  } catch (error) {
    console.error('❌ Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
};
