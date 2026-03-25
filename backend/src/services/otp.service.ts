// Development ke liye mock OTP service
// Production mein hum isse actual SMS API se replace karenge

// 4-digit ka random OTP generate karne ka function
export const generateOTP = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};

// OTP send karne ka function (Abhi terminal mein log karega)
export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  try {
    // TODO: Aage chalkar MSG91/Twilio ka API call yahan aayega
    console.log(`\n=========================================`);
    console.log(`📲 [MOCK SMS] OTP for ${phone} is: ${otp}`);
    console.log(`=========================================\n`);
    
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP:", error);
    return false;
  }
};