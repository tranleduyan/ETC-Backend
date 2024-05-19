/** Import neccessary modules */
const GetApprovedReservationServices = require("../services/User/GetUserApprovedReservation");
const GetRequestedReservationServices = require("../services/User/GetUserRequestedReservation");
const ApproveRejectCancelReservationServices = require("../services/User/ApproveRejectCancelReservation");
const GetUserUsageServices = require("../services/User/GetUserUsage");

/** Exports the modules */
module.exports = {
  GetApprovedReservation: GetApprovedReservationServices.GetApprovedReservation,
  GetRequestedReservation:
    GetRequestedReservationServices.GetRequestedReservation,
  ApproveRejectCancelReservation:
  ApproveRejectCancelReservationServices.ApproveRejectCancelReservation,
  GetUserUsage: GetUserUsageServices.GetUserUsage
};
