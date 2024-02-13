/**
 * This function is used to retrieve information of a equipment by it's primary key (serial ID).
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} serialId - the serial ID of the tool we want to retrieve the information with.
 * @returns {object} responseObject - the user object include user's information.
 */
async function GetEquipmentBySerialId(db, serialId) {
    try{
        /** Initialize an object by query to get tool information */
        const equipment = await db.select(
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
        if(!equipment) {
            return null;
        }

        /** The object user */
        const responseObject = {
            serialId: equipment.PK_EQUIPMENT_SERIAL_ID,
            typeId: equipment.FK_TYPE_ID,
            modelId: equipment.FK_MODEL_ID,
            currentRoom: equipment.FK_CURRENT_ROOM_READER_ID,
            tagId: equipment.TAG_ID,
            maintenanceStatus: equipment.MAINTENANCE_STATUS,
            reservationStatus: equipment.RESERVATION_STATUS,
            usageCondition: equipment.USAGE_CONDITION,
            purchaseCost: equipment.PURCHASE_COST,
            purchaseDate: equipment.PURCHASE_DATE
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
 * Adds new scan data to scan log table
 *
 * @param {object} db - The database connection or query builder.
 * @param {number} scanData - Scan data of card read by the antenna.
 * @param {number} scanTime - The time that the scan was logged. 
 * @returns {object|null|string} - If the type is found, returns an object containing type information;
 *                                 if not found, returns null; if an error occurs, returns an error message string.
 */
async function AddScanToDatabase(db, scanData) {
    
}

/** Exports the functions */
module.exports = {
    GetEquipmentBySerialId: GetEquipmentBySerialId,
    AddScanToDatabase:AddScanToDatabase
}
