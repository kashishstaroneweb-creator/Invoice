const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// Public Routes (no token needed)
router.post("/signup", userController.createUser); // Create a user
router.post("/login", userController.loginUser); // Login

// Protected Routes (need token)
router.get("/", userController.protect, userController.restrictToAdmin, userController.getAllUsers); // Get all users (admin only)
router.get("/:id", userController.protect, userController.getUserById); // Get one user
router.put("/:id", userController.protect, userController.updateUser); // Update user
router.delete("/:id", userController.protect, userController.restrictToAdmin, userController.deleteUser); // Delete user (admin only)
router.post("/logout", userController.logoutUser); // Logout

module.exports = router;