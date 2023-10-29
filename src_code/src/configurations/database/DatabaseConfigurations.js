/** Don't make or push any changes on this configuration file, especially when you're change developing environment */

/** Initialize Knex */
const knex = require("knex");

const config = {
  client: "mysql",
  connection: {
    host: "",
    user: "",
    password: "",
    database: "",
  },
}; // Config for deploy

const db = knex(config);

/** Export db object that already config */
module.exports = db;