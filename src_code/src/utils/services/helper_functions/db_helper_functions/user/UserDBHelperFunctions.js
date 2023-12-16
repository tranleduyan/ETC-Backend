/**
 * This function is used to retrieved information of an user by their email address.
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} emailAddress - the email address of the user we want to retrieve the information.
 * @returns {object} responseObject - the user object include user's information.
 */
async function GetUserInfoByEmailAddress(db, emailAddress){ 
    try {
        /** Initailize an user object query from database */
        const user = await db.select(
            "PK_USER_ID",
            "USER_ROLE", 
            "FIRST_NAME",
            "MIDDLE_NAME",
            "LAST_NAME",
            "SCHOOL_ID",
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
            schoolId: user.SCHOOL_ID,
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
 * This function is used to retrieved information of an user by their school id.
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} schoolId - the school id of the user we want to retrieve the information.
 * @returns {object} responseObject - the user object include user's information.
 */
async function GetUserInfoBySchoolId(db, schoolId) {
    try{
        /** Initialize an object by query to get user information */
        const user = await db.select(
            "PK_USER_ID",
            "USER_ROLE", 
            "FIRST_NAME",
            "MIDDLE_NAME",
            "LAST_NAME",
            "SCHOOL_ID",
            "EMAIL_ADDRESS",
            "TAG_ID",
        ).from("user_info").where("SCHOOL_ID", "=", schoolId.trim()).first();

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
            schoolId: user.SCHOOL_ID,
            emailAddress: user.EMAIL_ADDRESS,
            tagId: user.TAG_ID
        }

        /** Return the response object */
        return responseObject;
    } catch(error) {
        /** Logging error, easy to debug */
        console.log("ERROR: There is an error while retrieving user information based on school id: ", error); 
        /** Return error message string */
        return "There is an error occur."
    }
}

/**
 * This function is used to retrieved information of an item by by it's ID.
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} equipment_type_name - the type name of the item we want to retrieve the information.
 * @returns {object} responseObject - the user object include items's information.
 */
async function GetTypeInfoByName(db, equipment_type_name) {
    try{
        /** Initialize an object by query to get item information */
        const item = await db.select(
            "PK_TYPE_ID",
            "TYPE_NAME",
        ).from("equipment_type").where("TYPE_NAME", "=", equipment_type_name.trim()).first();

        /** If there is no item, return null */
        if(!item) {
            return null;
        }

        /** The object item */
        const responseObject = {
            typeId: item.PK_TYPE_ID,
            typeName: item.TYPE_NAME
        }

        /** Return the response object */
        return responseObject;
    } catch(error) {
        /** Logging error, easy to debug */
        console.log("ERROR: There is an error while retrieving type information by name: ", error); 
        /** Return error message string */
        return "There is an error occur while retrieving type information."
    }
}

/**
 * This function is used to add a type to the database
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} equipment_type_name - the type name of the item we want to add to databse
 * @returns {object} addedType -the object including the added type's information.
 */
async function AddTypeToDatabase(db, equipment_type_name) {
    try {
        /** Insert the new type into the database and retrieve the inserted type ID */
        const [typeId] = await db('equipment_type').insert({ TYPE_NAME: equipment_type_name });

        /** Retrieve the inserted type information using the type ID */
        const addedType = await db('equipment_type').select(
            'PK_TYPE_ID',
            'TYPE_NAME'
        ).where('PK_TYPE_ID', '=', typeId).first();

        /** The new added type object */
        const responseObject = {
            typeId: addedType.PK_TYPE_ID,
            typeName: addedType.TYPE_NAME,
        }

        /** Return the response object */
        return responseObject;
    } catch (error) {
        /** Log the error for debugging */
        console.log("ERROR: There is an error while adding type to the database: ", error);
        /** Return error message string */
        return "There is an error occur while adding type."
    }
}

module.exports ={
    GetUserInfoByEmailAddress,
    GetUserInfoBySchoolId,
    GetTypeInfoByName,
    AddTypeToDatabase
}
