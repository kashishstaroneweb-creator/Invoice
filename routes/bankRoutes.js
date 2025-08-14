const express = require("express");
const router = express.Router();
const bankController = require("../controllers/bankController");
const userController = require("../controllers/userController");

// Protected routes requiring authentication
router.post("/", userController.protect, bankController.addBank);
router.get("/", userController.protect, bankController.getAllBanks);
router.get("/:id", userController.protect, bankController.getBankById);
router.put("/:id", userController.protect, bankController.updateBank);
router.delete("/:id", userController.protect, bankController.deleteBank);

module.exports = router;