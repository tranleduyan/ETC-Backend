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

/**
 * Retrieves information about an equipment type based on the provided type ID.
 *
 * @param {object} db - The database connection or query builder.
 * @param {number} typeId - The unique identifier for the equipment type.
 * @returns {object|null|string} - If the type is found, returns an object containing type information;
 *                                 if not found, returns null; if an error occurs, returns an error message string.
 */
async function GetTypeInfoByTypeId(db, typeId) {
    try {
        /** Retrieve type */
        const typePromise = await db('equipment_type').select(
            "PK_TYPE_ID AS typeId",
            "TYPE_NAME AS typeName"
        ).where("PK_TYPE_ID","=", typeId).first();

        const modelsPromise = db("equipment_model").select(
            "PK_MODEL_ID AS modelId",
            "MODEL_NAME AS modelName",
            "MODEL_PHOTO_URL AS modelPhoto"
        ).where("FK_TYPE_ID", "=", parseInt(typeId, 10));

        const equipmentsPromise = db("equipment").select(
            "PK_EQUIPMENT_SERIAL_ID AS serialNumber",
            "MODEL_NAME AS modelName", 
            "MAINTENANCE_STATUS AS maintenanceStatus",
            "RESERVATION_STATUS AS reservationStatus",
            "USAGE_CONDITION AS usageCondition",
            "PURCHASE_COST AS purchaseCost",
            "PURCHASE_DATE AS purchaseDate"
        ).join("equipment_model","equipment.FK_MODEL_ID", "=", "equipment_model.PK_MODEL_ID")
        .where("equipment.FK_TYPE_ID", "=", parseInt(typeId, 10));

        const [type, models, equipments] = await Promise.all([typePromise, modelsPromise, equipmentsPromise]);
        
        

        /** If type not found, return null */
        if(!type) {
            return null;
        }

        /** Build a response object of type information */
        const responseObject = {
            typeId: type.typeId,
            typeName: type.typeName,
            models: models,
            equipments: equipments,
            reserved: 0,
        }

        /** Return the response object */
        return responseObject;
    } catch (error) {
        /** Log the error for debugging */
        console.log("ERROR: There is an error while retrieving type by id: ", error);
        /** Return error message string */
        return "There is an error occur while retrieving type information."
    }
}

/** Exports the functions */
module.exports = {
    GetTypeInfoByTypeId,
    GetTypeInfoByName,
    AddTypeToDatabase
}
