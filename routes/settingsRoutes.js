const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/settingsController");
const userController = require("../controllers/userController");
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;

// Ensure upload directories exist
const ensureDir = async (dir) => {
    try {
        await fs.mkdir(dir, { recursive: true });
    } catch (err) {
        console.error(`Failed to create directory ${dir}: ${err.message}`);
    }
};

const stampDir = path.join(__dirname, "../../Uploads/stamp");
const signatureDir = path.join(__dirname, "../../Uploads/signature");
const logoDir = path.join(__dirname, "../../Uploads/logo");
ensureDir(stampDir);
ensureDir(signatureDir);
ensureDir(logoDir);

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === "stampImage") {
            cb(null, stampDir);
        } else if (file.fieldname === "signatureImage") {
            cb(null, signatureDir);
        } else if (file.fieldname === "logoImage") {
            cb(null, logoDir);
        }
    },
    filename: (req, file, cb) => {
        const sanitizedFileName = file.originalname.replace(/[\s()]/g, "_");
        cb(null, `${Date.now()}-${sanitizedFileName}`);
    }
});

// Multer upload configuration
const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ["image/png", "image/jpeg"];
        if (!allowedTypes.includes(file.mimetype)) {
            return cb(new Error("Only PNG or JPEG images are allowed."));
        }
        cb(null, true);
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
}).fields([
    { name: "stampImage", maxCount: 1 },
    { name: "signatureImage", maxCount: 1 },
    { name: "logoImage", maxCount: 1 }
]);

// Middleware to handle file upload errors
const handleUploadErrors = (req, res, next) => {
    if (req.fileValidationError) {
        return res.status(400).json({ message: "File upload error.", error: req.fileValidationError.message });
    }
    next();
};

// Protected routes
router.post("/", userController.protect, upload, handleUploadErrors, settingsController.addSettings);
router.get("/", userController.protect, settingsController.getSettings);
router.put("/:id", userController.protect, upload, handleUploadErrors, settingsController.updateSettings);
router.delete("/:id", userController.protect, settingsController.deleteSettings);
router.get("/details", userController.protect, settingsController.getCompanyAndBankDetails); // New endpoint

module.exports = router;