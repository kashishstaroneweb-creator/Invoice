const Settings = require("../models/Settings");
const Company = require("../models/Company");
const BankDetail = require("../models/BankDetail");
const fs = require("fs").promises;
const path = require("path");

// Helper function to delete file
const deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (err) {
        console.warn(`Failed to delete file: ${err.message}`);
    }
};

// Add new settings (only one allowed)
exports.addSettings = async (req, res) => {
    try {
        // Check if settings already exist
        const existingSettings = await Settings.findOne();
        if (existingSettings) {
            return res.status(400).json({ message: "Settings already exist. Update the existing settings instead." });
        }

        // Validate required fields
        const { invoiceSuffix, signatoryName, companyId, bankId } = req.body;
        if (!invoiceSuffix || !signatoryName || !companyId || !bankId) {
            return res.status(400).json({ message: "Missing required fields: invoiceSuffix, signatoryName, companyId, bankId." });
        }

        // Validate company and bank references
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(400).json({ message: "Invalid companyId. Company does not exist." });
        }
        const bank = await BankDetail.findById(bankId);
        if (!bank) {
            return res.status(400).json({ message: "Invalid bankId. Bank detail does not exist." });
        }

        // Create new settings
        const settingsData = { invoiceSuffix, signatoryName, companyId, bankId };
        if (req.files) {
            if (req.files.stampImage) settingsData.stampImage = req.files.stampImage[0].filename;
            if (req.files.signatureImage) settingsData.signatureImage = req.files.signatureImage[0].filename;
            if (req.files.logoImage) settingsData.logoImage = req.files.logoImage[0].filename;
        }

        const settings = new Settings(settingsData);
        const savedSettings = await settings.save();

        res.status(201).json({
            message: "Settings created successfully.",
            data: savedSettings
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to create settings.", error: error.message });
    }
};

// Get settings
exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.findOne()
            .populate("companyId", "companyName address phoneNumber gstNumber panNumber")
            .populate("bankId", "bankName accountName accountHolder ifscCode");
        if (!settings) {
            return res.status(404).json({ message: "No settings found." });
        }
        res.status(200).json({
            message: "Settings retrieved successfully.",
            data: settings
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve settings.", error: error.message });
    }
};

// Update settings
exports.updateSettings = async (req, res) => {
    try {
        const settingsId = req.params.id;
        const existingSettings = await Settings.findById(settingsId);
        if (!existingSettings) {
            return res.status(404).json({ message: "Settings not found." });
        }

        // Validate required fields
        const { invoiceSuffix, signatoryName, companyId, bankId } = req.body;
        if (!invoiceSuffix || !signatoryName || !companyId || !bankId) {
            return res.status(400).json({ message: "Missing required fields: invoiceSuffix, signatoryName, companyId, bankId." });
        }

        // Validate company and bank references if provided
        if (companyId) {
            const company = await Company.findById(companyId);
            if (!company) {
                return res.status(400).json({ message: "Invalid companyId. Company does not exist." });
            }
        }
        if (bankId) {
            const bank = await BankDetail.findById(bankId);
            if (!bank) {
                return res.status(400).json({ message: "Invalid bankId. Bank detail does not exist." });
            }
        }

        // Prepare update data
        const updateData = { invoiceSuffix, signatoryName, companyId, bankId };
        if (req.files) {
            // Handle stamp image
            if (req.files.stampImage) {
                if (existingSettings.stampImage) {
                    await deleteFile(path.join(__dirname, "../../Uploads/stamp", existingSettings.stampImage));
                }
                updateData.stampImage = req.files.stampImage[0].filename;
            }
            // Handle signature image
            if (req.files.signatureImage) {
                if (existingSettings.signatureImage) {
                    await deleteFile(path.join(__dirname, "../../Uploads/signature", existingSettings.signatureImage));
                }
                updateData.signatureImage = req.files.signatureImage[0].filename;
            }
            // Handle logo image
            if (req.files.logoImage) {
                if (existingSettings.logoImage) {
                    await deleteFile(path.join(__dirname, "../../Uploads/logo", existingSettings.logoImage));
                }
                updateData.logoImage = req.files.logoImage[0].filename;
            }
        }

        const updatedSettings = await Settings.findByIdAndUpdate(settingsId, updateData, { new: true, runValidators: true })
            .populate("companyId", "companyName address phoneNumber gstNumber panNumber")
            .populate("bankId", "bankName accountName accountHolder ifscCode");

        res.status(200).json({
            message: "Settings updated successfully.",
            data: updatedSettings
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update settings.", error: error.message });
    }
};

// Delete settings
exports.deleteSettings = async (req, res) => {
    try {
        const settingsId = req.params.id;
        const settings = await Settings.findById(settingsId);
        if (!settings) {
            return res.status(404).json({ message: "Settings not found." });
        }

        // Delete associated files
        if (settings.stampImage) {
            await deleteFile(path.join(__dirname, "../../Uploads/stamp", settings.stampImage));
        }
        if (settings.signatureImage) {
            await deleteFile(path.join(__dirname, "../../Uploads/signature", settings.signatureImage));
        }
        if (settings.logoImage) {
            await deleteFile(path.join(__dirname, "../../Uploads/logo", settings.logoImage));
        }

        await Settings.findByIdAndDelete(settingsId);
        res.status(200).json({ message: "Settings deleted successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete settings.", error: error.message });
    }
};

// New endpoint to fetch company and bank details by IDs
exports.getCompanyAndBankDetails = async (req, res) => {
    try {
        const { companyId, bankId } = req.query;

        // Validate required query parameters
        if (!companyId || !bankId) {
            return res.status(400).json({ message: "Missing required query parameters: companyId, bankId." });
        }

        // Validate company
        const company = await Company.findById(companyId).select("companyName address phoneNumber gstNumber panNumber");
        if (!company) {
            return res.status(400).json({ message: "Invalid companyId. Company does not exist." });
        }

        // Validate bank
        const bank = await BankDetail.findById(bankId).select("bankName accountName accountHolder ifscCode");
        if (!bank) {
            return res.status(400).json({ message: "Invalid bankId. Bank detail does not exist." });
        }

        // Prepare response data
        const responseData = {
            company: {
                companyName: company.companyName,
                address: company.address,
                phoneNumber: company.phoneNumber,
                gstNumber: company.gstNumber,
                panNumber: company.panNumber || null // Include PAN only if provided
            },
            bank: {
                bankName: bank.bankName,
                accountName: bank.accountName,
                accountHolder: bank.accountHolder,
                ifscCode: bank.ifscCode
            }
        };

        res.status(200).json({
            message: "Company and bank details retrieved successfully.",
            data: responseData
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to retrieve company and bank details.", error: error.message });
    }
};