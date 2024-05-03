const dbHelperUser = require("../user/UserDBHelperFunctions");

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
            )
            .from("equipment_model")
            .leftJoin("equipment_type", "equipment_type.PK_TYPE_ID", "=", "equipment_model.FK_TYPE_ID")
            .leftJoin("equipment", "equipment.FK_MODEL_ID", "=", "equipment_model.PK_MODEL_ID")
            .where("equipment.PK_EQUIPMENT_SERIAL_ID", "=", serialId.trim())
            .first();
        
        /** Create promise to get home room list of the equipment */
        const getEquipmentHomeRoomListPromise = db
            .select("location.LOCATION_NAME AS locationName")
            .from("equipment_home")
            .leftJoin("location", "location.PK_LOCATION_ID", "=", "equipment_home.FK_LOCATION_ID")
            .where("equipment_home.FK_EQUIPMENT_SERIAL_ID", "=", serialId.trim())
            .orderBy("locationName", "ASC");

        /** Concurrently perform retrieving equipment information and equipment home room list */
        const [equipmentInformation, equipmentHomeRoomList] = await Promise.all([getEquipmentInformationPromise, getEquipmentHomeRoomListPromise]);

        /** If equipment information is not exist, return null */
        if(!equipmentInformation) {
            return null;
        }

        const equipmentLastSeenHistory = await db
            .select(
                "location.LOCATION_NAME AS locationName", 
                "scan_history.SCAN_TIME AS scanTime", 
                "scan_history.FK_SCHOOL_TAG_ID AS studentTagId",
                "scan_history.PK_SCAN_HISTORY_ID AS scanHistoryId",
                db.raw("CONCAT(user_info.LAST_NAME, ', ', user_info.FIRST_NAME) AS fullName")
            )
            .from("scan_history")
            .leftJoin("reader_location", "reader_location.PK_READER_TAG_ID", "=", "scan_history.FK_LOCATION_ROOM_READER_ID")
            .leftJoin("location", "location.PK_LOCATION_ID", "=", "reader_location.FK_LOCATION_ID")
            .leftJoin("user_info", "user_info.TAG_ID", "=", "scan_history.FK_SCHOOL_TAG_ID")
            .where("scan_history.FK_EQUIPMENT_TAG_ID", "=", equipmentInformation.rfidTag)
            .orderBy("scan_history.SCAN_TIME", "DESC");

        const equipmentLastSeen = equipmentLastSeenHistory?.length === 0 ? null : equipmentLastSeenHistory[0].locationName;

        const equipmentUsageHistoryList = equipmentLastSeenHistory.filter(history => history.studentTagId !== null);

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
            lastSeen: equipmentLastSeen === null ? "Not found" : equipmentLastSeen,
            homeRooms: equipmentHomeRoomList.length === 0 ? [] : equipmentHomeRoomList.map(room => room.roomNumber),
            usageHistory: equipmentUsageHistoryList.length === 0 ? [] : equipmentUsageHistoryList
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

        /** 
         * assignedPackage is a map with the key represnting the student who is responsible for the scans, and
         * the values being an array of item IDs. If there is no studentID in the unsorted package, key will be
         * "EMPTY"
        */
        console.log("----- Entered AddScanToDatabase");
        console.log("scanData: ", scanData);

        const assignedPackage = await Promise.resolve(AssignPackage(db, scanData));
        const iterator = assignedPackage.keys();

        const studentId = iterator.next().value;
        const items = assignedPackage.get(studentId);
        console.log("STUDENT ID --------", studentId);

        let responseObject = [];

        console.log("---- Entering Tag Gauntlet");
        /** Add each item tag ID to database with student Id */
        for (i = 0; i < items.length; ++i) {
            console.log("item: ",i, items[i]);
             /** Finds latest scan entry of particular equipment to determine if it is entering or exiting antenna's room. */
            const lastScan = await db('scan_history').select(
                'FK_EQUIPMENT_TAG_ID',
                'SCAN_TIME',
                'IS_WALK_IN',
                'FK_LOCATION_ROOM_READER_ID'
            )
            .where('FK_EQUIPMENT_TAG_ID', '=', items[i])
            .orderBy('SCAN_TIME', 'desc')
            .limit(1);

            console.log("-------- lastScan ", lastScan);

            const isWalkIn = EquipmentLocationHandler(lastScan, scanData);

            console.log("---- LOCATION HANDLER ", isWalkIn);

            console.log("------- SENDING REQUEST");

            //** If no student ID is in the package, do not call with student ID */
            if (studentId == "EMPTY") {
                responseObject.push(await db('scan_history').insert(
                    {
                        FK_EQUIPMENT_TAG_ID : items[i],
                        IS_WALK_IN : isWalkIn,
                        FK_LOCATION_ROOM_READER_ID : scanData.FK_LOCATION_ROOM_READER_ID
                    }));
            }

            else {
                responseObject.push(await db('scan_history').insert(
                    {
                        FK_EQUIPMENT_TAG_ID : items[i],
                        IS_WALK_IN : isWalkIn,
                        FK_LOCATION_ROOM_READER_ID : scanData.FK_LOCATION_ROOM_READER_ID,
                        FK_SCHOOL_TAG_ID : studentId
                    }));

                    //** Update status info of item with student in reserved_equipment table */  
                responseObject.push(await db('equipment')
                
                .where('TAG_ID', '=', items[i])
                .update(
                    {
                        FK_EQUIPMENT_TAG_ID : items[i],
                        RESERVATION_STATUS : "In Use"
                    }
                ));

            }

        }


        // const  responseObject= await db('scan_history').insert(requestObject);
        return responseObject;
    } catch (error) {
        /** Log the error for debugging */
        console.log("ERROR: There is an error while adding scan to the database: ", error);
        /** Return error message string */
        return "An error occured while trying to add the scan."
    }
}

