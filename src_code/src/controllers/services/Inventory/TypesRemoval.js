/** Import neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const helpers = require("../../../utils/interfaces/IHelperFunctions");
const drive = require("../../../configurations/googleapis/GoogleAPIConfiguration");

/**
 * TypesRemoval - Handles the removal of equipment types, including associated images.
 *
 * @param {Object} res - Express response object.
 * @param {Object} req - Express request object containing the type IDs to be removed.
 * @returns {Object} - The response object representing the outcome of the operation.
 *                    Possible responses include 200 OK for successful deletion,
 *                    400 Bad Request for validation errors, and 503 Server Error for other errors.
 * 
 * Expected Request Body:
 *  {
 *      "schoolId": "810922119",
 *      "typeIds": [
 *          51, 52
 *      ]
 *  }
 * 
 */
async function TypesRemoval(res, req) {
    /** Open the transaction */
    const trx = await db.transaction();
    
    /** Initialize modelPhotoIds to keep track of what model photo id is removing */
    let modelPhotoIds = [];
    try {
        /** Validate information before processing removing type */
        const errors = await Promise.resolve(TypesRemovalValidation(res, req));
        if(errors) {
            return errors;
        }

        /** Destructure variables from request body */
        const { typeIds } = req;
        
        /** If type ids is nothing, then nothing to do with it */
        if(typeIds.length === 0) {
            return responseBuilder.DeleteSuccessful(res, "Type");
        }

        /** Retrieve all the models with their photo id of the requested type */
        const models = await trx("equipment_model").select("MODEL_PHOTO_ID").whereIn("FK_TYPE_ID", typeIds);

        /** Ensure that if there is at least 1 model, we perform delete image from their model first, and delete type, if not, we only need to delete type */
        if(models?.length > 0) {
            /** Extract the object retrieving model photo ids */
            modelPhotoIds = models.map(model => model.MODEL_PHOTO_ID);

            /** Create delete image promise */
            const deleteImagePromise = helpers.DeleteDriveImages(drive, modelPhotoIds);

            /** Create delete type promise, when we delete type, all the associate row with that type will automatically deleted by db */
            const deleteTypePromise = trx("equipment_type").whereIn("PK_TYPE_ID", typeIds).del();

            /** Perform deleting image promise and type promise concurrently */
            const [deleteImageError] = await Promise.all([deleteImagePromise, deleteTypePromise]);

            /** If there is error while deleting image, roll back and restore images */
            if(deleteImageError) {
                /** Create roll back promise */
                const rollbackPromise = trx.rollback();

                /** Create restore promise */
                const restoreImagePromises = modelPhotoIds.map(async (modelPhotoId) => {
                    await Promise.resolve(helpers.RestoreDeletedDriveImage(drive, modelPhotoId));
                });

                /** Perform promises concurrently */
                await Promise.all([rollbackPromise, ...restoreImagePromises]);

                /** Log error and return 503 */
                console.log("ERROR: There is an error while deleting model's images", deleteImageError);
                return responseBuilder.ServerError(res, "There is an error while deleting types.");
            }
        } else {
            /** If the type has no models, we just need to delete type */
            await trx("equipment_type").whereIn("PK_TYPE_ID", typeIds).del();
        }

        /** Commit the transaction */
        await trx.commit();

        /** Return delete successful */
        return responseBuilder.DeleteSuccessful(res);
    } catch(error) {
        /** If we have deleted at least 1 model photo, we have to restore it, and roll back transaction when there is an error */
        if(modelPhotoIds.length > 0){
            /** Create roll back promises */
            const rollbackPromise = trx.rollback();
            
            /** Create restore image promises */
            const restoreImagePromises = modelPhotoIds.map(async (modelPhotoId) => {
                await Promise.resolve(helpers.RestoreDeletedDriveImage(drive, modelPhotoId));
            });
    
            /** Concurrently perform all the promises */
            await Promise.all([rollbackPromise, ...restoreImagePromises]);
        } else {
            /** If there is no model photo, then roll back transaction only */
            await trx.rollback();
        }

        /** Log error and return 503 */
        console.log("ERROR: There is an error while deleting model's images", error);
        return responseBuilder.ServerError(res, "There is an error while deleting types.");
    }
}

/**
 * Validates a user based on the provided school ID, checking for validity and admin privileges.
 *
 * @param {string} schoolId - The school ID associated with the user.
 * @returns {string|null} - A validation message or null if the user is valid.
 *    - Returns a string if there's an invalid request, error in retrieving user information,
 *      user not found, or insufficient permissions.
 *    - Returns null to indicate that the user is valid.
 */
async function ValidateUser(schoolId) {
    /** Ensure that schoolId should always be string */
    if(typeof schoolId !== "string") {
        return "Invalid type of school id.";
    }

    /** Ensure school id is valid numeric */
    if(isNaN(parseInt(schoolId, 10))) {
        return "Invalid school id.";
    }

    /** Retrieve user information */
    const user = await Promise.resolve(dbHelper.GetUserInfoBySchoolId(db, schoolId));

    /** If there is error while retrieve user information, return error */
    if(typeof user === "string") {
        return user;
    }

    /** If user is not exist, return not found message */
    if(!user) {
        return "User not found.";
    }

    /** Ensure user is an admin */
    if(user.userRole !== "Admin"){
        return "You don't have permission to perform this action.";
    }

    /** Return null to indicate user is valid */
    return null;
}

/**
 * Validates an array of equipment type IDs.
 *
 * @param {Array} typeIds - An array of equipment type IDs to be validated.
 * @returns {string|null} - A validation error message if validation fails,
 *                          or null if the validation is successful.
 */
async function ValidateTypes(typeIds) {
    /** If the array of type IDs is empty, there is nothing to do with it */
    if(typeIds.length === 0) {
        return null;
    }

    /** Retrieve all the type to ensure that all the types is exists */
    const types = await db("equipment_type").select("PK_TYPE_ID").whereIn("PK_TYPE_ID", typeIds);

    /** Ensure that all the types is exists */
    if(types.length !== typeIds.length) {
        return "One of the given type cannot be found."
    }

    /** Return null to indicate typeIds are valid */
    return null;
}

/**
 * Validates the request parameters for equipment types removal.
 *
 * @param {Object} res - Express response object.
 * @param {Object} req - Express request object containing type IDs and school ID.
 * @returns {Object|null} - A response object representing validation errors if validation fails,
 *                         or null if the validation is successful.
 */
async function TypesRemovalValidation(res, req) {
    try {
        /** Destructure the variables from request body */
        const { typeIds, schoolId } = req;

        /** Ensure the required fields is filled */
        if(!typeIds || !schoolId) {
            return responseBuilder.MissingContent(res);
        }

        /** Ensure that typeIds is an array type */
        if(!Array.isArray(typeIds)) {
            return responseBuilder.BadRequest("Invalid request.");
        }

        /** Ensure the user is valid */
        const userError = await Promise.resolve(ValidateUser(schoolId));
        if(userError) {
            return responseBuilder.BadRequest(res, userError);
        }

        /** Ensure the type is valid */
        const typeError = await Promise.resolve(ValidateTypes(typeIds));
        if(typeError) {
            return responseBuilder.BadRequest(res, typeError);
        }

        /** Return null to indicate pass validation */
        return null;
    } catch(error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error occur while validating types removal:", error);
        return responseBuilder.ServerError(res, "There is an error occur while removing types.");
    }
}

/** Exports the module */
module.exports = {
    TypesRemoval,
}
