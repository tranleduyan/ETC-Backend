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
 *      "schoolId": "", 
 *      "emailAddress": "tran12312@spu.edu",
 *      "accountPassword":"TallasGiraffe1!"
 * }
 * 
 * Response is the message with status code 200 if successfully
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function SignUp(res, req) {
    try{ 
        /** Validate if Sign Up information from request body is valid */
        const errors = await Promise.resolve(SignUpValidation(res, req));
        if (errors) {
            return errors;
        } 
        
        /** Destructure variables from the request body */
        const {userRole, firstName, middleName, lastName, emailAddress, accountPassword } = req;
        
        /** Handle if emtpy schoolId, it should be null instead of empty string */
        if(req.schoolId.length === 0 || req.schoolId === "") {
            req.schoolId = null;
        } else {
            /** If there is schoolId, trim trailing leading spaces */
            req.schoolId = req.schoolId.trim();
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
            SCHOOL_ID: req.schoolId,
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
        /** Destructure variables from the request body */
        const {userRole, firstName, lastName, emailAddress, accountPassword } = req;

        /** We check for userRole and schoolId even though they are optional because we expect to have them in request body */
        if(!userRole || !firstName || !lastName || !emailAddress || !accountPassword) {
            return responseBuilder.MissingContent(res);
        }

        /** Validate user role */
        const userRoleError = UserRoleValidator(res, userRole);
        if(userRoleError) {
            return userRoleError;
        }
        
        /** Validate first name length */
        const firstNameLengthError = NameLengthValidator(res, firstName);
        if(firstNameLengthError) {
            return firstNameLengthError;
        }

        /** Validate last name length */
        const lastNameLengthError = NameLengthValidator(res, lastName, "Last");
        if(lastNameLengthError) {
            return lastNameLengthError;
        }

        /** Validate schoolId ID if present */
        if(req.schoolId && req.schoolId.length > 0) {
            const schoolIdError = await Promise.resolve(SchoolIdValidator(res, req.schoolId));
            if(schoolIdError) {
                return schoolIdError;
            }
        }

        /** If accountPassword does not meet the password criteria, return error */
        if(accountPassword.length < 6) {
            return responseBuilder.BadRequest(res, "Password must be at least 6 characters long.")
        }

        /** Validate email address */
        const emailVerificationError = await Promise.resolve(EmailValidator(res, emailAddress));
        if(emailVerificationError) {
            return emailVerificationError;
        }

        /** Return null to indicate passing the validation */
        return null;
    } catch(error) {
        /** If an unexpected server error occurs while validating the sign up, return log and error. */
        console.log("ERROR: An error occurred while signing up: ", error);
        return responseBuilder.ServerError(res, "Sorry, there was an error while validating your sign up information.");
    }
}

/**
 * Validates the user role.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} userRole - The user role to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function UserRoleValidator(res, userRole) {
    if(userRole.trim() !== "Student" && userRole.trim() !== "Faculty" && userRole.trim() !== "Admin") {
        return responseBuilder.BadRequest(res, "Invalid user role.")
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the length of a name.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} name - The name to be validated.
 * @param {string} [type="First"] - The type of the name, default is "First".
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
function NameLengthValidator(res, name, type="First") { 
    if(name.length > 25) {
        if(type === "First") {
            return responseBuilder.BadRequest(res, "First name is longer than 25 characters.");
        }
        return responseBuilder.BadRequest(res, "Last name is longer than 25 characters.");
    }

    /** Indicate pass the validation */
    return null;
}

/**
 * Validates the school ID.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} schoolId - The school ID to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
async function SchoolIdValidator(res, schoolId){
    /** Declare a schoolId pattern */
    const schoolIdPattern = /^\d{9}$/;

    /** Verifying if the school id is valid */
    if(schoolId.length !== 9 || !schoolIdPattern.test(schoolId)) {
        return responseBuilder.BadRequest(res, "Invalid school ID.");
    }
    /** Retrieve user with the sign up school id to check for the uniqueness */
    const isUserWithRequestSchoolId = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, schoolId.trim()));

    if(isUserWithRequestSchoolId && typeof isUserWithRequestSchoolId === "string") {
        return responseBuilder.BadRequest(res, isUserWithRequestSchoolId);
    }

    /** If there is already an user with the sign up school id, return bad request */
    if(isUserWithRequestSchoolId) {
        return responseBuilder.BadRequest(res, "School ID is already used.");
    }

    /** Indicate pass the validation */
    return null;    
}

/**
 * Validates the email address.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {string} emailAddress - The email address to be validated.
 * @returns {object|null} - Returns a BadRequest response if validation fails, otherwise null.
 */
async function EmailValidator(res, emailAddress) {
    /** Declare a email pattern ends with @spu.edu (regex) */
    const emailPattern = /.+@spu\.edu$/;

    /** Check if emailAddress ends with @spu.edu */
    if(!emailPattern.test(emailAddress.trim())){
        return responseBuilder.BadRequest(res, "Please enter a valid spu email address.");
    }

    /** Retrieve user with the sign up email address to check for the uniqueness */
    const isUserWithRequestEmail = await Promise.resolve(dbHelper.GetUserInfoByEmailAddress(db, emailAddress.trim()));

    /** Check if the isUserWithRequestEmail is not null and if it type is string, return bad request */
    if(isUserWithRequestEmail && typeof isUserWithRequestEmail === "string") {
        return responseBuilder.BadRequest(res, isUserWithRequestEmail);
    }
    /** If there is already an user with the sign up email address, return bad request */
    if(isUserWithRequestEmail) { 
        return responseBuilder.BadRequest(res,"The email address is already in used.");
    }

    /** Indicate pass the validation */
    return null;
}
/** Exports the module/functions */
module.exports = {
    SignUp,
    SignUpValidation
}
