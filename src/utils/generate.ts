import { randomBytes } from "crypto";

export const generateOTP = () => {
    if(process.env.NODE_ENV === "development"){
        return process.env.OTP ? parseInt(process.env.OTP) : 123456;
    }
    const otp = parseInt(randomBytes(3).toString("hex"),16) % 900000 + 100000; 
    return otp;
}

export const generateToken = (length: number = 32) => {
    return randomBytes(length).toString("hex");
}