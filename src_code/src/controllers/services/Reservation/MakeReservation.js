/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");
const db = require("../../../configurations/database/DatabaseConfigurations");

/**
 * Synchronously processes the request to make a reservation, handling transaction, validation, and insertion.
 * @param {Object} res - The response object.
 * @param {Object} req - The request object containing reservation information.
 * @returns {Object} - Response object indicating the success or failure of the reservation creation.
 * Request Body: 
 * {
 *      "startDate": datetime,
 *      "endDate": datetime,
 *      "schoolId": int,
 *      "reservedEquipments": 
 *      [
 *          {
 *              "modelId": int,
 *              "typeId": int,
 *              "quantity": int,
 *          }
 *      ]
 *  }
 */
async function MakeReservation(res, req) {
    /** Start transaction */
    const trx = await db.transaction();

    try{
        /** Validate the requested information */
        const errors = await Promise.resolve(MakeReservationValidation(res, req));
        if(errors) {
            return errors;
        }

        /** Destructure variables from the request body */
        const { startDate, endDate, schoolId, reservedEquipments } = req;
        let reservationStatus = "Requested";

        /** Retrieve user information */
        const user = await Promise.resolve(dbHelpers.GetUserInfoBySchoolId(db, schoolId));
        if(user.userRole === "Faculty") {
            reservationStatus = "Approved";
        }

        /** Prepare data to insert */
        const reservationData = {
            FK_SCHOOL_ID: schoolId.trim(),
            START_DATE: startDate,
            END_DATE: endDate,
            STATUS: reservationStatus
        }

        /** Perform insert and retrieve id */
        const [reservationId] = await trx("reservation").insert(reservationData);

        /** Create promise to reserve equipment */
        const reservedEquipmentInsertPromise = reservedEquipments.map(async (equipment) => {
            await trx("reserved_equipment").insert({
                FK_RESERVATION_ID: reservationId,
                FK_EQUIPMENT_TYPE_ID: equipment.typeId,
                FK_EQUIPMENT_MODEL_ID: equipment.modelId,
                QUANTITY: equipment.quantity
            });
          });
        
        /** Concurrently perform the promise */
        await Promise.all(reservedEquipmentInsertPromise);

        /** Commit the transaction */
        await trx.commit();

        /** Return create successful message */
        return responseBuilder.CreateSuccessful(res, null, `Reservation#: ${reservationId}`);
    } catch(error) {
        /** Roll back transaction */
        await trx.rollback();
        /** Log error and return 503 */
        console.log("ERROR: There is an error while creating reservation:", error);
        return responseBuilder.ServerError(res, "There is an error while creating your reservation.");
    }
}

/**
 * Validates the start and end dates for a reservation.
 * @param {string} startDate - The start date of the reservation.
 * @param {string} endDate - The end date of the reservation.
 * @returns {string|null} - Error message if validation fails, otherwise null.
 */
async function ReservationDateValidation(startDate, endDate, schoolId) {
    /** Initialize start date and end date time for validation */
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    const today = new Date(0);

    /** Ensure startDate and endDate are valid date forms */
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        return "Start date or end date is invalid.";
    }

    /** Ensure startDate is not before today */
    if (startDateTime < today) {
        return "You cannot reserve a start date before today's date.";
    }

    /** Ensure startDate is always before endDate */
    if (startDateTime > endDateTime) {
        return "You cannot reserve an item after the return date.";
    }
    
    /** Get User role */
    const user = await Promise.resolve(dbHelpers.GetUserInfoBySchoolId(db, schoolId));
    if(user.userRole !== "Faculty"){
        /** Ensure that student only can reserve 2 equipment at max */
        try{
            /** Retrieve total quantity of equipment that student reserve */
            const totalQuantityOfEquipmentStudentReserve = await db("reserved_equipment").select(db.raw('SUM(QUANTITY) AS totalQuantity'))
            .whereIn("FK_RESERVATION_ID", function() {
                this.select("PK_RESERVATION_ID")
                    .from("reservation")
                    .where("START_DATE", "<=", startDate)
                    .andWhere("END_DATE", ">=", endDate)
                    .andWhere("FK_SCHOOL_ID", "=", schoolId.trim());
            }).first();

            /** If total quantity of equipment that student reserve is more than 2, block them from reserve more equipment. */
            if(totalQuantityOfEquipmentStudentReserve?.totalQuantity >= 2) {
                return "You have already reserved for 2 equipments in this time period."
            }
        } catch(error) {
            /** Log error, and return error */
            console.log("ERROR: There is an error while retrieve total quantity of equipment student reserve:", error);
            return "There is an error while processing your information.";
        }
    }

    /** Return null to indicate date information is valid */
    return null;
}

