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
 * This function is used to retrieve information of a tool by it's primary key (serial ID).
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} serialId - the serial ID of the tool we want to retrieve the information with.
 * @returns {object} responseObject - the user object include user's information.
 */
async function GetToolBySerialId(db, serialId) {
    try{
        /** Initialize an object by query to get tool information */
        const tool = await db.select(
            "PK_EQUIPMENT_SERIAL_ID",
            "FK_TYPE_ID", 
            "FK_MODEL_ID",
            "FK_CURRENT_ROOM_READER_ID",
            "TAG_ID",
            "MAINTENANCE_STATUS",
            "RESERVATION_STATUS",
            "USAGE_CONDITION",
            "PURCHASE_COST",
            "PURCHASE_DATE",
        ).from("equipment").where("PK_EQUIPMENT_SERIAL_ID", "=", serialId.trim()).first();

        /** If there is no tool, return null */
        if(!tool) {
            return null;
        }

        /** The object user */
        const responseObject = {
            serialId: tool.PK_EQUIPMENT_SERIAL_ID,
            typeId: tool.FK_TYPE_ID,
            modelId: tool.FK_MODEL_ID,
            currentRoom: tool.FK_CURRENT_ROOM_READER_ID,
            tagId: tool.TAG_ID,
            maintenanceStatus: tool.MAINTENANCE_STATUS,
            reservationStatus: tool.RESERVATION_STATUS,
            usageCondition: tool.USAGE_CONDITION,
            purchaseCost: tool.PURCHASE_COST,
            purchaseDate: tool.PURCHASE_DATE
        }

        /** Return the response object */
        return responseObject;
    } catch(error) {
        /** Logging error, easy to debug */
        console.log("ERROR: There is an error while retrieving tool information based on serial ID: ", error); 
        /** Return error message string */
        return "There is an error occur."
    }
    
}

/**
 * This function is used to retrieved information of a type by it's ID.
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} typeId - the type ID of the type we want to retrieve.
 * @returns {object} responseObject - the user object include items's information.
 */
async function GetTypeById(db, typeId) {
    try{
        /** Initialize an object by query to get type information */
        const type = await db.select(
            "PK_TYPE_ID",
            "TYPE_NAME",
        ).from("equipment_type").where("PK_TYPE_ID", "=", typeId).first();

        /** If there is no type, return null */
        if(!type) {
            return null;
        }

        /** The object item */
        const responseObject = {
            typeId: type.PK_TYPE_ID,
            typeName: type.TYPE_NAME
        }

        /** Return the response object */
        return responseObject;
    } catch(error) {
        /** Logging error, easy to debug */
        console.log("ERROR: There is an error while retrieving type information by ID: ", error); 
        /** Return error message string */
        return "There is an error occur while retrieving type information."
    }
}

/**
 * This function is used to retrieved information of a model by it's ID.
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} modelId - the model ID of the model we want to retrieve.
 * @returns {object} responseObject - the user object include items's information.
 */
async function GetModelById(db, modelId) {
    try{
        /** Initialize an object by query to get type information */
        const model = await db.select(
            "PK_MODEL_ID",
            "FK_TYPE_ID",
            "MODEL_NAME",
            "MODEL_PHOTO_URL",
        ).from("equipment_model").where("PK_MODEL_ID", "=", modelId).first();

        /** If there is no model, return null */
        if(!model) {
            return null;
        }

        /** The object item */
        const responseObject = {
            modelId: model.PK_MODEL_ID,
            typeId: model.FK_TYPE_ID,
            modelName: model.MODEL_NAME,
            modelPhotoUrl: model.MODEL_PHOTO_URL
        }

        /** Return the response object */
        return responseObject;
    } catch(error) {
        /** Logging error, easy to debug */
        console.log("ERROR: There is an error while retrieving model information by ID: ", error); 
        /** Return error message string */
        return "There is an error occur while retrieving model information."
    }
}

module.exports ={
    GetUserInfoByEmailAddress,
    GetUserInfoBySchoolId,
    GetToolBySerialId,
    GetTypeById,
    GetModelById
}
