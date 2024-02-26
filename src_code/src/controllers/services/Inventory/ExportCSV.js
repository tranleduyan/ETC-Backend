/** Initialize neccessary modules */
const responseBuilder = require("../../../utils/interfaces/IResponseBuilder");
const db = require("../../../configurations/database/DatabaseConfigurations");
const genHelper = require("../../../utils/interfaces/IHelperFunctions");

/**
 * Handle inventory export csv by administrator.
 *
 * @param {object} req - The request object for the HTTP request.
 * @param {object} res - The response object for the HTTP request.
 * @returns {object} - This response object indicates the export of equipment data.
 * 
 * Expected Request Body: 
 * {
 *      "schoolId": "810922119"
 * }
 * 
 * Response is the message with status code 200 if successful.
 * Else return a server error of status code 503 (see ResponsiveBuilder.js)
 */
async function ExportCSV(req, res) {
    try {
        /** Assuming the school ID is provided in the request body */
        const { schoolId } = req.body; 

        /** Validate the user */
        const userValidationMessage = await Promise.resolve(genHelper.ValidateAdminUser(schoolId));
        if (userValidationMessage) {
            return responseBuilder.BadRequest(res, userValidationMessage);
        }

        /** Fetch inventory data from the database */
        const inventoryData = await Promise.resolve(db("equipment")
            .select(
                "equipment.*",
                "equipment_type.TYPE_NAME as type_name",
                "equipment_model.MODEL_NAME as model_name"
            )
            .leftJoin("equipment_type", "equipment.FK_TYPE_ID", "equipment_type.PK_TYPE_ID")
            .leftJoin("equipment_model", "equipment.FK_MODEL_ID", "equipment_model.PK_MODEL_ID")
        );

        /** Validate the fetched inventory data */
        const validationError = await Promise.resolve(ValidateItems(inventoryData));
        if (validationError) {
            return responseBuilder.MissingContent(res, validationError);
        }

        /** Define headers for the CSV */
        const headers = [
            "Serial ID",
            "Type Name",
            "Model Name",
            "Current Room Reader ID",
            "Tag ID",
            "Maintenance Status",
            "Reservation Status",
            "Usage Condition",
            "Purchase Cost",
            "Purchase Date"
        ].join(',');

        /** Format inventory data into CSV format */
        const csvData = inventoryData.map(item => {
            const csvRow = [
                item['PK_EQUIPMENT_SERIAL_ID'],
                item['type_name'],
                item['model_name'],
                item['FK_CURRENT_ROOM_READER_ID'],
                item['TAG_ID'],
                item['MAINTENANCE_STATUS'],
                item['RESERVATION_STATUS'],
                item['USAGE_CONDITION'],
                item['PURCHASE_COST'],
                item['PURCHASE_DATE']
            ].map(value => value === null ? "null" : value);
            /** Join values into CSV string */
            return csvRow.join(',');
        }).join('\n');

        /** Write CSV data (including headers) to a file */
        const fullCsvData = `${headers}\n${csvData}`;

        /** Set response headers for CSV download */
        res.setHeader('Content-Disposition', 'attachment; filename="data.csv"');
        res.setHeader('Content-Type', 'text/csv');

        /** Send CSV data as response */
        res.status(200).send(fullCsvData);
    } catch (error) {
        /** Log error and return 503 */
        console.log("ERROR: There is an error while exporting CSV.", error);
        return responseBuilder.ServerError(res, "There is an error while exporting CSV.");
    }
}

/**
 * Validates an array of equipment items.
 *
 * @param {Array} items - An array of equipment items to be validated.
 * @returns {string|null} - A validation error message if validation fails,
 *                          or null if the validation is successful.
 */
async function ValidateItems(items) {
    try {
        /** Check if inventory data is empty */
        if (!items || items.length === 0) {
            return "Inventory data is empty.";
        }

        /** Define an array of fields that are not required (can be null) */
        const nullableFields = [
            "PK_EQUIPMENT_SERIAL_ID",
            "TYPE_NAME", 
            "MODEL_NAME",
            "FK_CURRENT_ROOM_READER_ID",
            "TAG_ID",
            "MAINTENANCE_STATUS",
            "RESERVATION_STATUS",
            "USAGE_CONDITION",
            "PURCHASE_COST",
            "PURCHASE_DATE"
        ];

        /** Check for missing required fields in each item */
        for (const item of items) {
            for (const [field, value] of Object.entries(item)) {
                /** Skip validation for fields that are nullable */
                if (nullableFields.includes(field)) {
                    continue;
                }
                /** Check if the field value is null */
                if (value === null) {
                    console.log(`Field '${field}' is null in the inventory data.`);
                    return `Field '${field}' is null in the inventory data.`;
                }
            }
        }

        /** Return null to indicate items are valid */
        return null;
    } catch (error) {
        /** display error */
        console.error('Error validating items:', error);
    }
}

/** Export the functions */
module.exports = {
    ExportCSV
};