/**
 * Validates the user information based on the school ID.
 * @param {string} schoolId - The school ID to be validated.
 * @returns {string|null} - Error message if validation fails, otherwise null.
 */
async function UserValidation(schoolId) {
    try {
        if(typeof schoolId !== "string" || isNaN(parseInt(schoolId, 10))) {
            return "Invalid school id.";
        }

        /** Ensure user exists */
        const user = await Promise.resolve(dbHelpers.GetUserInfoBySchoolId(db, schoolId));
        if(!user) {
            return "User not found.";
        }

        /** If there is error while retrieving user information, return error */
        if(typeof user === "string") {
            return user;
        }

        /** Return null to indicate user information is valid */
        return null;
    } catch(error) {
        /** Log error and return error */
        console.log("ERROR: There is an error while validating user information for creating reservation:", error);
        return "There is an error while creating your reservation."
    }
}

/**
 * Validates the information of a single equipment item for reservation.
 * @param {Object} equipment - The equipment object to be validated.
 * @param {Date} startDate - The start date of the reservation.
 * @param {Date} endDate - The end date of the reservation.
 * @returns {string|null} - Error message if validation fails, otherwise null.
 */
async function EquipmentValidation(equipment, startDate, endDate) {
    try {
        /** Ensure all information of equipment is provided */
        if (equipment.typeId === undefined || equipment.modelId === undefined || equipment.quantity === undefined || equipment.quantity === null) {
            return "One of the equipment's information is missing.";
        } 

        /** Ensure all of the requested typeId, modelId, and quantity is valid type */
        if(typeof equipment.typeId !== "number" || typeof equipment.modelId !== "number" || typeof equipment.quantity !== "number") {
            return "Invalid type of an equipment."
        }

        /** Ensure equipment quantity will be always larger than 0 */
        if(equipment.quantity === 0) {
            return "You cannot reserve an equipment with 0 quantity."
        }
        
        /** Ensure that type and model is exist */
        const typePromise = dbHelpers.GetTypeInfoByTypeId(db, equipment.typeId);
        const modelPromise = dbHelpers.GetModelInfoByModelId(db, equipment.modelId);

        /** Retrieve available count of the equipment */
        const availableCountPromise = dbHelpers.GetEquipmentAvailableCount(db, equipment.modelId, equipment.typeId, startDate, endDate);
        
        /** Perform the promise concurrently */
        const [type, model, availableCount] = await Promise.all([typePromise, modelPromise, availableCountPromise])

        /** If type is not exist, return not found. */
        if(!type) {
            return "Type not found.";
        }
        
        /** If model is not exist, return not found. */
        if(!model) {
            return "Model not found.";
        }

        /** Extract model ids from type's models */
        const modelIds = type.models.map(model => model.modelId);

        /** If modelIds doesn't have equipment.modelId, then return "The type doesn't have this model" */
        if (!modelIds.includes(equipment.modelId)) {
            return "The type doesn't have this model.";
        }

        /** Get available number of equipment, if it is error then return error */
        if(typeof availableCount === "string") {
            return availableCount;
        }

        /** If quantity is greater than the sum */
        if(equipment.quantity > availableCount) {
            return `The quantity you choose for ${model.modelName} is larger than the available quantity. Please make adjustment.`
        }

        /** Return null indicate equipment validation is passed */
        return null;
    } catch(error) {
        /** Log and return error */
        console.log(`ERROR: There is an error while validating equipment with the information '${equipment.name}' for creating reservation:`, error);
        return "There is an error occur while creating your reservation.";
    }
}

/**
 * Validates the information of a single equipment item for reservation.
 * @param {Object} equipment - The equipment object to be validated.
 * @param {Date} startDate - The start date of the reservation.
 * @param {Date} endDate - The end date of the reservation.
 * @returns {string|null} - Error message if validation fails, otherwise null.
 */
