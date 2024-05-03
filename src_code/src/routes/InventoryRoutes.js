/** Initalize neccessary modules */
const express = require("express");
const responseBuilder = require("../utils/interfaces/IResponseBuilder");
const inventoryServices = require("../controllers/interfaces/IInventory");
const multer = require("multer");

/** Initialize router for the route */
const router = express.Router();

/** Set up multer for handling file uploads */
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 *  EXPORT CSV/EQUIPMENT EXPORT
 *  URL => /api/inventory/export-csv
 *  requestBody:
 *  {
 *      "schoolId": string
 *  }
 *
 *  @return 400 (Failed Validation):
 *  {
 *      "message": string
 *  }
 *  @return 503 (Server Error):
 *  {
 *      "message":  string
 *  }
 *  @return 200 (success):
 *  {
 *      "message": string
 *  }
 */
router.get("/export-csv", async (request, response) => {
  try {
    /** Call the ExportCSV function */
    return await Promise.resolve(
      inventoryServices.ExportCSV(request, response)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error exporting CSV: ", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while exporting CSV."
    );
  }
});

/**
 *  POST/ADD EQUIPMENT
 *  URL => /api/inventory/equipment
 *  requestBody:
 *  {
 *      "schoolId": string,
 *      "serialId": string,
 *      "typeId": int,
 *      "modelId": int,
 *      "maintenanceStatus": string,
 *      "reservationStatus": string,
 *      "usageCondition": string,
 *      "purchaseCost": double (optional),
 *      "purchaseDate": date (optional)
 *  }
 *
 *  @return 400 (Failed Validation):
 *  {
 *      "message": string
 *  }
 *  @return 503 (Server Error):
 *  {
 *      "message":  "There is an error occur while retrieving type information." / "There is an error while adding equipment."
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
router.post("/equipment", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }
    /** If request body is exist, then we perform sign in based on request body */
    return await Promise.resolve(
      inventoryServices.EquipmentAddition(response, request.body)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while adding equipment: ", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while adding equipment."
    );
  }
});

/**
 * PUT/UPDATE EQUIPMENT
 * URL => /api/inventory/equipment/{serialId}
 * requestBody:
 *  {
 *      "schoolId": string,
 *      "typeId": int (optional),
 *      "modelId": int (optional),
 *      "maintenanceStatus": string (optional),
 *      "reservationStatus": string (optional),
 *      "usageCondition": string (optional),
 *      "purchaseCost": double (optional),
 *      "purchaseDate": date (optional)
 *  }
 *
 * @return 404 or 400 if failed validation
 * @return 503 if server error
 * @return 200 OK
 * {
 *      "message":"Equipment updated successfully."
 * }
 */
router.put("/equipment/:serialId", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }
    /** Retrieve serial id of the requested update equipment */
    const serialId = request.params.serialId;
    /** Perform update equipment */
    return await Promise.resolve(
      inventoryServices.EquipmentUpdate(response, request.body, serialId)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while updating equipment:", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while updating equipment."
    );
  }
});

/**
 *  DELETE/EQUIPMENT REMOVE
 *  URL => /api/inventory/equipment
 *  requestBody:
 *  {
 *      "schoolId": string,
 *      "serialId": array (string)
 *  }
 *
 *  @return 400 (Failed Validation):
 *  {
 *      "message": string
 *  }
 *  @return 503 (Server Error):
 *  {
 *      "message":  string
 *  }
 *  @return 200:
 *  {
 *      "message": string
 *  }
 */
router.delete("/equipment", async (request, response) => {
  try {
    return await Promise.resolve(
      inventoryServices.EquipmentRemoval(response, request.body)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while removing: ", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while removing."
    );
  }
});

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
 *      fieldName: 'image',
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
router.post("/models", upload.single("image"), async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    /** If request body is exist, then we perform model add based on request body */
    return await Promise.resolve(
      inventoryServices.ModelAddition(response, request)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while model adding: ", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while model adding."
    );
  }
});

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
router.post("/types", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }
    /** If request body is exist, then we perform type add based on request body */
    return await Promise.resolve(
      inventoryServices.TypeAddition(response, request.body)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while type adding: ", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while type adding."
    );
  }
});

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
router.get("/types", async (request, response) => {
  try {
    /** Perform get all types */
    return await Promise.resolve(inventoryServices.GetAllTypes(response));
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while retrieving types: ", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving types."
    );
  }
});

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
router.get("/types/:typeId/models", async (request, response) => {
  try {
    /** Get type id */
    const typeId = request.params.typeId;
    /** Perform get all models of a type */
    return await Promise.resolve(
      inventoryServices.GetAllModelsOfType(response, typeId)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log(
      "ERROR: There is an error while retrieving models of type: ",
      error
    );
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving models."
    );
  }
});

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
router.get("/types/:typeId", async (request, response) => {
  try {
    /** Get type id */
    const typeId = request.params.typeId;
    /** Perform get type information */
    return await Promise.resolve(
      inventoryServices.GetTypeInformation(response, typeId)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log(
      "ERROR: There is an error while retrieving type information: ",
      error
    );
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving type information."
    );
  }
});

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
router.get("/models/:modelId", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    const modelId = request.params.modelId;
    /** Perform get information of model */
    return await Promise.resolve(
      inventoryServices.GetModelInformation(response, modelId)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log(
      "ERROR: There is an error while retrieving model's information:",
      error
    );
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving model's information."
    );
  }
});

