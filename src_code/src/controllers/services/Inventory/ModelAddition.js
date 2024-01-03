/** Import neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const helpers = require("../../../utils/interfaces/IHelperFunctions");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const drive = require("../../../configurations/googleapis/GoogleAPIConfiguration");
const streamifier = require("streamifier");


/**
 * Handle inventory Model Addition by adminstrator.
 *
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object} - This response object indicates the result of the model addition attempt.
 * 
 * Expected Form Data: 
 * req.file (Maximum 1 file ends with .jpg, .png, .heic, .hevc, .heif)
 * req.body: 
 * {
 *      "modelName": string,
 *      "typeId": int
 * }
 * 
 * Response is the message with status code 200 if successfully
 * Else return a server error of status code 503 (see ResponsiveBuilder.js) - the error are trying to input invalid format to database or any thing else that cannot be seen forward
 */
async function ModelAddition(res, req) {
    /** Initialize imageInfo object in order to get uploaded image's information to delete if upload to storage successfully and failed to insert to database */
    let imageInfo = null;

    try{
        /** Validate before communicate with database */
        const error = await Promise.resolve(ModelAdditionValidation(res, req));
        if(error) {
            return error;
        }

        /** If the information is valid, start upload image to storage (has not resize image yet) then insert information into database */

        /** Retrieve image data */
        const image = req.file;
        
        /** Create a read stream for image data */
        const fileStream = streamifier.createReadStream(image.buffer);

        /** Upload image to storage */
        let driveResponse; 

        /** Try uploading the image */
        try{
            driveResponse = await drive.files.create({
                requestBody: {
                    /** Name of the file when we upload to storage (currently taking whatever the user's image name) */
                    name: image.originalname,
                    /** Set the MIME type of the image */
                    mimeType: image.mimeType,
                    /** Set the parent folder ID on Google Drive (Folder ETC) */
                    parents: ["1gWj1KW31VfEfdqWONQXXg_9qDX4ndUNx"],
                },
                media: {
                    /** Set the MIME type again for the media body */
                    mimeType: image.mimeType,
                    /** Attach the image data as the media body */
                    body: fileStream,
                }
            });
        } catch(uploadImageError) {
            /** Log and return 503 */
            console.log("ERROR: There is an error occur while uploading image: ", uploadImageError);
            return responseBuilder.ServerError(res, "There is an error occur while processing your image.");
        }

        /** Retrieve the file ID from the storage's response */
        const imageId = driveResponse.data.id;

        /** Generate a public URL for the uploaded image using a helper function */
        const imageUrl = await helpers.GenerateDriveImagePublicUrl(drive, imageId);

        /** If failed to generate drive image, roll back all transaction */
        if(!imageUrl) {
            /** If failed to upload, clear the image if it is uploaded successfully */
            await helpers.DeleteDriveImage(drive, imageId);
            /** Return 503 */
            return responseBuilder.ServerError(res, "There is an error occur while retrieving image information.");
        }

        /** Store information about the uploaded image (file ID and public URL) */
        imageInfo = {
            imageId: imageId,
            imageUrl: imageUrl,
        }    
        /** After upload image file successfully, procceed to communicate with database */
        const { modelName, typeId } = req.body;

        /** Prepare model's information/data for insert into model table */
        const modelData = {
            FK_TYPE_ID: parseInt(typeId, 10),
            MODEL_NAME: modelName.trim(),
            MODEL_PHOTO_URL: imageInfo.imageUrl,
            MODEL_PHOTO_ID: imageInfo.imageId,
        };

        /** Insert new model to database */
        await db("equipment_model").insert(modelData);

        /** If create successfully, then return create successful message with entity 'Model' */
        return responseBuilder.CreateSuccessful(res, null, "Model");
    } catch(error) {
        /** If failed to upload, clear the image if it is uploaded successfully */
        await helpers.DeleteDriveImage(drive, imageInfo?.imageId);
        /** Log error and return 503 */
        console.log("ERROR: There is an error occur while adding the model's information: ", error);
        return responseBuilder.ServerError("There is an error occur while creating the model.");
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
    const allowedImageExtensions = ["jpg", "jpeg", "png", "heic", "heif", "hevc", "webp"];

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
async function ValidateType(typeId, modelName) {
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

        if(typeof modelName !== "string") {
            return "Invalid model name type."
        }

        const existModelName = await db("equipment_model").select("MODEL_NAME AS modelName").where("MODEL_NAME", "LIKE", modelName.trim()).where("FK_TYPE_ID","=", typeId).first();
        if(existModelName) {
            return "This model already exists in this type."
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

/** 
 * Handle validation before add models to database by adminstrator
 *  
 * @param {object} res - The response object for the HTTP request.
 * @param {object} req - The request object from the HTTP request.
 * @returns {object | null} - If failed validation, return 400, or null if information is valid
 */
async function ModelAdditionValidation(res, req) {
    try{
        /** Destructure variables from the request body */
        const { modelName, typeId, schoolId } = req.body;

        /** Retrieve uploaded files from the form data */
        const image = req.file; 

        /** Ensure all required fields are provided with information */
        if(!modelName || !typeId || !schoolId) {
            return responseBuilder.MissingContent(res);
        }

        /** Ensure that school id is valid, and only admin can perform this action */
        const userError = await Promise.resolve(ValidateUser(schoolId));
        if(userError) {
            return responseBuilder.BadRequest(res, userError);
        }
        
        /** Ensure that there is no item's type error  */
        const typeError = await Promise.resolve(ValidateType(typeId, modelName));
        if(typeError) {
            return responseBuilder.BadRequest(res, typeError);
        }

        /** Ensure that the uploaded file is an image type */
        const imageError = ValidateImage(image);
        if(imageError) {
            return responseBuilder.BadRequest(res, imageError);
        }

        /** Return null indicate validation is passed */
        return null;
    } catch(error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error occur while validating model information before adding into the system: ", error);
        return responseBuilder.ServerError(res, "Sorry, there is an error while validating model's information.");
    }
}
/** Exports the module/functions */
module.exports = {
    ModelAddition
}
