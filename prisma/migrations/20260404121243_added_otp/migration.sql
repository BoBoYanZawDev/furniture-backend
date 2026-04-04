-- CreateTable
CREATE TABLE "Otp" (
    "id" SERIAL NOT NULL,
    "phone_no" VARCHAR(15) NOT NULL,
    "otp" VARCHAR(6) NOT NULL,
    "rememberToken" VARCHAR(255) NOT NULL,
    "verifiedToken" VARCHAR(255),
    "count" SMALLINT NOT NULL DEFAULT 0,
    "error" SMALLINT NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);
