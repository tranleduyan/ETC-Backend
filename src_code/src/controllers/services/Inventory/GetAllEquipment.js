/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");

/**
 * Retrieve all equipment information.
 *
 * @param {Object} res - Express response object.
 * @returns {Object} - Response indicating success or failure with equipment information.
 */
async function GetAllEquipment(res) {
    try{
        /** Retrieve equipment list */
        const equipmentList = await db
            .select(
                "equipment_type.TYPE_NAME AS typeName",
                "equipment_model.MODEL_NAME AS modelName",
                "equipment_model.MODEL_PHOTO_URL AS modelPhoto",
                "equipment.PK_EQUIPMENT_SERIAL_ID AS serialId",
                "equipment.MAINTENANCE_STATUS AS maintenanceStatus"
            )
            .from("equipment_model")
            .leftJoin("equipment_type", "equipment_type.PK_TYPE_ID", "=", "equipment_model.FK_TYPE_ID")
            .leftJoin("equipment", "equipment.FK_MODEL_ID", "=", "equipment_model.PK_MODEL_ID")
            .orderBy("typeName")
            .orderBy("modelName")
            .orderBy("serialId");

        /** If there is no equipment, return message */
        if (!equipmentList || equipmentList.length === 0) {
            return responseBuilder.BadRequest(res, "There are no equipments in the inventory.");
        }

        /** If there is equipment, construct response object */
        const responseObject = equipmentList.map(equipment => ({
            typeName: equipment.typeName,
            modelPhoto: equipment.modelPhoto,
            serialId: equipment.serialId,
            maintenanceStatus: equipment.maintenanceStatus
        }));

        /** Return successfully retrieving message */
        return responseBuilder.GetSuccessful(res, responseObject, "Equipment list");
    } catch(error) {
        /** If error, log and return 503 */
        console.log("ERROR: There is an error while retrieving all equipment:", error);
        return responseBuilder.ServerError(res, "There is an error while retrieving all equipment.");
    }
}

/** Exports the module */
module.exports = {
    GetAllEquipment
}
