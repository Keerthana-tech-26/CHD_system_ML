const express = require("express");
const router = express.Router();
const { getAllPatients } = require("../controllers/patientController.js");

router.get("/", getAllPatients);

module.exports = router;
