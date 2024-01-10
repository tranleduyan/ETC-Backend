/**
 * Retrieves detailed information about a specific equipment model by its model ID.
 *
 * @param {Object} db - Database connection object.
 * @param {string} modelId - ID of the equipment model to retrieve information for.
 * @returns {Object|null|string} - Information about the equipment model or an error message.
 *    - Returns null if the model is not found.
 *    - Returns a string if there's an invalid request or an error during retrieval.
 */
async function GetModelInfoByModelId(db, modelId) {
    try {
        /** Ensure model id is numeric */
        if(typeof modelId === "string" && isNaN(parseInt(modelId, 10))) {
            modelId = modelId.trim();
        }

        /** Retrieve model's information */
        const model = await db.select().from("equipment_model").where("PK_MODEL_ID", "=", modelId).first();

        /** If there is no model, return null, indicate not found */
        if(!model || model.length === 0) {
            return null;
        }

        /** Retrieve type's information of the model */
        const type = await db.select("TYPE_NAME").from("equipment_type").where("PK_TYPE_ID", "=", model.FK_TYPE_ID).first();

        /** Create response object */
        const responseObject = {
            modelId: model.PK_MODEL_ID,
            modelName: model.MODEL_NAME,
            modelPhotoId: model.MODEL_PHOTO_ID,
            modelPhoto: model.MODEL_PHOTO_URL,
            typeName: type.TYPE_NAME
        }

        /** Return the model object */
        return responseObject;
    } catch(error) {
        /** Log and return error */
        console.log("ERROR: There is an error retrieving model's information:", error);
        return "There is an error retrieving model's information."
    }
}

async function GetEquipmentAvailableCount(db, modelId, typeId, startDate, endDate) {
    try{
        const allReadyEquipmentsPromise = db("equipment").select("PK_EQUIPMENT_SERIAL_ID").where({
            FK_TYPE_ID: typeId,
            FK_MODEL_ID: modelId,
            MAINTENANCE_STATUS: "Ready"
        });
        const reservedEquipmentsCountPromise = db("reserved_equipment")
        .leftJoin("reservation", "reserved_equipment.FK_RESERVATION_ID", "=", "reservation.PK_RESERVATION_ID")
        .where("reserved_equipment.FK_EQUIPMENT_TYPE_ID", typeId)
        .andWhere("reserved_equipment.FK_EQUIPMENT_MODEL_ID", modelId)
        .andWhere("reservation.START_DATE", "<=", endDate)
        .andWhere("reservation.END_DATE", ">=", startDate)
        .sum("reserved_equipment.QUANTITY as totalQuantity")
        .first();
        const [allEquipments, reservedEquipmentsCount] = await Promise.all([allReadyEquipmentsPromise, reservedEquipmentsCountPromise]);
        if(allEquipments.length === 0) {
            return 0;
        }
        return allEquipments.length - reservedEquipmentsCount.totalQuantity;
    } catch(error) {
        console.log("ERROR: There is an error while retrieve equipment's availability:", error);
        return "There is an error while retrieve equipment availability."
    }
}

/** Export the modules */
module.exports = {
    GetModelInfoByModelId,
    GetEquipmentAvailableCount
}
