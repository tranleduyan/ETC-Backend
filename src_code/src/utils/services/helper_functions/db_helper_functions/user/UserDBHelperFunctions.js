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

/**
 * Retrieves user usage statistics based on the provided school ID.
 * @param {Object} db - The database instance.
 * @param {number} schoolId - The school ID to retrieve user usage for.
 * @returns {Object} An object containing usage statistics for the user.
 * @throws {string|Error} If there is an error while retrieving user usage statistics.
 */
async function GetUserUsage(db, schoolId) {
  try {
    const getUserRecentlyUsedQuery = db
    .select(
      db.raw('MAX(scan_history.PK_SCAN_HISTORY_ID) AS scanHistoryId'),
      'equipment.PK_EQUIPMENT_SERIAL_ID AS serialId',
      db.raw("CONCAT(MAX(user_info.LAST_NAME), ', ', MAX(user_info.FIRST_NAME)) AS fullName"),
      db.raw('MAX(location.LOCATION_NAME) AS locationName'),
      db.raw('MAX(equipment.RESERVATION_STATUS) AS reservationStatus'),
      "equipment_model.MODEL_PHOTO_URL AS modelPhoto",
      "equipment_model.MODEL_NAME AS modelName",
      "equipment_type.TYPE_NAME AS typeName"
    )
    .from('scan_history')
    .leftJoin('equipment', 'equipment.TAG_ID', '=', 'scan_history.FK_EQUIPMENT_TAG_ID')
    .leftJoin('user_info', 'user_info.TAG_ID', '=', 'scan_history.FK_SCHOOL_TAG_ID')
    .leftJoin('reader_location', 'reader_location.PK_READER_TAG_ID', '=', 'scan_history.FK_LOCATION_ROOM_READER_ID')
    .leftJoin('location', 'location.PK_LOCATION_ID', '=', 'reader_location.FK_LOCATION_ID')
    .leftJoin("equipment_model", "equipment_model.PK_MODEL_ID", "equipment.FK_MODEL_ID")
    .leftJoin("equipment_type", "equipment_type.PK_TYPE_ID", "equipment_model.FK_TYPE_ID")
    .where('user_info.SCHOOL_ID', schoolId)
    .where('scan_history.IS_WALK_IN', 1)
    .where('scan_history.SCAN_TIME', '>=', db.raw('DATE_SUB(NOW(), INTERVAL 1 WEEK)'))
    .groupBy('equipment.PK_EQUIPMENT_SERIAL_ID')

    const getUserCurrentlyUsedQuery = db
    .select(
      db.raw('MAX(scan_history.PK_SCAN_HISTORY_ID) AS scanHistoryId'),
      'equipment.PK_EQUIPMENT_SERIAL_ID AS serialId',
      db.raw("CONCAT(MAX(user_info.LAST_NAME), ', ', MAX(user_info.FIRST_NAME)) AS fullName"),
      db.raw('MAX(location.LOCATION_NAME) AS locationName'),
      db.raw('MAX(equipment.RESERVATION_STATUS) AS reservationStatus'),
      "equipment_model.MODEL_PHOTO_URL AS modelPhoto",
      "equipment_model.MODEL_NAME AS modelName",
      "equipment_type.TYPE_NAME AS typeName"
    )
    .from('scan_history')
    .leftJoin('equipment', 'equipment.TAG_ID', '=', 'scan_history.FK_EQUIPMENT_TAG_ID')
    .leftJoin('user_info', 'user_info.TAG_ID', '=', 'scan_history.FK_SCHOOL_TAG_ID')
    .leftJoin('reader_location', 'reader_location.PK_READER_TAG_ID', '=', 'scan_history.FK_LOCATION_ROOM_READER_ID')
    .leftJoin('location', 'location.PK_LOCATION_ID', '=', 'reader_location.FK_LOCATION_ID')
    .leftJoin("equipment_model", "equipment_model.PK_MODEL_ID", "equipment.FK_MODEL_ID")
    .leftJoin("equipment_type", "equipment_type.PK_TYPE_ID", "equipment_model.FK_TYPE_ID")
    .where('user_info.SCHOOL_ID', schoolId)
    .where('equipment.RESERVATION_STATUS', 'like', 'In Use')
    .groupBy('equipment.PK_EQUIPMENT_SERIAL_ID');

    const result = await db.raw(`
    SELECT * FROM (
      (${getUserRecentlyUsedQuery.toString()})
      UNION ALL
      (${getUserCurrentlyUsedQuery.toString()})
    ) AS combinedResults
    ORDER BY scanHistoryId DESC`);
    
    const dataRetrieved = result[0];
    /** If result not found, user has no records */
    if(dataRetrieved[0] && dataRetrieved[0].length === 0) {
      return {
        recentlyUsed: [],
        currentlyUsed: []
      }
    }

    const cleanRecentlyUsedIds = new Set();
    const cleanCurrentlyUsedIds = new Set();

    const cleanRecentlyUsed = [];
    const cleanCurrentlyUsed = [];

    dataRetrieved.forEach(item => {
      if (item.reservationStatus === 'Available' && !cleanRecentlyUsedIds.has(item.serialId)) {
        cleanRecentlyUsed.push(item);
        cleanRecentlyUsedIds.add(item.serialId);
      }
      if (item.reservationStatus === 'In Use' && !cleanCurrentlyUsedIds.has(item.serialId)) {
        cleanCurrentlyUsed.push(item);
        cleanCurrentlyUsedIds.add(item.serialId);
      }
    });

    /** Return object usage */
    return {
      recentlyUsed: cleanRecentlyUsed,
      currentlyUsed: cleanCurrentlyUsed
    }
  } catch(error) {
    /** If error, log error and return error message*/
    console.log(`ERROR: There is an error while retrieving user usage:`, error);
    return `There is an error while retrieving user usage.`
  } 
} 

module.exports = {
  GetUserInfoByEmailAddress,
  GetUserInfoBySchoolId,
  CheckUserExistsByTag,
  GetUserUsage,
}
