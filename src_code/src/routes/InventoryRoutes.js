/** Initalize neccessary modules */
const express = require('express');
const responseBuilder = require('../utils/interfaces/IResponseBuilder');
const inventoryServices = require('../controllers/interfaces/IInventory');
const multer = require("multer");

/** Initialize router for the route */
const router = express.Router();

/** Set up multer for handling file uploads */
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 *  POST/EQUIPMENT REMOVE
 *  URL => /api/inventory/remove
 */
router.post('/remove', async(request, response) => {
    try{
        return await Promise.resolve(inventoryServices.EquipmentRemoval(response, request.body));
    }catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while removing: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while removing.");
    }
})

/**
 * POST/MODEL ADDITION
 * URL => /api/inventory/models
 * requestBody:
 * {
 *      "schoolId": string,
 *      "modelName":string,
 *      "typeId": int     
 * }
 * 
 * req.file:
 * {
 *      fieldName: 'recipePhotos',
 *      originalName: 'example.jpg',
 *      encoding: '7bit',
 *      mimetype: 'image/jpeg,
 *      size: 12345,
 *      buffer: buffer (bit)
 *  }   
 * 
 * @return 400 (If failed validation)
 *         503 (If server error) 
 *         200 (Success OK)
 */
router.post('/models', upload.single('image'), async(request, response) => {
    try{
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        } 

        /** If request body is exist, then we perform model add based on request body */
        return await Promise.resolve(inventoryServices.ModelAddition(response, request));
    }catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while model adding: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while model adding.");
    }
})

/**
 *  POST/TYPE ADDITION
 *  URL => /api/inventory/types
 *  requestBody: 
 *  {
 *      "schoolId": string,
 *      "equipmentTypeName": string,
 *  }
 * 
 *  @return 400 (Failed Validation): 
 *  {
 *      "message":"Type already exists."
 *  }
 *  @return 503 (Server Error):
 *  {
 *      "message":  "There is an error occur while retrieving type information." / "There is an error occur while adding type."
 *  }
 *  @return 200:
 *  {
 *      "message": "New type added successfully.",
 *      "responseObject": {
 *           typeId: int,
 *           typeName: string,
 *      },
 *  }
 */
router.post('/types', async(request, response) => {
    try{
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        } 
        /** If request body is exist, then we perform type add based on request body */
        return await Promise.resolve(inventoryServices.TypeAddition(response, request.body));
    }catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while type adding: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while type adding.");
    }
})

/**
 * GET/RETRIEVE ALL TYPES
 * URL => /api/inventory/types 
 * @return 404: 
 * {
 *      "message": "There isn't any existed type. Please add more."
 * }
 * @return 503: 
 * {
 *      "message": type error message here
 * }
 * @return 200: 
 * Response object will be an array, and each item will have this: 
 * {
 *      "typeId": int,
 *      "typeName": string,
 *      "modelCount": int,
 *      "reserved": 0
 * }
 */
router.get('/types', async(request, response) => {
    try {
        /** Perform get all types */
        return await Promise.resolve(inventoryServices.GetAllTypes(response));
    } catch(error) {
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while retrieving types: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while retrieving types.");
    }
})

/**
 * GET/RETRIEVE ALL MODELS OF A TYPE
 * URL => /api/inventory/types/{typeId}/models
 * Query Params: typeId
 * @return 400 if type id is invalid
 * @return 404:
 * {
 *      "message":"There isn't any existed model. Please add more."
 * }
 * @return 503 if server error
 * @return 200: 
 * Response object will be an array, and each item will have this: 
 * {
 *      modelId: int,
 *      modelName: string,
 *      modelPhoto: URL, 
 *      typeName: string
 * }
 */
router.get('/types/:typeId/models', async(request, response) => {
    try{
        /** Get type id */
        const typeId = request.params.typeId;
        /** Perform get all models of a type */
        return await Promise.resolve(inventoryServices.GetAllModelsOfType(response, typeId));
    } catch(error) {
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while retrieving models of type: ", error); 
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while retrieving models.");
    }
})

