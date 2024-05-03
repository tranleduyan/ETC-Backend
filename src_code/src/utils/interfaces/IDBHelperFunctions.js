/** Initialize neccessary module */
const userDBHelperFunctions = require("../services/helper_functions/db_helper_functions/user/UserDBHelperFunctions");
const typeDBHelperFunctions = require("../services/helper_functions/db_helper_functions/type/TypeDBHelperFunctions");
const modelDBHelperFunctions = require("../services/helper_functions/db_helper_functions/model/ModelDBHelperFunctions");
const equipmentDBHelperFunctions = require("../services/helper_functions/db_helper_functions/equipment/EquipmentDBHelperFunctions");
const reservationDBHelperFunctions = require("../services/helper_functions/db_helper_functions/reservation/ReservationDBHelperFunctions");
const locationDBHelperFunctions = require("../services/helper_functions/db_helper_functions/location/LocationHelperFunctions");
const antennaDBHelperFunctions = require("../services/helper_functions/db_helper_functions/antenna/AntennaHelperFunctions");

/** Exports the functions */
module.exports = {
  GetUserInfoByEmailAddress: userDBHelperFunctions.GetUserInfoByEmailAddress,
  GetUserInfoBySchoolId: userDBHelperFunctions.GetUserInfoBySchoolId,
  GetTypeInfoByName: typeDBHelperFunctions.GetTypeInfoByName,
  AddTypeToDatabase: typeDBHelperFunctions.AddTypeToDatabase,
  GetTypeInfoByTypeId: typeDBHelperFunctions.GetTypeInfoByTypeId,
  GetModelInfoByModelId: modelDBHelperFunctions.GetModelInfoByModelId,
  GetEquipmentAvailableCount: modelDBHelperFunctions.GetEquipmentAvailableCount,
  GetEquipmentBySerialId: equipmentDBHelperFunctions.GetEquipmentBySerialId,
  GetReservationInformationById:
    reservationDBHelperFunctions.GetReservationInformationById,
  GetApprovedReservationList:
    reservationDBHelperFunctions.GetApprovedReservationList,
  GetRequestedReservationList:
    reservationDBHelperFunctions.GetRequestedReservationList,
  GetAllLocations: locationDBHelperFunctions.GetAllLocations,
  GetLocationInformationById:
    locationDBHelperFunctions.GetLocationInformationById,
  GetAllAntennas: antennaDBHelperFunctions.GetAllAntennas,
};
