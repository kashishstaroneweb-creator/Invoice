const express = require("express");
const router = express.Router();
const clientController = require("../controllers/clientController");
const userController = require("../controllers/userController");

// Protected routes (require JWT authentication)
router.post("/", userController.protect, clientController.createClient); // Add client
router.get("/", userController.protect, clientController.getAllClients); // Get all clients
router.get("/:id", userController.protect, clientController.getClientById); // View single client
router.put("/:id", userController.protect, clientController.updateClient); // Update client
router.delete("/:id", userController.protect, clientController.deleteClient); // Delete client

module.exports = router;