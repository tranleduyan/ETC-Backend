// /**
//  * This function is used to remove an item from the database
//  * @param {object} db - the knex object configurations, allow us to open connection and communicate with mysql. 
//  * @param {string} equipment_name - the  name of the item we want to delete from database
//  * @returns {object} removedItem -the object including the added type's information.
//  */
// async function RemoveItemFromDatabase(db, equipment_name) {
//     try {
//         /** delete the item from the database and send a confirmation */
//         const [typeId] = await db('equipment_type').insert({ TYPE_NAME: equipment_name });

//         /** Retrieve the inserted type information using the type ID */
//         const addedType = await db('equipment_type').select(
//             'PK_TYPE_ID',
//             'TYPE_NAME'
//         ).where('PK_TYPE_ID', '=', typeId).first();

//         /** The new added type object */
//         const responseObject = {
//             typeId: addedType.PK_TYPE_ID,
//             typeName: addedType.TYPE_NAME,
//         }

//         /** Return the response object */
//         return responseObject;
//     } catch (error) {
//         /** Log the error for debugging */
//         console.log("ERROR: There is an error while removing item from the database: ", error);
//         /** Return error message string */
//         return "There is an error occur while removing item."
//     }
// }