/** Import neccessary modules */
const addLocationService = require("../services/Location/AddLocation");
const getAllLocationService = require("../services/Location/GetAllLocations");

/** Export the module */
module.exports = {
  AddLocation: addLocationService.AddLocation,
  GetAllLocations: getAllLocationService.GetAllLocations
}
