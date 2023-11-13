async function GetUserInfoBasedOnEmailAddress(db, emailAddress){ 
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
        ).from("user_info").where("EMAIL_ADDRESS", "=", emailAddress.toLowerCase().trim()).first();

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

module.exports ={
    GetUserInfoBasedOnEmailAddress,
}