/**
 * Searches through list of sent IDs to identify a student ID. Assigns all items in package
 * to first student ID identified as Map<String, String[]]>
 * If no student ID is found, the key is set to value "EMPTY".
 * @param {object} db - The database connection or query builder.
 * @param {number} scanData - ID of the scanner that sent the request.   
 * @returns {object|null|string} - If the type is found, returns an object containing type information;
 *                                 if not found, returns null; if an error occurs, returns an error message string.
 */
async function AssignPackage(db, scanData) {
    console.log("----- Entered AssignPackage");
    console.log("scanData: ", scanData);
    const scanList = scanData.SCANS; 

    let package = new Map();
    let wrappedKey = "EMPTY";
    let wrappedValues = [];

    console.log("Starting value loop");
    for (let i = 0; i < scanList.length; ++i) {
        const currentTagId = scanList[i];

        /** If current tag is not a student, add to wrapped values */
        if(!(await dbHelperUser.CheckUserExistsByTag(db, currentTagId))) {
            wrappedValues.push(currentTagId);
        }
        /** If current TAG_ID belongs to a student, current Id is set to the key*/
        else {
            wrappedKey = currentTagId; 
        }
    }

    package.set(wrappedKey, wrappedValues);
    console.log("--- Loop Exited: ", package);
    return package; 
}



/**
 * Updates the location information of the equipment, including which room it is currently in and whether
 * that room is its home. 
 * @param {object} db - The database connection or query builder.
 * @param {number} scannerID - ID of the scanner that sent the request.   
 * @returns {object|null|string} - If the type is found, returns an object containing type information;
 *                                 if not found, returns null; if an error occurs, returns an error message string.
 */
function EquipmentLocationHandler(lastScan, scanData) {
    console.log("---- ENTERED EQUIPMENT LOCATION HANDLER");
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
        return false;
    }
    return true;
}

/** Exports the functions */
module.exports = {
    GetEquipmentBySerialId: GetEquipmentBySerialId,
    AddScanToDatabase: AddScanToDatabase
}
