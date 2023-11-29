/** Initialize neccessary modules */
const express = require("express");
const cors = require("cors");
const app = express();

/** Use cors */
app.use(cors());

/** Parse JSON request body */
app.use(express.json());

/** Import routes */
const authenticationRoutes = require('../src/routes/AuthenticationRoutes');

/** Define the port */
const PORT = 5000;

/** Use the routes (Middleware) */
app.use("/api/authentication", authenticationRoutes);

/** Start the server */
app.listen(PORT, (err) => {
  if (err) {
    console.error("ERROR STARTING SERVER DUE TO: ", err);
  } else {
    console.log(`SERVER IS RUNNING ON PORT ${PORT}.`);
  }
});

module.exports = app;
