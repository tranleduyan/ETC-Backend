/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelpers = require("../../../utils/interfaces/IDBHelperFunctions");

async function ApproveReservation(res, userId, reservationId) {
  try {
    const user = await Promise.resolve(
      dbHelpers.GetUserInfoBySchoolId(db, userId)
    );

    const updateData = {
      STATUS: "Approved", // Corrected typo: "Approved" instead of "Approve"
      RESPONDER: `${user.lastName}, ${user.firstName}${
        user.middleName ? ` ${user.middleName}` : ""
      }`,
    };
    await db("reservation")
      .update(updateData)
      .where("PK_RESERVATION_ID", "=", parseInt(reservationId, 10));

    const approveReservationList = await Promise.resolve(
      dbHelpers.GetApprovedReservationList(db, userId)
    );

    if (!approveReservationList) {
      return responseBuilder.BadRequest(
        res,
        "You do not have any approved reservation."
      );
    }

    if (typeof approveReservationList === "string") {
      return responseBuilder.ServerError(res, approveReservationList);
    }

    return responseBuilder.BuildResponse(res, 200, {
      message: "You have approve a reservation",
      responseObject: approveReservationList,
    });
  } catch (error) {
    console.log(
      "ERROR: There is an error while approving the reservation:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while processing your information."
    );
  }
}

async function CancelRejectReservation(res, type, userId, reservationId) {
  const trx = await db.transaction();
  try {
    await trx("reservation")
      .where("PK_RESERVATION_ID", "=", reservationId)
      .del();

    await trx.commit();

    const requestReservationList = await Promise.resolve(
      dbHelpers.GetRequestedReservationList(db, userId)
    );

    if (!requestReservationList) {
      return responseBuilder.BuildResponse(res, 200, {
        message: "You don't have any requested reservation.",
      });
    }

    if (typeof requestReservationList === "string") {
      await trx.rollback();
      return responseBuilder.ServerError(res, requestReservationList);
    }

    return responseBuilder.BuildResponse(res, 200, {
      message: `You have ${type} a reservation successfully.`,
      responseObject: requestReservationList,
    });
  } catch (error) {
    await trx.rollback();
    console.log(
      `ERROR: There is an error while ${type} the reservation:`,
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while processing your information."
    );
  }
}

async function ValidateApproveRejectReservation(res, userId, reservationId) {
  try {
    const reservationPromise = dbHelpers.GetReservationInformationById(
      db,
      reservationId
    );

    const userPromise = dbHelpers.GetUserInfoBySchoolId(db, userId);

    const [reservation, user] = await Promise.all([
      reservationPromise,
      userPromise,
    ]);

    if (!reservation) {
      return responseBuilder.NotFound(res, "Reservation");
    }

    if (typeof reservation === "string") {
      return responseBuilder.ServerError(res, reservation);
    }

    if (!user) {
      return responseBuilder.NotFound(res, "User");
    }

    if (user.userRole === "Student") {
      return responseBuilder.BadRequest(
        res,
        "You do not have permission to perform this action."
      );
    }

    if (reservation.status === "Approved") {
      if (reservation.responder) {
        return responseBuilder.BadRequest(
          res,
          `This reservation has been approved by ${reservation.responder}.`
        );
      } else {
        return responseBuilder.BadRequest(
          res,
          `This reservation has already been approved.`
        );
      }
    }

    return null;
  } catch (error) {
    console.log(
      "ERROR: There is an error occur while validate approve reject reservation:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while processing your information."
    );
  }
}

async function ValidateCancelReservation(res, userId, reservationId) {
  try {
    const reservationPromise = dbHelpers.GetReservationInformationById(
      db,
      reservationId
    );

    const userPromise = dbHelpers.GetUserInfoBySchoolId(db, userId);

    const [reservation, user] = await Promise.all([
      reservationPromise,
      userPromise,
    ]);

    if (!reservation) {
      return responseBuilder.NotFound(res, "Reservation");
    }

    if (typeof reservation === "string") {
      return responseBuilder.ServerError(res, reservation);
    }

    if (!user) {
      return responseBuilder.NotFound(res, "User");
    }

    if (parseInt(userId, 10) !== parseInt(reservation.schoolId, 10)) {
      return responseBuilder.BadRequest(
        res,
        "Only the person who reserved this reservation can cancel it."
      );
    }

    return null;
  } catch (error) {
    console.log(
      "ERROR: There is an error occur while validating cancel reservation:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while processing your information."
    );
  }
}

async function ValidateApproveRejectCancelReservation(
  res,
  type,
  userId,
  reservationId
) {
  try {
    if (type !== "approve" && type !== "reject" && type !== "cancel") {
      return responseBuilder.BadRequest(res, "Invalid action.");
    }

    if (!reservationId || isNaN(parseInt(reservationId, 10))) {
      return responseBuilder.NotFound(res, "Reservation");
    }

    if (!userId || isNaN(parseInt(userId, 10))) {
      return responseBuilder.NotFound(res, "User");
    }

    let errors;
    if (type === "approve" || type === "reject") {
      errors = await Promise.resolve(
        ValidateApproveRejectReservation(res, userId, reservationId)
      );
    } else {
      errors = await Promise.resolve(
        ValidateCancelReservation(res, userId, reservationId)
      );
    }

    return errors;
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      "ERROR: There is an error occur while validating approve reject cancel reservation:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while processing your information."
    );
  }
}

async function ApproveRejectCancelReservation(
  res,
  type,
  userId,
  reservationId
) {
  try {
    const errors = await Promise.resolve(
      ValidateApproveRejectCancelReservation(res, type, userId, reservationId)
    );

    if (errors) {
      return errors;
    }

    if (type === "approve") {
      return await ApproveReservation(res, userId, reservationId);
    }
    return await CancelRejectReservation(res, type, userId, reservationId);
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      "ERROR: There is an error while approve/reject/cancel reservation:",
      error
    );
    return responseBuilder.ServerError(
      res,
      "There is an error while processing your request."
    );
  }
}

module.exports = {
  ApproveRejectCancelReservation,
};
