/** Import neccessary modules */
const AddLocationService = require("../services/Location/AddLocation");
const GetAllLocationService = require("../services/Location/GetAllLocations");
const LocationRemovalService = require("../services/Location/LocationRemoval")

/** Export the module */
module.exports = {
  AddLocation: AddLocationService.AddLocation,
  GetAllLocations: GetAllLocationService.GetAllLocations,
  LocationRemoval: LocationRemovalService.LocationRemoval
}
