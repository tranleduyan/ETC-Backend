/** Initialize necessary modules */
const db = require("../../../configurations/database/DatabaseConfigurations");
const dbHelper = require("../../../utils/interfaces/IDBHelperFunctions");
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");

/**
 * Retrieves the list of requested reservations for a given school ID.
 *
 * @param {Object} response - The HTTP response object.
 * @param {string} schoolId - The unique identifier of the user.
 * @returns {Object} HTTP response containing the list of requested reservations or an error message.
 */
async function GetRequestedReservation(response, schoolId) {
  try {
    /** Retrieve user information based on school ID */
    const user = await dbHelper.GetUserInfoBySchoolId(db, schoolId);

    /** If user does not exist, return a not found response */
    if (!user) {
      return responseBuilder.NotFound(response, "User");
    }

    let requestedReservationList = null;

    /** Check user role to determine the query for reservations */
    if (user.userRole === "Student") {
      /** Get requested reservations for student users */
      requestedReservationList = await db("reservation AS r")
        .select(
          "r.PK_RESERVATION_ID AS reservationId",
          "r.START_DATE AS startDate",
          "r.END_DATE AS endDate",
          "r.STATUS AS status",
          "re.QUANTITY AS itemQuantity",
          "em.MODEL_NAME AS modelName",
          "em.PK_MODEL_ID AS modelId",
          "em.MODEL_PHOTO_URL AS modelPhoto",
          "et.TYPE_NAME AS typeName"
        )
        .leftJoin(
          "reserved_equipment AS re",
          "r.PK_RESERVATION_ID",
          "re.FK_RESERVATION_ID"
        )
        .leftJoin(
          "equipment_model AS em",
          "re.FK_EQUIPMENT_MODEL_ID",
          "em.PK_MODEL_ID"
        )
        .leftJoin(
          "equipment_type AS et",
          "re.FK_EQUIPMENT_TYPE_ID",
          "et.PK_TYPE_ID"
        )
        .where("r.STATUS", "Requested")
        .andWhere("r.FK_SCHOOL_ID", schoolId)
        .orderBy("r.PK_RESERVATION_ID", "ASC")
        .orderBy("em.MODEL_NAME", "ASC")
        .orderBy("et.TYPE_NAME", "ASC");
    } else {
      /** Get reservations for non-student users */
      requestedReservationList = await db("reservation AS r")
        .select(
          "r.PK_RESERVATION_ID AS reservationId",
          "r.START_DATE AS startDate",
          "r.END_DATE AS endDate",
          "r.STATUS AS status",
          "re.QUANTITY AS itemQuantity",
          "em.MODEL_NAME AS modelName",
          "em.PK_MODEL_ID AS modelId",
          "em.MODEL_PHOTO_URL AS modelPhoto",
          "et.TYPE_NAME AS typeName",
          "ui.FIRST_NAME AS renterFirstName",
          "ui.MIDDLE_NAME AS renterMiddleName",
          "ui.LAST_NAME AS renterLastName"
        )
        .leftJoin(
          "reserved_equipment AS re",
          "r.PK_RESERVATION_ID",
          "re.FK_RESERVATION_ID"
        )
        .leftJoin(
          "equipment_model AS em",
          "re.FK_EQUIPMENT_MODEL_ID",
          "em.PK_MODEL_ID"
        )
        .leftJoin(
          "equipment_type AS et",
          "re.FK_EQUIPMENT_TYPE_ID",
          "et.PK_TYPE_ID"
        )
        .leftJoin(
          "user_info AS ui",
          "r.FK_SCHOOL_ID",
          "ui.SCHOOL_ID"
        )
        .where("r.STATUS", "Requested")
        .orderBy("r.PK_RESERVATION_ID", "ASC")
        .orderBy("em.MODEL_NAME", "ASC")
        .orderBy("et.TYPE_NAME", "ASC");
    }

    /** If the user haven't make any reservation */
    if (requestedReservationList && requestedReservationList.length === 0) {
      return responseBuilder.BuildResponse(response, 200, {
        message: "You haven't make any reservation yet.",
      });
    }

    /** Group reservations by reservation ID */
    const groupedReservations = {};
    requestedReservationList.forEach((reservation) => {
      const {
        reservationId,
        startDate,
        endDate,
        status,
        renterFirstName,
        renterLastName,
        renterMiddleName,
        modelName,
        modelId,
        modelPhoto,
        typeName,
        itemQuantity,
      } = reservation;
      /** Create or update reservation grouping */
      if (!groupedReservations[reservationId]) {
        if(user.userRole === "Student") {
          groupedReservations[reservationId] = {
            reservationId,
            startDate,
            endDate,
            status,
            totalItems: itemQuantity,
            items: [],
          };
        } else {
          let renterName = `${renterLastName}, ${renterFirstName}`;
          if (renterMiddleName) {
              renterName += ` ${renterMiddleName}`;
          }
          
          groupedReservations[reservationId] = {
              reservationId,
              startDate,
              endDate,
              status,
              renterName,
              totalItems: itemQuantity,
              items: [],
          };
        }
      } else {
        groupedReservations[reservationId].totalItems += itemQuantity;
      }
      /** Add reservation item details to the grouping */
      groupedReservations[reservationId].items.push({
        modelName,
        modelId,
        modelPhoto,
        typeName,
        itemQuantity,
      });
    });

    /**  Convert grouped reservations into an array and apply sorting logic */
    const result = Object.values(groupedReservations);
    result.sort((a, b) => {
      const aStartDate = new Date(a.startDate);
      const bStartDate = new Date(b.startDate);
      const currentDate = new Date();

      /** Calculate the differences in days between dates */
      const aFutureDiff = Math.abs(aStartDate - currentDate);
      const bFutureDiff = Math.abs(bStartDate - currentDate);

      /** Check if reservation a is current, future, or past */
      const aIsCurrent =
        aStartDate <= currentDate && currentDate <= new Date(a.endDate);
      const aIsFuture = aStartDate > currentDate;
      const aIsPast = new Date(a.endDate) < currentDate;

      /** Check if reservation b is current, future, or past */
      const bIsCurrent =
        bStartDate <= currentDate && currentDate <= new Date(b.endDate);
      const bIsFuture = bStartDate > currentDate;
      const bIsPast = new Date(b.endDate) < currentDate;

      /** Sorting logic based on the status of reservations */

      /** a is current, b is not */
      if (aIsCurrent && !bIsCurrent) return -1;

      /** b is current, a is not */
      if (!aIsCurrent && bIsCurrent) return 1;

      /** a is future, b is not */
      if (aIsFuture && !bIsFuture) return -1;

      /** b is future, a is not */
      if (!aIsFuture && bIsFuture) return 1;

      /** If both have the same status, prioritize by the difference in days */
      if (aIsFuture && bIsFuture) return aFutureDiff - bFutureDiff;

      /** For past reservations, prioritize by the closest past date compared to today's date */
      if (aIsPast && !bIsPast) return -1;
      if (!aIsPast && bIsPast) return 1;

      /** If both have the same status and are not current or future, prioritize by start date */
      return bStartDate - aStartDate;
    });

    /** Return response */
    return responseBuilder.GetSuccessful(
      response,
      result,
      "Requested reservation"
    );
  } catch (error) {
    /** If error, log error and return 503 */
    console.log(
      `ERROR: There is an error occur while retrieving ${userId}'s requested reservation:`,
      error
    );
    return responseBuilder.ServerError(
      response,
      `Sorry, there is an error occur while retrieving your requested reservation list.`
    );
  }
}

/** Exports the modules */
module.exports = {
  GetRequestedReservation,
};