/**
 * DELETE/REMOVE MULTIPLE TYPES AT ONCE
 * URL => /api/inventory/types
 * requestBody:
 * {
 *      "schoolId": string,
 *      "typeIds": Array
 * }
 */
router.delete("/types", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }
    /** Perform delete type and its associate models */
    return await Promise.resolve(
      inventoryServices.TypesRemoval(response, request.body)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while deleting the types: ", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while deleting types."
    );
  }
});

/**
 * DELETE/REMOVE MULTIPLE MODELS AT ONCE
 * URL => /api/inventory/models
 * requestBody:
 * {
 *      "schoolId": string,
 *      "modelIds": Array
 * }
 */
router.delete("/models", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }
    /** Perform delete models */
    return await Promise.resolve(
      inventoryServices.ModelsRemoval(response, request.body)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while deleting models: ", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while deleting models."
    );
  }
});

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
router.put("/types/:typeId", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }
    /** Retrieve type id of the requested update type */
    const typeId = request.params.typeId;
    /** Perform update type */
    return await Promise.resolve(
      inventoryServices.TypeUpdate(response, request.body, typeId)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log("ERROR: There is an error while updating type:", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while updating type."
    );
  }
});

/**
 * PUT/MODEL UPDATE
 * URL => /api/inventory/models/{modelId}
 * requestBody:
 * {
 *      "schoolId": string,
 *      "modelName":string,
 *      "typeId": int
 * }
 *
 * QueryParams: modelId
 *
 * req.file:
 * {
 *      fieldName: 'image',
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
router.put(
  "/models/:modelId",
  upload.single("image"),
  async (request, response) => {
    try {
      /** If there is no request body, then we return the request body is empty */
      if (!request.body || Object.keys(request.body).length === 0) {
        /** Return request body is empty */
        return responseBuilder.MissingContent(response, "RB");
      }
      /** Retrieve model id of the requested update model */
      const modelId = request.params.modelId;
      /** Perform update model */
      return await Promise.resolve(
        inventoryServices.ModelUpdate(response, request, modelId)
      );
    } catch (error) {
      /** Log error and return 503 */
      console.log(
        "ERROR: There is an error while updating model's information:",
        error
      );
      return responseBuilder.ServerError(
        res,
        "There is an error while updating the model."
      );
    }
  }
);

/**
 * GET/RETRIEVE ALL MODELS SORT BY TYPE NAME
 * URL => /api/inventory/models
 * Response Body:
 * {
 *  "message": "Models successfully retrieved.",
 *  "responseObject":
 *  [
 *      {
 *          "modelId": 59,
 *          "modelName": "Oakton Aneroid",
 *          "typeName": "Barometer",
 *          "equipmentCount": 2
 *      },
 *  ]
 * }
 */
router.get("/models", async (request, response) => {
  try {
    /** Perform get models */
    return await Promise.resolve(inventoryServices.GetAllModels(response));
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log(
      "ERROR: There is an error while retrieving model's information:",
      error
    );
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving model's information."
    );
  }
});

/**
 * GET/RETRIEVE ALL AVAILABLE EQUIPMENTS/MODELS IN A PERIOD OF TIME
 * URL => /api/inventory/available-models?startDate=value&endDate=value
 * Response Body:
 * {
 *  "message": "Available models successfully retrieved.",
 *  "responseObject":
 *   [
 *      {
 *          "modelId": 59,
 *          "modelName": "Oakton Aneroid",
 *          "modelPhoto": "https://drive.google.com/uc?id=1NvjXSvJtM1RJQbVAQIqs9NhY4ptF0oUT",
 *          "typeName": "Barometer",
 *          "availableCount": 2
 *      }
 *   ]
 * }
 */
router.get("/available-models", async (request, response) => {
  try {
    /** Retrieve values from query parameters */
    const startDate = request.query.startDate;
    const endDate = request.query.endDate;
    /** Perform get available models */
    return await Promise.resolve(
      inventoryServices.GetAvailableModels(response, startDate, endDate)
    );
  } catch (error) {
    /** Logging unexpected error. help for debug */
    console.log(
      "ERROR: There is an error while retrieving model's information:",
      error
    );
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving model's information."
    );
  }
});

