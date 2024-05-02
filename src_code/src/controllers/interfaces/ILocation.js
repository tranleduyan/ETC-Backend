/** Import neccessary modules */
const AddLocationService = require("../services/Location/AddLocation");
const GetAllLocationService = require("../services/Location/GetAllLocations");
const LocationRemovalService = require("../services/Location/LocationRemoval")
const LocationUpdateService = require("../services/Location/LocationUpdate");

/** Export the module */
module.exports = {
  AddLocation: AddLocationService.AddLocation,
  GetAllLocations: GetAllLocationService.GetAllLocations,
  LocationRemoval: LocationRemovalService.LocationRemoval,
  LocationUpdate: LocationUpdateService.LocationUpdate
}
