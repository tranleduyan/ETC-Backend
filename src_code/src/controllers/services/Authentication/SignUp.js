/** Initialize neccessary modules */
const bcrypt = require("bcryptjs");
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

/**
 * Handle user sign-up and insert the new account. The password is encrypted.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} - This response object indicates the result of the sign-up attempt.
 * 
 * Expected Request Body: 
 * {
 *      "userRole": "Student",
 *      "firstName": "Le",
 *      "middleName": "",
 *      "lastName": "Tran",
 *      "studentId": "", 
 *      "emailAddress": "tran12312@spu.edu",
 *      "accountPassword":"TallasGiraffe1!"
 * }
 */
async function SignUp(res, req) {
    try{ 
        /** Validate if Sign Up information from request body is valid */
        const errors = await SignUpValidation(res, req);
        if (errors) {
            return errors;
        } 
        
        /** Destructure variables from the request body */
        const {userRole, firstName, middleName, lastName, emailAddress, accountPassword } = req;
        
        /** Handle if emtpy studentId, it should be null instead of empty string */
        if(req.studentId.length === 0 || req.studentId === "") {
            req.studentId = null;
        } else {
            /** If there is studentId, trim trailing leading spaces */
            req.studentId = req.studentId.trim();
        }

        /** Generate salt for encrypting password */
        const salt = await bcrypt.genSalt(10); 

        /** Encrypt the password */
        const encryptedPassword = await bcrypt.hash(accountPassword, salt);

        /** Prepare data we insert to the table */
        const insertData = {
            USER_ROLE: userRole.trim(),
            FIRST_NAME: firstName.trim(),
            MIDDLE_NAME: middleName.trim(),
            LAST_NAME: lastName.trim(),
            STUDENT_ID: req.studentId,
            EMAIL_ADDRESS: emailAddress.trim(),
            ACCOUNT_PASSWORD: encryptedPassword,
        }

        /** Inserting 'insertData' into the table */
        await db("user_info").insert(insertData);

        /** Return 'Sign up successfully' message after insert to table successfully */
        return responseBuilder.BuildResponse(res, 200, {
            message: "Sign up successfully."
        });
    } catch(error){ 
        /** If an unexpected server error occurs while signing up after passing validation, return log and error. */
        console.log("ERROR: An error occurred while signing up: ", error);
        return responseBuilder.ServerError(res, "Sorry, there was an error while signing up.");
    }
}

/**
 * Handle sign up validation (TODO: Have not verify if email address is faculty or admin yet).
 * @param {object} res - the response object for the HTTP request.
 * @param {object} req - the body of the request containing sign up details.
 * @returns {object} res - if failed validation, send back to client bad request response, otherwise null.
 */
async function SignUpValidation(res, req) {
    try {
        /** Declare a email pattern ends with @spu.edu (regex) */
        const emailPattern = /.+@spu\.edu$/;

        /** Declare a number pattern (regex) */
        const numPattern = /^[\d]+$/;

        /** Destructure variables from the request body */
        const {userRole, firstName, lastName, studentId, emailAddress, accountPassword } = req;

        /** We check for userRole and studentId even though they are optional because we expect to have them in request body */
        if(!userRole || !firstName || !lastName || !emailAddress || !accountPassword) {
            return responseBuilder.MissingContent(res);
        }

        if(userRole.trim() !== "Student" && userRole.trim() !== "Faculty" && userRole.trim() !== "Admin") {
            return responseBuilder.BadRequest(res, "Invalid user role.")
        }

        if(firstName.length > 25) {
            return responseBuilder.BadRequest(res, "First name is longer than 25 characters.");
        }

        if(lastName.length > 25) {
            return responseBuilder.BadRequest(res, "Last name is longer than 25 characters.");
        }

        if(req.studentId && req.studentId.length > 0){
            /** Verifying if the student id is valid */
            if(req.studentId.length !== 9 || !numPattern.test(req.studentId)) {
                return responseBuilder.BadRequest(res, "Invalid student ID.");
            }

            /** Retrieve user with the sign up student id to check for the uniqueness */
            const isUserWithRequestStudentId = await dbHelper.GetUserInfoByStudentId(db, studentId.trim());
            
            if(isUserWithRequestStudentId && typeof isUserWithRequestStudentId === "string") {
                return responseBuilder.BadRequest(res, isUserWithRequestStudentId);
            }

            /** If there is already an user with the sign up student id, return bad request */
            if(isUserWithRequestStudentId) {
                return responseBuilder.BadRequest(res, "Student ID is already used.");
            }
        }

        /** If accountPassword does not meet the password criteria, return error */
        if(accountPassword.length < 6) {
            return responseBuilder.BadRequest(res, "Password must be at least 6 characters long.")
        }

        /** Check if emailAddress ends with @spu.edu */
        if(!emailPattern.test(emailAddress.trim())){
            return responseBuilder.BadRequest(res, "Please enter a valid spu email address.");
        }

        /** Retrieve user with the sign up email address to check for the uniqueness */
        const isUserWithRequestEmail = await dbHelper.GetUserInfoByEmailAddress(db, emailAddress.trim());

        if(isUserWithRequestEmail && typeof isUserWithRequestEmail === "string") {
            return responseBuilder.BadRequest(res, isUserWithRequestEmail);
        }
        /** If there is already an user with the sign up email address, return bad request */
        if(isUserWithRequestEmail) { 
            return responseBuilder.BadRequest(res,"The email address is already in used.");
        }

        /** Return null to indicate passing the validation */
        return null;
    } catch(error) {
        /** If an unexpected server error occurs while validating the sign up, return log and error. */
        console.log("ERROR: An error occurred while signing up: ", error);
        return responseBuilder.ServerError(res, "Sorry, there was an error while validating your sign up information.");
    }
}

/** Exports the module/functions */
module.exports = {
    SignUp,
    SignUpValidation
}