/**
 * GET/RETRIEVE INFORMATION OF A TYPE
 * URL => /api/inventory/types/{typeId}
 * Query Params: typeId
 * @return 400 if type id is invalid
 * @return 404:
 * {
 *      "message":"Type not found."
 * }
 * @return 503 if server error
 * @return 200: 
 * responseObject:
 * {
 *      "typeId": int,
 *      "typeName": string
 * }
 */
router.get('/types/:typeId', async(request, response) => {
    try{
        /** Get type id */
        const typeId = request.params.typeId;
        /** Perform get type information */
        return await Promise.resolve(inventoryServices.GetTypeInformation(response, typeId));
    } catch(error) {
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while retrieving type information: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while retrieving type information.");
    }
})

/**
 * GET/RETRIEVE MODEL'S INFORMATION
 * URL => /api/inventory/models/{modelId}
 * Query Params: modelId
 * @return 400: If model id is not valid (numeric)
 * @return 404: If model is not found
 * @return 503: Server Error
 * @return 200: 
 * responseObject:
 * {
 *      "modelId": int,
 *      "modelName": string,
 *      "modelPhotoId": string,
 *      "modelPhoto": URL,
 *      "typeName": string
 * }
 */
router.get("/models/:modelId", async(request, response) => {
    try{ 
        /** If there is no request body, then we return the request body is empty */
        const modelId = request.params.modelId;
        /** Perform delete models */
        return await Promise.resolve(inventoryServices.GetModelInformation(response, modelId));
    } catch(error) {
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while retrieving model's information:", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while retrieving model's information.");
    }
})

/**
 * DELETE/REMOVE MULTIPLE TYPES AT ONCE
 * URL => /api/inventory/types
 * requestBody:
 * {
 *      "schoolId": string,
 *      "typeIds": Array
 * }
 */
router.delete('/types', async(request, response) => {
    try {
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        }
        /** Perform delete type and its associate models */
        return await Promise.resolve(inventoryServices.TypesRemoval(response, request.body));
    } catch(error){
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while deleting the types: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while deleting types.");
    }
})

/** 
 * DELETE/REMOVE MULTIPLE MODELS AT ONCE
 * URL => /api/inventory/models
 * requestBody: 
 * {
 *      "schoolId": string,
 *      "modelIds": Array
 * }
 */
router.delete('/models', async(request, response) => {
    try {
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        }
        /** Perform delete models */
        return await Promise.resolve(inventoryServices.ModelsRemoval(response, request.body));
    } catch (error) {
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while deleting models: ", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while deleting models.");
    }
})

/**
 * PUT/UPDATE TYPE NAME
 * URL => /api/inventory/types/{typeId}
 * requestBody: 
 * {
 *      "equipmentTypeName": string,
 *      "schoolId": string
 * }
 * 
 * @return 404 if failed validation, and if type name is exists
 * @return 503 if server error
 * @return 200 OK 
 * {
 *      "message":"Type updated successfully."
 * }
 */
router.put('/types/:typeId', async(request, response) => {
    try {
        /** If there is no request body, then we return the request body is empty */
        if(!request.body || Object.keys(request.body).length === 0) {
            /** Return request body is empty */
            return responseBuilder.MissingContent(response, "RB");
        }
        /** Retrieve type id of the requested update type */
        const typeId = request.params.typeId;
        /** Perform update type */
        return await Promise.resolve(inventoryServices.TypeUpdate(response, request, typeId));
    } catch(error) {
        /** Logging unexpected error. help for debug */
        console.log("ERROR: There is an error while updating type:", error);
        /** Response error message to the client */
        return responseBuilder.ServerError(response, "There is an error while updating type.");
    }
});

/** Exports the router */
module.exports = router;
