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
 */
async function SendVerificationCode(res, req) {
    try{
        /** Validating before actual perform */
        const errors = await VerificationCodeValidation(res, req);
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
        const numPattern = /^[\d]+$/;

        /** Destructure variables from request body */
        const {firstName, lastName, emailAddress, verificationCode} = req;

        /** If required fields are missing, return missing content */
        if(!req.studentId || (req.isNewAccount === undefined || req.isNewAccount === null) || !firstName || !lastName || !emailAddress || !verificationCode) {
            return responseBuilder.MissingContent(res);
        }

        /** If type of isNewAccount is not a bool, return bad request */
        if(typeof req.isNewAccount !== "boolean"){
            return responseBuilder.BadRequest(res, "Invalid type in request body.");
        }

        /** If the request is for newAccount (Sign Up), help client check emailAddress and studentId existence */
        if(req.isNewAccount === true) {
            const isEmailExist = await dbHelper.GetUserInfoByEmailAddress(db, emailAddress);
            if(isEmailExist && typeof isEmailExist === "string"){
                return responseBuilder.BadRequest(res, isEmailExist);
            }
            if(isEmailExist) {
                return responseBuilder.BadRequest(res, "Email address is already used.");
            }
            if(!numPattern.test(req.studentId)) {
                return responseBuilder.BadRequest(res, "Invalid student ID.");
            }
            const isStudentIdExist = await dbHelper.GetUserInfoByStudentId(db, req.studentId.trim());
            /** Check if there is error while retrieving info by student id */
            if(isStudentIdExist && typeof isStudentIdExist === "string") {
                return responseBuilder.BadRequest(res, isStudentIdExist);
            }
            /** If there is already an user with the sign up student id, return bad request */
            if(isStudentIdExist) {
                return responseBuilder.BadRequest(res, "You have sign up an account with this student ID already.");
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
        if(verificationCode.length !== 4 || !/^[0-9]+$/.test(verificationCode)) {
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
        /** If there is unexpected error, we catch it, log and return error */
        console.log("ERROR: There is an error occurred while validating sending verification code: ", error);
        return responseBuilder.ServerError(res, "There is an error occurr while validating sending verification code.");
    }
}

/** Exports the module/functions */
module.exports = {
    SendVerificationCode
}
