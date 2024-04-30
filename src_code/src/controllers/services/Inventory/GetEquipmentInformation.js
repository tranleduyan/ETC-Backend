/** Intitialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");

async function GetEquipmentInformation(res, serialId) {
    try{
        /** Retrieving equipment information */
        const equipmentInformation = await Promise.resolve(dbHelper.GetEquipmentBySerialId(db, serialId.trim()));

        /** If there is no equipment with requested serial id, return 404 */
        if(!equipmentInformation) {
            return responseBuilder.NotFound(res, "Equipment");
        }

        /** Construct response object for return */
        const responseObject = {
            modelPhoto: equipmentInformation.modelPhoto,
            typeName: equipmentInformation.typeName,
            modelName: equipmentInformation.modelName,
            serialId: equipmentInformation.serialId,
            maintenanceStatus: equipmentInformation.maintenanceStatus,
            reservationStatus: equipmentInformation.reservationStatus,
            usageCondition: equipmentInformation.usageCondition,
            purchaseCost: equipmentInformation.purchaseCost,
            purchaseDate: equipmentInformation.purchaseDate,
            rfidTag: equipmentInformation.rfidTag,
            lastSeen: equipmentInformation.lastSeen,
            homeRooms: equipmentInformation.homeRooms,
            usageHistory: equipmentInformation.usageHistory
        }

        /** Return equipment entity with successful message */
        return responseBuilder.GetSuccessful(res, responseObject, "Equipment");
    } catch(error){
        /** Log error and return 503 */
        console.log("ERROR: There is an error while retrieving equipment's information:", error);
        return responseBuilder.ServerError("There is an error while retrieving equipment's information.");
    }
} 

/** Exports the module */
module.exports ={
    GetEquipmentInformation,
}
