/** Initialized neccessary modules */
const responseBuilder = require("../services/response_builder/ResponsiveBuilder");

/** Exports the functions */
module.exports = {
    BuildResponse: responseBuilder.BuildResponse,
    CreateSuccessful: responseBuilder.CreateSuccessful,
    UpdateSuccessful: responseBuilder.UpdateSuccessful,
    DeleteSuccessful: responseBuilder.DeleteSuccessful,
    GetSuccessful: responseBuilder.GetSuccessful,
    MissingContent: responseBuilder.MissingContent,
    NotFound: responseBuilder.NotFound,
    ServerError: responseBuilder.ServerError,
    BadRequest: responseBuilder.BadRequest,
}
