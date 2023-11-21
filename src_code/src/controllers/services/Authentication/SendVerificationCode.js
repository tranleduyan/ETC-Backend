/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const helpers = require("../../../utils/interfaces/IHelperFunctions");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const db = require("../../../configurations/database/DatabaseConfigurations");

/**
 * Handle sending verification code to an email address
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} - This response object indicates the result of the sending verification code attempt.
 * 
 * Expected Request Body:
 * firstName: "Aaron",
 * lastName: "Tran",
 * emailAddress: xxx@spu.edu,
 * schoolId: the spu id of that individual - "xxxxxxxxx", must be in 9 digits format,
 * verificationCode: the generated code from the front end,
 * isNewAccount: set it true if it is a new account and are during sign up, it will be false during 2 factor authentication (**nice to have only)
 * 
 * return a message with status code 200, indicating verification code has been sent.
 * if error, return a message with status 503, indicating there were some errors from the server. Log it to cloudwatch as well.
 */
async function SendVerificationCode(res, req) {
    try{
        /** Validating before actual perform */
        const errors = await Promise.resolve(VerificationCodeValidation(res, req));
        if(errors) {
            return errors;
        }
        
        /** Destructure variables from the request body */
        const {firstName, lastName, emailAddress, verificationCode} = req;

        /** Try send verification code, if failed, it will be store in sendVerificationCodeErrorMessage variable */
        const sendVerificationCodeErrorMessage = await helpers.SendVerificationCode(firstName, lastName, emailAddress, verificationCode);
        
        /** If failed sending verification due to some error, return bad request */
        if(sendVerificationCodeErrorMessage) {
            /** Capture the error */
            console.log(sendVerificationCodeErrorMessage);
            return responseBuilder.BadRequest(res, "There is an error while sending code to your email. Please try again later.");
        }

        /** Success response */
        return responseBuilder.BuildResponse(res, 200, {
            message: "A verification code sent to your email address. Please check inbox and spam folder.",
        });
    } catch(error) {
        /** If there is some unexpected error, return log, and error */
        console.log("ERROR: There is an error occurred while sending verification code: ", error);
        return responseBuilder.ServerError(res, "Sorry, an error occur while sending verification code.");
    }
}

/**
 * Handle validating before sending verification code, to avoid unexpected error (503).
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} response - the bad request response if failed validation, otherwise null.
 */
async function VerificationCodeValidation(res, req) {
    try {
        /** Declare a email pattern ends with @spu.edu (regex) */
        const emailPattern = /.+@spu\.edu$/;

        /** Declare a number pattern (regex) */
        const numPattern = /^\d+$/;

        /** Destructure variables from request body */
        const {firstName, lastName, emailAddress, verificationCode} = req;

        /** If required fields are missing, return missing content */
        if(!req.schoolId || (req.isNewAccount === undefined || req.isNewAccount === null) || !firstName || !lastName || !emailAddress || !verificationCode) {
            return responseBuilder.MissingContent(res);
        }

        /** If type of isNewAccount is not a bool, return bad request */
        if(typeof req.isNewAccount !== "boolean"){
            return responseBuilder.BadRequest(res, "Invalid type in request body.");
        }

        /** If the request is for newAccount (Sign Up), help client check emailAddress and schoolId existence */
        if(req.isNewAccount === true) {
            const newAccountError = await Promise.resolve(NewAccountValidator(res, emailAddress, req.schoolId.trim()));
            if(newAccountError) {
                return newAccountError;
            }
        }
        
        /** Validate ensure firstName and lastName should be less than 25 characters (Database restriction) */
        if(firstName.length > 25 || lastName.length > 25) {
            return responseBuilder.BadRequest(res, "First name and last name must be less than 25 characters.");
        }

        /** Ensure email is always @spu.edu domain */
        if(!emailPattern.test(emailAddress.trim())) {
            return responseBuilder.BadRequest(res, "Invalid email address. Please try again.");
        }

        /** Ensure that the verification code is valid. Should be four in length and a string type */
        if(verificationCode.length !== 4 || !numPattern.test(verificationCode)) {
            /** If verificationCode is not a string, then return bad request */
            if(typeof verificationCode !== "string") {
                return responseBuilder.BadRequest(res, "Invalid type of verification code. Please try again.");
            } 
            /** Return bad request for all bad format verification code */
            return responseBuilder.BadRequest(res, "Invalid verification code. Please try again.");
        }

        /** Return null to indicate pass the validation */
        return null;
    } catch(error) {
        /** If there is unexpected error, we catch it, log to cloudwatch and return error */
        console.log("ERROR: There is an error occurred while validating sending verification code: ", error);
        return responseBuilder.ServerError(res, "There is an error occurr while validating sending verification code.");
    }
}

/**
 * Validates a new account based on email address and school ID.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} emailAddress - The email address to be validated.
 * @param {string} schoolId - The school ID to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
async function NewAccountValidator(res, emailAddress, schoolId){
    /** Declare a number pattern (regex) */
    const numPattern = /^\d+$/;
    
    /** Check if email address is already in use */
    const isEmailExist = await dbHelper.GetUserInfoByEmailAddress(db, emailAddress);
    if(isEmailExist && typeof isEmailExist === "string"){
        return responseBuilder.BadRequest(res, isEmailExist);
    }
    if(isEmailExist) {
        return responseBuilder.BadRequest(res, "Email address is already used.");
    }

    /** Validate school ID format */
    if(!numPattern.test(schoolId)) {
        return responseBuilder.BadRequest(res, "Invalid school ID.");
    }

    /** Check if school ID is already in use */
    const isSchoolIdExist = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, schoolId.trim()));

    /** Check if there is error while retrieving info by school id */
    if(isSchoolIdExist && typeof isSchoolIdExist === "string") {
        return responseBuilder.BadRequest(res, isSchoolIdExist);
    }
    /** If there is already an user with the sign up school id, return bad request */
    if(isSchoolIdExist) {
        return responseBuilder.BadRequest(res, "School ID is already used.");
    }

    /** Return null indicate validation passed */
    return null; 
}

/** Exports the module/functions */
module.exports = {
    SendVerificationCode
}
