async function GetUserInfoByEmailAddress(db, emailAddress){ 
    try {
        /** Initailize an user object query from database */
        const user = await db.select(
            "PK_USER_ID",
            "USER_ROLE", 
            "FIRST_NAME",
            "MIDDLE_NAME",
            "LAST_NAME",
            "STUDENT_ID",
            "EMAIL_ADDRESS",
            "TAG_ID",
        ).from("user_info").where("EMAIL_ADDRESS", "=", emailAddress.trim()).first();

        /** If emailAddress is not exists, then the user is not exist */
        if(!user) {
            return null;
        }

        /** If there is user, then we return there information */
        const responseObject = {
            userId: user.PK_USER_ID,
            userRole: user.USER_ROLE,
            firstName: user.FIRST_NAME,
            middleName: user.MIDDLE_NAME,
            lastName: user.LAST_NAME,
            studentID: user.STUDENT_ID,
            email: user.EMAIL_ADDRESS,
            tagId: user.TAG_ID
        }

        /** Return the response object */
        return responseObject;
    } catch(error) {
        /** Logging error, easy to debug */
        console.log("ERROR: There is an error while retrieving user information based on email address: ", error); 
        /** Return error message string */
        return "There is an error occur."
    }
}

/**
 * This function is used to retrieved information of an user by their student id.
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} studentId - the student id of the user we want to retrieve the information.
 * @returns {object} responseObject - the user object include user's information.
 */
async function GetUserInfoByStudentId(db, studentId) {
    try{
        /** Initialize an object by query to get user information */
        const user = await db.select(
            "PK_USER_ID",
            "USER_ROLE", 
            "FIRST_NAME",
            "MIDDLE_NAME",
            "LAST_NAME",
            "STUDENT_ID",
            "EMAIL_ADDRESS",
            "TAG_ID",
        ).from("user_info").where("STUDENT_ID", "=", studentId.trim()).first();

        /** If there is no user, return null */
        if(!user) {
            return null;
        }

        /** The object user */
        const responseObject = {
            userId: user.PK_USER_ID,
            userRole: user.USER_ROLE,
            firstName: user.FIRST_NAME,
            middleName: user.MIDDLE_NAME,
            lastName: user.LAST_NAME,
            studentId: user.STUDENT_ID,
            emailAddress: user.EMAIL_ADDRESS,
            tagId: user.TAG_ID
        }

        /** Return the response object */
        return responseObject;
    } catch(error) {
        /** Logging error, easy to debug */
        console.log("ERROR: There is an error while retrieving user information based on student id: ", error); 
        /** Return error message string */
        return "There is an error occur."
    }
    
}

module.exports ={
    GetUserInfoByEmailAddress,
    GetUserInfoByStudentId
}