/**
 * GET/RETRIEVE EQUIPMENT Information
 * URL => /api/inventory/equipment/{serialId}
 */
router.get("/equipment/:serialId", async (request, response) => {
  try {
    const serialId = request.params.serialId;
    /** Perform get equipment information */
    return await Promise.resolve(
      inventoryServices.GetEquipmentInformation(response, serialId)
    );
  } catch (error) {
    console.log(
      "ERROR: There is an error while retrieving all equipment:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while retrieving all equipment."
    );
  }
});

/**
 * GET/RETRIEVE ALL EQUIPMENT
 * URL => /api/inventory/equipment
 */
router.get("/equipment", async (_, response) => {
  try {
    /** Perform get all equipment */
    return await Promise.resolve(inventoryServices.GetAllEquipment(response));
  } catch (error) {
    console.log(
      "ERROR: There is an error while retrieving all equipment:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while retrieving all equipment."
    );
  }
});

/**
 * POST/SCAN LOG ADDITION
 * URL => /api/inventory/scans
 * requestBody:
 * {
 *      "scanData": string,
 *      "scanTime": time
 * }
 *
 * @return 400 (If failed validation)
 *         503 (If server error)
 *         200 (Success OK)
 */

router.post("/scan", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }
    /** Uncomment for development */
    // console.log("scandata: " + scanData);

    /** Perform add scan */
    return await Promise.resolve(
      inventoryServices.AntennaScan(response, request)
    );
  } catch (error) {
    /** log unexpected error for debugging */
    console.log("ERROR: There is an error while logging new scan:", error);
    /** Response error message to the client */
    return responseBuilder.ServerError(
      response,
      "There is an error while logging a new scan."
    );
  }
});

/**
 * POST/ADD NEW ANTENNA (RFID READER)
 * URL => /api/inventory/antenna/create
 *
 * Request Body:
 * {
 *      "schoolId": "string",
 *      "antennaId": "string",
 *      "locationId": number,
 * }
 *
 * Response:
 * {
 *      "message": "string"
 * }
 */
router.post("/antenna/create", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    /** Perform add RFID antenna */
    return await Promise.resolve(
      inventoryServices.AddRFIDAntenna(response, request.body)
    );
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      `ERROR: There is an error while adding ${request?.body?.antennaId} into antennas:`,
      error
    );
    return responseBuilder.ServerError(
      response,
      "There is an error while adding this RFID antenna."
    );
  }
});

/**
 * GET/RETRIEVING ALL ANTENNAS
 * URL => /api/inventory/antenna
 *
 * Response Object:
 * [
 *      {
 *          "antennaId": number,
 *          "locationName": string
 *       }
 * ]
 */
router.get("/antenna", async (_, response) => {
  try {
    return await Promise.resolve(inventoryServices.GetAllAntennas(response));
  } catch (error) {
    console.log(
      `ERROR: There is an error while retrieving all antennas:`,
      error
    );
    return responseBuilder.ServerError(
      response,
      "There is an error while retrieving all antennas."
    );
  }
});

/**
 * DELETE/REMOVING ANTENNAS
 * URL => /api/inventory/antenna
 *
 * Request Body:
 * {
 *      "schoolId": string,
 *      "antennaIds": array of number
 * }
 */
router.delete("/antenna", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    /** Perform action */
    return await Promise.resolve(
      inventoryServices.AntennaRemoval(response, request.body)
    );
  } catch (error) {
    /** If error, log error and return 503 */
    console.log("ERROR: There is an error while deleting antennas:", error);
    return responseBuilder.ServerError(
      response,
      "There is an error while deleting antennas."
    );
  }
});

/**
 * PUT/UPDATE ANTENNA INFORMATION
 * URL => /api/inventory/antenna/{antennaId}
 *
 * Request Body:
 * {
 *      "schoolId": string, (required)
 *      "newAntennaId": string, (required)
 *      "locationId": number (optional)
 * }
 */
router.put("/antenna/:antennaId", async (request, response) => {
  try {
    /** If there is no request body, then we return the request body is empty */
    if (!request.body || Object.keys(request.body).length === 0) {
      /** Return request body is empty */
      return responseBuilder.MissingContent(response, "RB");
    }

    /** Retrieve antennaId */
    const antennaId = request.params.antennaId;

    /** Perform action */
    return await Promise.resolve(
      inventoryServices.AntennaUpdate(response, request.body, antennaId)
    );
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      "ERROR: There is an error while updating antenna information:",
      error
    );
    return responseBuilder.ServerError(
      response,
      "There is an error while updating antenna information."
    );
  }
});

/** Exports the router */
module.exports = router;
