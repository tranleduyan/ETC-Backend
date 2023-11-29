/** Initialize neccessary modules */
const db = require("../../../configurations/database/DatabaseConfigurations");
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const bcrypt = require('bcryptjs');

/** 
 *  Handle user sign-in.
 *  @param {object} response - the response object for the HTTP request.
 *  @param {object} requestBody - the body of the request containing sign in details (email address and password).
 *  @returns {object} A response object showing whether request is success or not.
 * 
 * Expected Body Request:
 * emailAddress: "xxx@spu.edu",
 * password: "xxx",
 * 
 * Response Body with status code 200:
 * userId: x,
 * userRole: "Student/Faculty/Admin",
 * firstName: "Aaron",
 * middleName: "",
 * lastName: "Tran",
 * schoolId: xxxxxxxxx,
 * email: xxx@spu.edu,
 * tagId: null for now
 * 
 * If error, catch it and log to cloudwatch, send to the client server error status code of 503 to render.
 */
async function SignIn(response, requestBody) {
    try {
        /** Validate sign in body to see if information they request to our endpoint is valid */
        const errors = await Promise.resolve(SignInValidation(response, requestBody));
        if(errors) {
            return errors;
        }

        /** If validation pass, we need to destructure variable emailAddress from the request body for use. */
        const {emailAddress} = requestBody;

        /** Get user information based on emailAddress */
        const userInfo = await dbHelper.GetUserInfoByEmailAddress(db, emailAddress.toLowerCase().trim());

        /** If userInfo is a string, which means it is an error message */
        if(typeof userInfo === "string") {
            return responseBuilder.ServerError(response, userInfo);
        }

        /** If no error, return OK response */
        return responseBuilder.BuildResponse(response, 200, {
            message:"Sign in successfully.",
            responseObject: userInfo
        });
    } catch(error) {
        /** Loggin error, easy to debug */
        console.log("ERROR: There is an error while siging in: ", error);
        /** Return error message to client */
        return responseBuilder.ServerError(response, "There is an error while signing in.");
    }
}

/**
 * Handle validation before actually perform sign in
 * @param {object} response - the response object for the HTTP request.
 * @param {object} requestBody - the body of the request containing sign in details.
 * @returns {object} response - if failed validation, send back to client bad request response, otherwise null.
 */
async function SignInValidation(response, requestBody) {
    try{
        /** Destructure variables from the request body */
        const {emailAddress, password} = requestBody;
        
        /** Check if user is filled in required fields */
        if(!emailAddress || !password) {
            return responseBuilder.MissingContent(response);
        }

        /** Check if email address is exists (or already sign up) */
        const existUser = await db.select("ACCOUNT_PASSWORD").from("user_info").where("EMAIL_ADDRESS", "=", emailAddress.toLowerCase().trim()).first();
        if(!existUser) {
            return responseBuilder.BuildResponse(response, 404, {
                message:"Invalid credentials."
            })
        }

        /** If user is found with the email address, we need to check for their password if it correct */
        // TODO: QA Validating Correct Password after sign up is done!
        if(!bcrypt.compareSync(password, existUser.ACCOUNT_PASSWORD)) {
            return responseBuilder.BuildResponse(response, 404, {
                message:"Invalid credentials."
            })
        }
        
        /** If all checks pass, return null to indicate validation success */
        return null;
    } catch(error){
        /** Logging unexpected error, help for debug */
        console.log("ERROR: There is an error while validating sign in: ", error);
        /** Return error message to the client */
        return responseBuilder.ServerError(response, "There is an error while validating sign in.");
    }
}

/** Exports the module/functions */
module.exports = {
    SignIn,
    SignInValidation
}
