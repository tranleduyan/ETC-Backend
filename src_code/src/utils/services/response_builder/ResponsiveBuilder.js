/**
 * This function is a helper that help us to build the response with the 'response' object from express
 * @param {object} res - The response object for the HTTP request, so that it can use response's attribute to build response.
 * @param {number} statusCode - The status code we want to the response to send back.
 * @param {object} body - The body or the response object
 * @returns a response with status code and a body
 */
function BuildResponse(res, statusCode, body) {
    return res.status(statusCode).json(body);
  }
  
  /**
   * Create a not found response message for an entity.
   *
   * @param {object} res - The response object for the HTTP request, so that it can use response's attribute to build response.
   * @param {String} entityName - The name of the entity that we want to specifically notice in the message.
   * @returns If entityName is defined, `entityName not found.` Otherwise, `Entity not found.`
   */
  function NotFound(res, entityName = "") {
    /** Construct a customized message for entity not found. */
    let responseMessage = "";
  
    /** If there is entity name, we return message with the entity name */
    if (entityName.length !== 0) {
      /** Trim the trailing spaces, ensure the consistency of the response message */
      responseMessage = entityName.trim();
  
      /** Ensure we always capitalize the first letter of the entityName */
      responseMessage =
        responseMessage.charAt(0).toUpperCase() + responseMessage.slice(1);
    } else {
      /** If no entityName specify set it to 'An entity' */
      responseMessage = "An entity";
    }
  
    /** Create and return the response object */
    return BuildResponse(res, 404, {
      message: `${responseMessage} not found.`,
    });
  }
  
  /**
   * Create a successful response message for a newly created entity.
   *
   * @param {object} res - The response object for the HTTP request, so that it can use response's attribute to build response.
   * @param {object} responseObject - Optional. The response object containing data about the created entity.
   * @param {string} entityName - Optional. The name of the entity being created.
   * @returns {object} A response object with a success message and, optionally, the created entity data.
   */
  function CreateSuccessful(res, responseObject = null, entityName = "") {
    /** Construct a customized message for created entity */
    let responseMessage = "";
  
    /** If there is entity name, we return message with the entity name */
    if (entityName.length !== 0) {
      /** Trim the trailing spaces, ensure the consistency of the response message */
      responseMessage = entityName.trim();
  
      /** Ensure we always capitalize the first letter of the entityName */
      responseMessage =
        responseMessage.charAt(0).toUpperCase() + responseMessage.slice(1);
    } else {
      /** If no entityName specify set it to 'An entity' */
      responseMessage = "An entity";
    }
  
    /** Create and return response */
    if (!responseObject) {
      return BuildResponse(res, 201, {
        message: `${responseMessage} successfully created.`,
      });
    }
  
    /** If there is response object, include them in response */
    return BuildResponse(res, 201, {
      message: `${responseMessage} successfully created.`,
      responseObject: responseObject,
    });
  }
  
  /**
   * Create a successful response message for a retrieved entity.
   *
   * @param {object} res - The response object for the HTTP request, so that it can use response's attribute to build response.
   * @param {object} responseObject - Optional. The response object containing data about the retrieved entity.
   * @param {string} entityName - Optional. The name of the retrieved entity.
   * @returns {object} A response object with a success message and, optionally, the retrieved entity data.
   */
  function GetSuccessful(res, responseObject = null, entityName = "") {
    // Construct a customized message for the retrieved entity
    let responseMessage = "";
  
    /** If there is entity name, we return message with the entity name */
    if (entityName.length !== 0) {
      /** Trim the trailing spaces, ensure the consistency of the response message */
      responseMessage = entityName.trim();
  
      /** Ensure we always capitalize the first letter of the entityName */
      responseMessage =
        responseMessage.charAt(0).toUpperCase() + responseMessage.slice(1);
    } else {
      /** If no entityName specify set it to 'An entity' */
      responseMessage = "An entity";
    }
  
    /** Create and return response in case there is no response object */
    if (!responseObject) {
      return BuildResponse(res, 201, {
        message: `An entity successfully retrieved.`,
      });
    }
    /** If there is response object, include them in the response */
    return BuildResponse(res, 200, {
      message: `${responseMessage} successfully retrieved.`,
      responseObject,
    });
  }
  
  /**
   * Create a successful response message for an updated entity.
   *
   * @param {object} res - The response object for the HTTP request.
   * @param {object} responseObject - Optional. The response object containing data about the updated entity.
   * @param {string} entityName - Optional. The name of the updated entity.
   * @returns {object} A response object with a success message for the updated entity.
   */
  function UpdateSuccessful(res, responseObject = null, entityName = "") {
    /** Construct a customized message for updated entity */
    let responseMessage = "";
  
    /** If there is entity name, we return message with the entity name */
    if (entityName.length !== 0) {
      /** Trim the trailing spaces, ensure the consistency of the response message */
      responseMessage = entityName.trim();
  
      /** Ensure we always capitalize the first letter of the entityName */
      responseMessage =
        responseMessage.charAt(0).toUpperCase() + responseMessage.slice(1);
    } else {
      /** If no entityName specify set it to 'An entity' */
      responseMessage = "An entity";
    }
  
    /** Create and return response in case there is no response object */
    if (!responseObject) {
      return BuildResponse(res, 200, {
        message: `${responseMessage} successfully updated.`,
      });
    }
    /** If there is response object, include them in the response */
    return BuildResponse(res, 200, {
      message: `${responseMessage} successfully updated.`,
      responseObject,
    });
  }
  
  /**
   * Create a successful response message for a deleted entity.
   *
   * @param {object} res - The response object for the HTTP request, so that it can use response's attribute to build response.
   * @param {string} entityName - Optional. The name of the deleted entity.
   * @returns {object} A response object with a success message for the deleted entity.
   */
  function DeleteSuccessful(res, entityName = "") {
    /** Construct a customized message for deleted entity */
    let responseMessage = "";
  
    /** If there is entity name, we return message with the entity name */
    if (entityName.length !== 0) {
      /** Trim the trailing spaces, ensure the consistency of the response message */
      responseMessage = entityName.trim();
  
      /** Ensure we always capitalize the first letter of the entityName */
      responseMessage =
        responseMessage.charAt(0).toUpperCase() + responseMessage.slice(1);
    } else {
      /** If no entityName specify set it to 'An entity' */
      responseMessage = "An entity";
    }
    /** Create and return response message */
    return BuildResponse(res, 200, {
      message: `${responseMessage} successfully deleted.`,
    });
  }
  
  /**
   * Create a response object for missing content.
   *
   * @param {object} res - The response object for the HTTP request, so that it can use response's attribute to build response.
   * @param {string} type - The type of missing content ("RB" for Request Body, nothing for Missing Required Fields).
   * @returns {object} A response object indicating the type of missing content.
   */
  function MissingContent(res, type) {
    /** Create and return the response object for type "RB" (Request Body) */
    if (type === "RB") {
      return BuildResponse(res, 400, {
        message: "Request body is empty.",
      });
    }
  
    /** Create and return the response object for missing required fields */
    return BuildResponse(res, 400, {
      message: "Missing required fields!",
    });
  }
  
  /**
   * Create a response object for a server error.
   *
   * @param {object} res - The response object for the HTTP request, so that it can use response's attribute to build response.
   * @param {string} message - Optional. A custom error message to include in the response.
   * @returns {object} A response object indicating a server error.
   */
  function ServerError(res, message = "") {
    if (message.length != 0) {
      /** Return the response */
      return BuildResponse(res, 503, {
        message: message,
      });
    }
  
    /** Return the response */
    return BuildResponse(res, 503, {
      message: "Server is in maintenance. Please try again.",
    });
  }
  
  /**
   * Create a response object for a bad request.
   *
   * @param {object} res - The response object for the HTTP request, so that it can use response's attribute to build response.
   * @param {string} message - Optional. A custom error message to include in the response.
   * @returns {object} A response object indicating a bad request.
   */
  function BadRequest(res, message = "") {
    if (message.length !== 0) {
      /** Return the response */
      return BuildResponse(res, 400, {
        message: message,
      });
    }
  
    /** Return the response */
    return BuildResponse(res, 400, {
      message: "Bad request occurs. Try again.",
    });
  }
  
  /** Exports the functions */
  module.exports = {
    BuildResponse,
    CreateSuccessful,
    GetSuccessful,
    NotFound,
    UpdateSuccessful,
    DeleteSuccessful,
    MissingContent,
    ServerError,
    BadRequest,
  };
  