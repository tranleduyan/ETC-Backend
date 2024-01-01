/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const helpers = require("../../../utils/interfaces/IHelperFunctions");
const drive = require("../../../configurations/googleapis/GoogleAPIConfiguration");

/**
 * Deletes equipment models and associated images from the database.
 *
 * @param {Object} res - Express response object.
 * @param {Object} req - Express request object containing modelIds and schoolId.
 * @returns {Object} - Response object indicating success or error.
 */
async function ModelsRemoval(res, req) {
    /** Open the transaction */
    const trx = await db.transaction();

    /** Create an array of deleted images to keep track which image is deleted, so that when we restore/roll back if there is error */
    let deletedImages = [];
    try{
        /** Validate the information */
        const errors = await ModelsRemovalValidation(res, req);
        if(errors) {
            return errors;
        }

        /** Destructure variables from request body */
        const { modelIds } = req;

        /** Retrieve models and its photo id */
        const models = await trx("equipment_model").select("MODEL_PHOTO_ID AS photoId").whereIn("PK_MODEL_ID", modelIds);
        
        /** Create delete image promises */
        const deleteImagePromises = models.map(async (model) => {
            deletedImages.push(model.photoId);
            return helpers.DeleteDriveImage(drive, model.photoId);
        });
      
        /** Concurrently perform all the delete image promises */
        const deleteImageResults = await Promise.all(deleteImagePromises);
    
        /** Check for deletion errors */ 
        const deleteError = deleteImageResults.find((result) => typeof result === "string");

        /** If there is an error, restore deleted images in parallel and return an error response */ 
        if (deleteError) {
            /** Initialized restore image promises */
            const restoreImagePromises = deletedImages.map(async (deletedImage) => {
                await helpers.RestoreDeletedDriveImage(drive, deletedImage);
            });

            /** Perform restore image concurrently */
            await Promise.all([...restoreImagePromises]);
        
            /** Return 503 */
            return responseBuilder.ServerError(res, deleteError);
        }

        /** Delete models from the database based on modelIds */ 
        await trx("equipment_model").del().whereIn("PK_MODEL_ID", modelIds);

        /** Commit the transaction */
        await trx.commit();

        /** Return delete successful */
        return responseBuilder.DeleteSuccessful(res, "Models");
    } catch(error){
        /** Create roll back promises */
        const rollbackPromise = trx.rollback();
        /** Create restore image promises */
        const restoreImagePromises = deletedImages.map(async (deletedImage) => {
            await helpers.RestoreDeletedDriveImage(drive, deletedImage);
          });

        /** Perform database roll back and restore image concurrently */
        await Promise.all([rollbackPromise, ...restoreImagePromises]);

        /** Log error and return 503 */
        console.log("ERROR: There is an error while deleting models: ", error);
        return responseBuilder.ServerError(res, "There is an error while deleting models.")
    }
}

/**
 * Validates an array of equipment model IDs.
 *
 * @param {Array} modelIds - An array of equipment model IDs to be validated.
 * @returns {string|null} - A validation error message if validation fails,
 *                          or null if the validation is successful.
 */
async function ValidateModel(modelIds) {
    /** If the array of model ids is empty, there is nothing to do with it */
    if(modelIds.length === 0) {
        return null;
    }

    /** Retrieve all the model to ensure that all the models are exist */
    const models = await db("equipment_model").select("PK_MODEL_ID").whereIn("PK_MODEL_ID", modelIds);

    /** Ensure that all the models are exist */
    if(models.length !== modelIds.length) {
        return "One of the given model cannot be found."
    }

    /** Return null to indicate modelIds are valid */
    return null;
}

/**
 * Validates the request parameters for deleting equipment models.
 *
 * @param {Object} res - Express response object.
 * @param {Object} req - Express request object containing schoolId.
 * @returns {Object|null} - Null if validation passes, response object if validation fails.
 */
async function ModelsRemovalValidation(res, req) {
    try{
        /** Destructure variables from request body */
        const { schoolId, modelIds } = req;

        /** Ensure required field is filled */
        if(!schoolId || !modelIds) {
            return responseBuilder.MissingContent(res);
        }

        /** Ensure that modelIds is an array */
        if(!Array.isArray(modelIds)) {
            return responseBuilder.BadRequest(res, "Invalid type of model.");
        }

        /** Ensure the correct type is given */
        if(typeof schoolId !== "string") {
            return responseBuilder.BadRequest(res, "Invalid type of request.");
        }

        /** Ensure that the mode is valid */
        const modelError = await Promise.resolve(ValidateModel(modelIds));
        if(modelError) {
            return responseBuilder.BadRequest(res, modelError);
        }

        /** Ensure that the user is exists */
        const user = await dbHelper.GetUserInfoBySchoolId(db, schoolId);
        if(!user) {
            return responseBuilder.NotFound(res, "User");
        }

        /** Ensure that the user is an admin */
        if(user.userRole !== "Admin") {
            return responseBuilder.BadRequest(res, "You are not allowed to perform this action.");
        }
        
        /** Return null indicate pass the validation */
        return null;
    } catch(error) {
        /** Logging error and return 503 */
        console.log("ERROR: There is an error while deleting models: ", error);
        return responseBuilder.ServerError(res, "There is an error while deleting models.");
    }
}

/** Exports the module */
module.exports = {
    ModelsRemoval
}
