const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const userController = require("../controllers/userController");

// Protected routes (require JWT authentication)
router.post("/", userController.protect, invoiceController.createInvoice);
router.get("/", userController.protect, invoiceController.getAllInvoices);
router.get("/:id", userController.protect, invoiceController.getInvoiceById);
router.put("/:id", userController.protect, invoiceController.updateInvoice);
router.delete("/:id", userController.protect, invoiceController.deleteInvoice);
router.post("/:id/email", userController.protect, invoiceController.emailInvoice);

module.exports = router;