const { request } = require("express");

/**
 * This function is used to retrieve information of a equipment by it's primary key (serial ID).
 * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
 * @param {string} serialId - the serial ID of the tool we want to retrieve the information with.
 * @returns {object} responseObject - the user object include user's information.
 */
async function GetEquipmentBySerialId(db, serialId) {
    try{
        /** Create promise to get equipment information */
        const getEquipmentInformationPromise = db
            .select(
                "equipment_model.MODEL_PHOTO_URL AS modelPhoto",
                "equipment_type.PK_TYPE_ID AS typeId",
                "equipment_type.TYPE_NAME AS typeName",
                "equipment_model.PK_MODEL_ID AS modelId",
                "equipment_model.MODEL_NAME AS modelName",
                "equipment.PK_EQUIPMENT_SERIAL_ID AS serialId",
                "equipment.MAINTENANCE_STATUS AS maintenanceStatus",
                "equipment.RESERVATION_STATUS AS reservationStatus",
                "equipment.USAGE_CONDITION AS usageCondition",
                "equipment.PURCHASE_COST AS purchaseCost",
                "equipment.PURCHASE_DATE AS purchaseDate",
                "equipment.TAG_ID AS rfidTag",
                "reader_location.FK_LOCATION_ID AS currentRoom"
            )
            .from("equipment_model")
            .leftJoin("equipment_type", "equipment_type.PK_TYPE_ID", "=", "equipment_model.FK_TYPE_ID")
            .leftJoin("equipment", "equipment.FK_MODEL_ID", "=", "equipment_model.PK_MODEL_ID")
            .leftJoin("reader_location", "equipment.FK_CURRENT_ROOM_READER_ID", "=", "reader_location.PK_READER_TAG_ID")
            .where("equipment.PK_EQUIPMENT_SERIAL_ID", "=", serialId.trim())
            .first();
        
        /** Create promise to get home room list of the equipment */
        const getEquipmentHomeRoomListPromise = db 
            .select(
                "reader_location.FK_LOCATION_ID AS location"
            ) 
            .from("equipment_home")
            .leftJoin("reader_location", "reader_location.PK_READER_TAG_ID", "=", "equipment_home.FK_ROOM_READER_TAG_ID")
            .where("equipment_home.FK_EQUIPMENT_SERIAL_ID", "=", serialId.trim())
            .orderBy("location", "asc");

        /** Concurrently perform retrieving equipment information and equipment home room list */
        const [equipmentInformation, equipmentHomeRoomList] = await Promise.all([getEquipmentInformationPromise, getEquipmentHomeRoomListPromise]);

        /** If equipment information is not exist, return null */
        if(!equipmentInformation) {
            return null;
        }

        /** Format the return date for purchase date */
        const formattedDate = equipmentInformation.purchaseDate === null ? "--/--/----" : 
            new Date(equipmentInformation.purchaseDate)
                .toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });

        /** Construct response object represent equipment entity */
        const responseObject = {
            modelPhoto: equipmentInformation.modelPhoto,
            typeId: equipmentInformation.typeId,
            typeName: equipmentInformation.typeName,
            modelId: equipmentInformation.modelId,
            modelName: equipmentInformation.modelName,
            serialId: equipmentInformation.serialId,
            maintenanceStatus: equipmentInformation.maintenanceStatus,
            reservationStatus: equipmentInformation.reservationStatus,
            usageCondition: equipmentInformation.usageCondition,
            purchaseCost: equipmentInformation.purchaseCost === null ? "$--.--" : `${equipmentInformation.purchaseCost}`,
            purchaseDate: formattedDate, 
            rfidTag: equipmentInformation.rfidTag === null ? "---" : `${equipmentInformation.rfidTag}`,
            currentRoom: equipmentInformation.currentRoom === null ? "Not found" : `${equipmentInformation.currentRoom}`,
            homeRooms: equipmentHomeRoomList.length === 0 ? [] : equipmentHomeRoomList.map(room => room.roomNumber)
        };

        /** Return response object */
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
 * @param {number} scannerID - ID of the scanner that sent the request.   
 * @returns {object|null|string} - If the type is found, returns an object containing type information;
 *                                 if not found, returns null; if an error occurs, returns an error message string.
 */
async function AddScanToDatabase(db, scanData) {
    try {

        /** Finds latest scan entry of particular equipment to determine if it is entering or exiting antenna's room. */
        const lastScan = await db('scan_history').select(
            'EQUIPMENT_TAG_ID',
            'SCAN_TIME',
            'IS_WALK_IN',
            'FK_LOCATION_ROOM_READER_ID'
        )
        .where('EQUIPMENT_TAG_ID', '=', scanData['EQUIPMENT_TAG_ID'])
        .orderBy('SCAN_TIME', 'desc')
        .limit(1);

        console.log("-------- lastScan ", lastScan);
        
        const requestObject = EquipmentLocationHandler(lastScan, scanData);

        const  responseObject= await db('scan_history').insert(requestObject);
        return responseObject;
    } catch (error) {
        /** Log the error for debugging */
        console.log("ERROR: There is an error while adding scan to the database: ", error);
        /** Return error message string */
        return "An error occured while trying to add the scan."
    }
}

/**
 * Updates the location information of the equipment, including which room it is currently in and whether
 * that room is its home. 
 * @param {object} db - The database connection or query builder.
 * @param {number} scannerID - ID of the scanner that sent the request.   
 * @returns {object|null|string} - If the type is found, returns an object containing type information;
 *                                 if not found, returns null; if an error occurs, returns an error message string.
 */
async function EquipmentLocationHandler(lastScan, scanData) {
    console.log("---- ENTERED EQUIPMENT LOCATION HANDLER");

    requestObject = {
        EQUIPMENT_TAG_ID: scanData.EQUIPMENT_TAG_ID,
        IS_WALK_IN: true,
        FK_LOCATION_ROOM_READER_ID: scanData.FK_LOCATION_ROOM_READER_ID,
        SCAN_TIME: Date.now()
    }

    /** 
     * 
     * Two cases for our scans:
     * 1. Last scan and current scan are of the same room, and last scan was a walk in. This would mean 
     *      the current scan is a walk out.
     * 2. Everything else is a walk in. See below for details. 
     * 
     * Some things to consider:
     * 1. If the last scan was a walk out, the current scan will always be a walk in. 
     * 2. If the current scan is a different room than last room scan which was a walk in, current scan will
     *      be treated as a walk in for the current room. (Our system failed to pick up a walk out somewhere.)
     */
    if (lastScan.FK_LOCATION_ROOM_READER_ID == scanData.FK_LOCATION_ROOM_READER_ID
        && lastScan.IS_WALK_IN) {
        responseObject.IS_WALK_IN = false;
    }

    console.log("----- REQUESTOBJECT ", requestObject);
    return requestObject;
}

/** Exports the functions */
module.exports = {
    GetEquipmentBySerialId: GetEquipmentBySerialId,
    AddScanToDatabase: AddScanToDatabase
}