async function ReservedEquipmentsValidation(reservedEquipments, startDate, endDate, schoolId) {
    try{
        /** Ensure at least 1 equipment is selected for reservation. */
        if(reservedEquipments.length === 0) {
            return "You have not choose any equipment for reservation yet."
        }

        /** Create promise to validate equipment at once */
        const reservedEquipmentValidatePromise = reservedEquipments.map(async (equipment) => {
            const equipmentError = await Promise.resolve(EquipmentValidation(equipment, startDate, endDate));
            if(equipmentError) {
                return equipmentError;
            }
          });

        /** Retrieve user information */
        const getUserInfoPromise = Promise.resolve(dbHelpers.GetUserInfoBySchoolId(db, schoolId));

        const [equipmentErrors, user] = await Promise.all([
            /** Perform all equipment validations concurrently */
            Promise.all(reservedEquipmentValidatePromise), 
            /** Retrieve user information concurrently */
            getUserInfoPromise
        ]);
        /** If there is at least 1 equipmentError, then return it */
        const hasEquipmentErrors = equipmentErrors.some(error => error);
        if (hasEquipmentErrors) {
            return equipmentErrors.find(error => error);
        }
        
        /** Ensure student user can only reserve maximum 2 equipments */
        if(user.userRole !== "Faculty") {
            const totalEquipmentReservedObject =  await db("reserved_equipment").select(db.raw('SUM(QUANTITY) AS totalQuantity'))
                .whereIn("FK_RESERVATION_ID", function() {
                    this.select("PK_RESERVATION_ID")
                        .from("reservation")
                        .where("START_DATE", "<=", startDate)
                        .andWhere("END_DATE", ">=", endDate)
                        .andWhere("FK_SCHOOL_ID", "=", schoolId.trim());
                }).first();
            let totalEquipmentReserved = 0; 
            if(totalEquipmentReservedObject) {
                totalEquipmentReserved = totalEquipmentReservedObject.totalQuantity;
            }

            for(const equipment of reservedEquipments) {
                totalEquipmentReserved += equipment.quantity;
                if(totalEquipmentReserved > 2) {
                    return "You can only reserved maximum 2 equipments. You might have reserved another equipment around this period.";
                }
            }
        }

        /** Return null indicate there is no error */
        return null;
    } catch(error) {
        /** Log and return error */
        console.log("ERROR: There is an error while validate reserved equipments for creating reservation:", error);
        return "There is an error while creating your reservation.";
    }
}

/**
 * Validates the request data for making a reservation.
 * @param {Object} res - The response object.
 * @param {Object} req - The request object containing reservation information.
 * @returns {null|Object} - Null if the information is valid, otherwise an error message.
 */
async function MakeReservationValidation(res, req) {
    try{
        /** Destructure variables from request body */
        const { startDate, endDate, schoolId, reservedEquipments } = req;

        /** Ensure all required fields is given */
        if(!startDate || !endDate || !schoolId || !reservedEquipments) {
            return responseBuilder.MissingContent(res);
        }
        
        /** Validate schoolId (Ensure user is exist) */
        const userError = await Promise.resolve(UserValidation(schoolId));
        if(userError) {
            return responseBuilder.BadRequest(res, userError);
        }

        /** Validate Reservation Date (Start Date must be always smaller than End Date) */
        const reservationDateError = await Promise.resolve(ReservationDateValidation(startDate, endDate, schoolId));
        if(reservationDateError) {
            return responseBuilder.BadRequest(res, reservationDateError);
        }

        /** Validate reservedEquipment is an array */
        if(!Array.isArray(reservedEquipments)) {
            return responseBuilder.BadRequest(res, "Reserved equipment has a invalid type.");
        }

        /** Validate if equipment is valid (ensure equipment exists and requested quantity is not exceed the available quantity) */
        const reservedEquipmentError = await Promise.resolve(ReservedEquipmentsValidation(reservedEquipments, startDate, endDate, schoolId));
        if(reservedEquipmentError) {
            return responseBuilder.BadRequest(res, reservedEquipmentError);
        }

        /** Return null to indicate information is valid */
        return null;
    } catch(error) {
        /** Log and return error */
        console.log("ERROR: There is an error while validating your information to create a reservation:", error);
        return responseBuilder.ServerError(res, "There is an error while creating your reservation.");
    }
}

module.exports = {
    MakeReservation
}
