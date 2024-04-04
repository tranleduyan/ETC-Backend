/** Initialize necessary modules */
const userDBHelperFunctions = require("../user/UserDBHelperFunctions");

/**
 * Retrieves reservation information by reservation ID.
 * @param {Object} db - The database connection object.
 * @param {number} reservationId - The ID of the reservation to retrieve information for.
 * @returns {Promise<Object|null|string>} - A promise that resolves to the reservation information if found,
 * null if no reservation is found, or an error message if an error occurs.
 */

async function GetReservationInformationById(db, reservationId) {
  try {
    const reservation = await db("reservation")
      .select(
        "STATUS AS status",
        "RESPONDER AS responder",
        "FK_SCHOOL_ID AS schoolId"
      )
      .where("PK_RESERVATION_ID", "=", reservationId)
      .first();

    if (!reservation) {
      return null;
    }

    return reservation;
  } catch (error) {
    console.log(
      "ERROR: There is an error while retrieving reservation information."
    );
    return "There is an error while retrieving reservation information.";
  }
}

/**
 * Retrieves a list of approved reservations for a given school ID.
 * @param {Object} db - The database connection object.
 * @param {string} schoolId - The ID of the school to retrieve approved reservations for.
 * @returns {Promise<Array<Object>|null|string>} - A promise that resolves to an array of approved reservations
 * if found, null if no reservations are found, or an error message if an error occurs.
 */
async function GetApprovedReservationList(db, schoolId) {
  try {
    /** Retrieve user information based on school ID */
    const user = await userDBHelperFunctions.GetUserInfoBySchoolId(
      db,
      schoolId
    );

    let approveReservationList = null;

    /** Check user role to determine the query for reservations */
    if (user.userRole === "Student") {
      /** Get approved reservations for student users */
      approveReservationList = await db("reservation AS r")
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
          "r.FK_SCHOOL_ID AS renterSchoolId",
          "r.RESPONDER AS approveBy"
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
        .leftJoin("user_info AS ui", "r.FK_SCHOOL_ID", "ui.SCHOOL_ID")
        .where("r.STATUS", "Approved")
        .andWhere("r.FK_SCHOOL_ID", schoolId)
        .orderBy("r.PK_RESERVATION_ID", "ASC")
        .orderBy("em.MODEL_NAME", "ASC")
        .orderBy("et.TYPE_NAME", "ASC");
    } else {
      /** Get reservations for non-student users */
      approveReservationList = await db("reservation AS r")
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
          "ui.LAST_NAME AS renterLastName",
          "r.FK_SCHOOL_ID AS renterSchoolId",
          "r.RESPONDER AS approveBy"
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
        .leftJoin("user_info AS ui", "r.FK_SCHOOL_ID", "ui.SCHOOL_ID")
        .where("r.STATUS", "Approved")
        .orderBy("r.PK_RESERVATION_ID", "ASC")
        .orderBy("em.MODEL_NAME", "ASC")
        .orderBy("et.TYPE_NAME", "ASC");
    }

    /** If the user don't have any approved reservation */
    if (approveReservationList && approveReservationList.length === 0) {
      return null;
    }

    /** Group reservations by reservation ID */
    const groupedReservations = {};
    approveReservationList.forEach((reservation) => {
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
        renterSchoolId,
        approveBy,
      } = reservation;
      /** Create or update reservation grouping */
      if (!groupedReservations[reservationId]) {
        if (user.userRole === "Student") {
          groupedReservations[reservationId] = {
            reservationId,
            startDate,
            endDate,
            status,
            renterSchoolId,
            totalItems: itemQuantity,
            approvedBy: approveBy ? approveBy : "Anonymous",
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
            renterSchoolId,
            approvedBy: approveBy ? approveBy : "Anonymous",
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

    return result;
  } catch (error) {
    console.log(
      "ERROR: There is an error while retrieving user reservation list:",
      error
    );
    return "There is an error while retrieving your approved reservation list.";
  }
}

/**
 * Retrieves a list of requested reservations for a given school ID.
 * @param {Object} db - The database connection object.
 * @param {string} schoolId - The ID of the school to retrieve requested reservations for.
 * @returns {Promise<Array<Object>|null|string>} - A promise that resolves to an array of requested reservations
 * if found, null if no reservations are found, or an error message if an error occurs.
 */
async function GetRequestedReservationList(db, schoolId) {
  try {
    /** Retrieve user information based on school ID */
    const user = await userDBHelperFunctions.GetUserInfoBySchoolId(
      db,
      schoolId
    );

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
          "et.TYPE_NAME AS typeName",
          "r.FK_SCHOOL_ID AS renterSchoolId"
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
        .leftJoin("user_info AS ui", "r.FK_SCHOOL_ID", "ui.SCHOOL_ID")
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
          "ui.LAST_NAME AS renterLastName",
          "r.FK_SCHOOL_ID AS renterSchoolId"
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
        .leftJoin("user_info AS ui", "r.FK_SCHOOL_ID", "ui.SCHOOL_ID")
        .where("r.STATUS", "Requested")
        .orderBy("r.PK_RESERVATION_ID", "ASC")
        .orderBy("em.MODEL_NAME", "ASC")
        .orderBy("et.TYPE_NAME", "ASC");
    }

    /** If the user haven't make any reservation */
    if (requestedReservationList && requestedReservationList.length === 0) {
      return null;
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
        renterSchoolId,
      } = reservation;
      /** Create or update reservation grouping */
      if (!groupedReservations[reservationId]) {
        if (user.userRole === "Student") {
          groupedReservations[reservationId] = {
            reservationId,
            startDate,
            endDate,
            status,
            renterSchoolId,
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
            renterSchoolId,
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

    return result;
  } catch (error) {
    console.log(
      "ERROR: There is an error occur while retrieving user requested reservation list:",
      error
    );
    return `Sorry, there is an error occur while retrieving your requested reservation list.`;
  }
}

/** Export the modules */
module.exports = {
  GetReservationInformationById,
  GetApprovedReservationList,
  GetRequestedReservationList,
};
