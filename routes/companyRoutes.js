const express = require("express");
const router = express.Router();
const companyController = require("../controllers/companyController");
const userController = require("../controllers/userController");

// Protected routes (require JWT authentication)
router.post("/", userController.protect, companyController.addCompany); // Add company
router.get("/", userController.protect, companyController.getAllCompanies); // Get all companies
router.get("/:id", userController.protect, companyController.getCompanyById); // View single company
router.put("/:id", userController.protect, companyController.updateCompany); // Update company
router.delete("/:id", userController.protect, companyController.deleteCompany); // Delete company

module.exports = router;