/**
 * This function is used to retrieved information of an user by their email address.
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql.
 * @param {string} emailAddress - the email address of the user we want to retrieve the information.
 * @returns {object} responseObject - the user object include user's information.
 */
async function GetUserInfoByEmailAddress(db, emailAddress) {
  try {
    /** Initailize an user object query from database */
    const user = await db
      .select(
        "PK_USER_ID",
        "USER_ROLE",
        "FIRST_NAME",
        "MIDDLE_NAME",
        "LAST_NAME",
        "SCHOOL_ID",
        "EMAIL_ADDRESS",
        "TAG_ID"
      )
      .from("user_info")
      .where("EMAIL_ADDRESS", "=", emailAddress.trim())
      .first();

    /** If emailAddress is not exists, then the user is not exist */
    if (!user) {
      return null;
    }

    /** If there is user, then we return there information */
    const responseObject = {
      userId: user.PK_USER_ID,
      userRole: user.USER_ROLE,
      firstName: user.FIRST_NAME,
      middleName: user.MIDDLE_NAME,
      lastName: user.LAST_NAME,
      schoolId: user.SCHOOL_ID,
      email: user.EMAIL_ADDRESS,
      tagId: user.TAG_ID,
    };

    /** Return the response object */
    return responseObject;
  } catch (error) {
    /** Logging error, easy to debug */
    console.log(
      "ERROR: There is an error while retrieving user information based on email address: ",
      error
    );
    /** Return error message string */
    return "There is an error occur.";
  }
}

/**
 * This function is used to retrieved information of an user by their school id.
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql.
 * @param {string} schoolId - the school id of the user we want to retrieve the information.
 * @returns {object} responseObject - the user object include user's information.
 */
async function GetUserInfoBySchoolId(db, schoolId) {
  try {
    /** Initialize an object by query to get user information */
    const user = await db
      .select(
        "PK_USER_ID",
        "USER_ROLE",
        "FIRST_NAME",
        "MIDDLE_NAME",
        "LAST_NAME",
        "SCHOOL_ID",
        "EMAIL_ADDRESS",
        "TAG_ID"
      )
      .from("user_info")
      .where("SCHOOL_ID", "=", schoolId.trim())
      .first();

    /** If there is no user, return null */
    if (!user) {
      return null;
    }

    /** The object user */
    const responseObject = {
      userId: user.PK_USER_ID,
      userRole: user.USER_ROLE,
      firstName: user.FIRST_NAME,
      middleName: user.MIDDLE_NAME,
      lastName: user.LAST_NAME,
      schoolId: user.SCHOOL_ID,
      emailAddress: user.EMAIL_ADDRESS,
      tagId: user.TAG_ID,
    };

    /** Return the response object */
    return responseObject;
  } catch (error) {
    /** Logging error, easy to debug */
    console.log(
      "ERROR: There is an error while retrieving user information based on school id: ",
      error
    );
    /** Return error message string */
    return "There is an error occur.";
  }
}

/**
 * This function is used to retrieved information of an user by their school id.
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql.
 * @param {string} schoolId - the school id of the user we want to retrieve the information.
 * @returns {object} responseObject - the user object include user's information.
 */
async function CheckUserExistsByTag(db, tagId) {
  try {
    /** Logs for development */
    // console.log("---- ENTERED CheckUserExistsByTag");
    // console.log("tagId: ", tagId);

    /** Try to return row with matching Tag_ID */
    const match = await db
      .select(1)
      .from("user_info")
      .where("TAG_ID", "=", tagId);

    /** Logs for development */
    // console.log("match: ", match);

    /** If there is no user, return null */
    if (match.length == 0) {
      /** Logs for development */
      // console.log("User: ", tagId, " does not exist!");
      return false;
    }
    /** Logs for development */
    // console.log("User: ", tagId, " does exist!");
    return true;
  } catch (error) {
    /** Logging error, easy to debug */
    console.log(
      "ERROR: There is an error while confirming an existing user from a tag id: ",
      error
    );

    /** Return error message string */
    return "An error occurred confirming an existing user from on a tag id.";
  }
}

module.exports = {
  GetUserInfoByEmailAddress,
  GetUserInfoBySchoolId,
  CheckUserExistsByTag,
};
