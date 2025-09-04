// import twilio from 'twilio';

// Initialize Twilio client with credentials
// const client = twilio(process.env.TWILLIO_SID, process.env.TWILLIO_AUTH_TOKEN);
// const TWILLIO_NUM = process.env.TWILLIO_NUM!;

export const sendOtpSms = async (to: string, otp: string) => {
  const message = `Your Tapsy OTP code is: ${otp}. This code will expire in 10 minutes. Do not share it with anyone.`;

  // TODO: Re-enable Twilio SMS when region permissions are fixed
  // try {
  //   const result = await client.messages.create({
  //     body: message,
  //     from: TWILLIO_NUM,
  //     to: to,
  //   });

  //   console.log(`✅ OTP SMS sent successfully to ${to}. Message SID: ${result.sid}`);
  //   return result;
  // } catch (error) {
  //   console.error('❌ Error sending OTP SMS:', error);
  //   throw new Error('Failed to send OTP SMS');
  // }

  // Temporary: Just log the OTP instead of sending SMS
  console.log(`📱 OTP for ${to}: ${otp}`);
  console.log(`📝 Message: ${message}`);
  return { sid: 'temp-' + Date.now(), status: 'sent' };
};

export const sendSms = async (to: string, message: string) => {
  // TODO: Re-enable Twilio SMS when region permissions are fixed
  // try {
  //   const result = await client.messages.create({
  //     body: message,
  //     from: TWILLIO_NUM,
  //     to: to,
  //   });

  //   console.log(`✅ SMS sent successfully to ${to}. Message SID: ${result.sid}`);
  //   return result;
  // } catch (error) {
  //   console.error('❌ Error sending SMS:', error);
  //   throw new Error('Failed to send SMS');
  // }

  // Temporary: Just log the message instead of sending SMS
  console.log(`📱 SMS for ${to}: ${message}`);
  return { sid: 'temp-' + Date.now(), status: 'sent' };
};
