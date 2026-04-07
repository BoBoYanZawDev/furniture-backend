export const checkUserExists = (user : any) =>{
        if(user){
          const error:any = new Error("Phone number already registered");
          error.status = 409;
          error.code = "USER_EXISTS";
          throw error;
        }
}

export const checkOptErrorIfSameDate = (isSameDate: boolean,errorCount: number) => {
    if(isSameDate && errorCount >= 5){  
        const error:any = new Error("Too many OTP requests. Please try again tomorrow.");
        error.status = 401;
        error.code = "OTP_REQUEST_LIMIT";
        throw error;
    }

}