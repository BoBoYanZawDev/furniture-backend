import { prisma } from "../lib/prisma"

export const getUserByPhone = async (phone: string) => {
    return prisma.user.findUnique({ where: { phone_no : phone } });
}

export const getOtpByPhone = async (phone: string) => {
    return prisma.otp.findUnique({ where: { phone_no : phone } });
}

export const createOtp = async (otpData :any) => {
    return prisma.otp.create({ data: otpData });
}

export const updateOtp = async (id: number, otpData :any) => {
    return prisma.otp.update({ where: { id }, data: otpData });
}