/** Import neccessary modules */
const AddLocationService = require("../services/Location/AddLocation");
const GetAllLocationService = require("../services/Location/GetAllLocations");

/** Export the module */
module.exports = {
  AddLocation: AddLocationService.AddLocation,
  GetAllLocations: GetAllLocationService.GetAllLocations
}
