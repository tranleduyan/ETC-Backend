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
                "room.ROOM_NUMBER AS currentRoom"
            )
            .from("equipment_model")
            .leftJoin("equipment_type", "equipment_type.PK_TYPE_ID", "=", "equipment_model.FK_TYPE_ID")
            .leftJoin("equipment", "equipment.FK_MODEL_ID", "=", "equipment_model.PK_MODEL_ID")
            .leftJoin("room", "equipment.FK_CURRENT_ROOM_READER_ID", "=", "room.PK_READER_TAG_ID")
            .where("equipment.PK_EQUIPMENT_SERIAL_ID", "=", serialId.trim())
            .first();
        
        /** Create promise to get home room list of the equipment */
        const getEquipmentHomeRoomListPromise = db 
            .select(
                "room.ROOM_NUMBER AS roomNumber"
            ) 
            .from("equipment_home")
            .leftJoin("room", "room.PK_READER_TAG_ID", "=", "equipment_home.FK_ROOM_READER_TAG_ID")
            .where("equipment_home.FK_EQUIPMENT_SERIAL_ID", "=", serialId.trim())
            .orderBy("roomNumber", "asc");

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
 * @param {number} scanTime - The time that the scan was logged. 
 * @returns {object|null|string} - If the type is found, returns an object containing type information;
 *                                 if not found, returns null; if an error occurs, returns an error message string.
 */
async function AddScanToDatabase(db, scanData) {

}

/** Exports the functions */
module.exports = {
    GetEquipmentBySerialId: GetEquipmentBySerialId,
    AddScanToDatabase: AddScanToDatabase
}
