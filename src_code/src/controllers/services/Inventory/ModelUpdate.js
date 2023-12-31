/** Import neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const helpers = require("../../../utils/interfaces/IHelperFunctions");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const drive = require("../../../configurations/googleapis/GoogleAPIConfiguration");
const streamifier = require("streamifier");

async function ModelUpdate(res, req, modelId) {
    const trx = await db.transaction();
    try{
        const errors = await Promise.resolve(ModelUpdateValidation(res, req, modelId));
        if(errors) {
            return errors;
        }

        /** Convert model id into numeric values */
        const numericModelId = parseInt(modelId,10);

        /** Destructure variables from request body */
        const { typeId, modelName } = req.body;
        
        /** Retrieve image from request file */
        const image = req.file;

        /** Start retrieving  */
    } catch(error) {

    }
}
/**
 * Validates the uploaded image to ensure it meets specified criteria.
 *
 * @param {object} image - The uploaded image data from the request.
 * @returns {string|null} - If the validation fails, returns an error message; otherwise, returns null.
 */
function ValidateImage(image) {
    /** Defined allowed image file extensions */
    const allowedImageExtensions = ["jpg", "jpeg", "png", "heic", "heif", "hevc"];

    /** Ensure that there is at least 1 image is uploaded */
    if(!image || image.length === 0) {
        return "Image field is required."
    }

    /** Get image extension */
    const imageExtension = image.originalname.split(".").pop().toLowerCase();

    /** If the file extension is invalid return error message */
    if(!allowedImageExtensions.includes(imageExtension)) {
        return "Invalid file extension. Only image-type files are allowed."
    }

    /** Return null to indicate uploaded image is valid */
    return null;
}

/**
 * Validates the type information before adding models to the database.
 *
 * @param {string} typeId - The type ID obtained from the request body.
 * @returns {string|null} - If the validation fails, returns an error message; otherwise, returns null.
 */
async function ValidateType(typeId, modelName, modelId) {
    try {
        /** Ensure that type_id is a valid number */
        if(typeof typeId === "string" && isNaN(parseInt(typeId, 10))) {
            return "Invalid type selected."
        }

        /** Retrieve type to see if type_id is an id of an exist type */
        const type = await Promise.resolve(dbHelper.GetTypeInfoByTypeId(db, typeId));
        if(!type) {
            return "Type not found."
        }

        /** Ensure modelName is a string type */
        if(typeof modelName !== "string") {
            return "Invalid model name type."
        }

        /** Ensure requestModel with modelId exist */
        const requestModel = await db("equipment_model").select("PK_MODEL_ID AS modelId").where("PK_MODEL_ID", "=", modelId).first();
        if(!requestModel) {
            return "Model not found.";
        }

        /** Ensure requestModel's name is not exist in the type yet. */
        const existModelName = await db("equipment_model").select("PK_MODEL_ID AS modelId").where("MODEL_NAME", "LIKE", modelName.trim()).where("FK_TYPE_ID","=", typeId).first();
        if(existModelName) {
            if(existModelName.modelId !== modelId){
                return "This model already exists in this type."
            }
        }

        /** Return null to indicate typeId is valid */
        return null;
    } catch(error) {
        /** Log error and return 503 */
        return "There is an error with the given type.";
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

async function ModelUpdateValidation(res, req, modelId) {
    try {
        /** Destructure variables from the request body */
        const { modelName, modelPhotoId, typeId, schoolId } = req.body;

        /** Ensure all required fields is filled */
        if(!modelName || !typeId || !schoolId) {
            return responseBuilder.MissingContent(res);
        }

        /** Ensure the model id must be a number */
        if(isNaN(parseInt(modelId.trim()))) {
            return responseBuilder.BadRequest(res, "Invalid request.");
        }

        /** Retrieve uploaded files from the form data */
        const image = req.file; 

        /** Ensure that school id is valid, and only admin can perform this action */
        const userError = await Promise.resolve(ValidateUser(schoolId));
        if(userError) {
            return responseBuilder.BadRequest(res, userError);
        }
        
        /** Ensure that there is no item's type error  */
        const typeError = await Promise.resolve(ValidateType(typeId, modelName, parseInt(modelId.trim())));
        if(typeError) {
            return responseBuilder.BadRequest(res, typeError);
        }

        /** Ensure that the uploaded file is an image type */
        const imageError = ValidateImage(image);
        if(imageError) {
            return responseBuilder.BadRequest(res, imageError);
        }
    } catch(error) {

    }
}