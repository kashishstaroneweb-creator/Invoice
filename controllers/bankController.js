const BankDetail = require("../models/BankDetail");
const Settings = require("../models/Settings");

// Add new bank detail
exports.addBank = async (req, res) => {
    try {
        const bank = new BankDetail(req.body);
        const savedBank = await bank.save();
        res.status(201).json({
            message: "Bank detail created successfully",
            data: savedBank
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to create bank detail",
            error: err.message
        });
    }
};

// Get all bank details
exports.getAllBanks = async (req, res) => {
    try {
        const banks = await BankDetail.find().select("-__v");
        res.status(200).json({
            message: "Bank details retrieved successfully",
            data: banks
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to retrieve bank details",
            error: err.message
        });
    }
};

// Get bank detail by ID
exports.getBankById = async (req, res) => {
    try {
        const bank = await BankDetail.findById(req.params.id).select("-__v");
        if (!bank) {
            return res.status(404).json({
                message: "Bank detail not found"
            });
        }
        res.status(200).json({
            message: "Bank detail retrieved successfully",
            data: bank
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to retrieve bank detail",
            error: err.message
        });
    }
};

// Update bank detail
exports.updateBank = async (req, res) => {
    try {
        const bank = await BankDetail.findById(req.params.id);
        if (!bank) {
            return res.status(404).json({
                message: "Bank detail not found"
            });
        }
        const updatedBank = await BankDetail.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).select("-__v");
        res.status(200).json({
            message: "Bank detail updated successfully",
            data: updatedBank
        });
    } catch (err) {
        res.status(400).json({
            message: "Failed to update bank detail",
            error: err.message
        });
    }
};

// Delete bank detail
exports.deleteBank = async (req, res) => {
    try {
        const bank = await BankDetail.findById(req.params.id);
        if (!bank) {
            return res.status(404).json({
                message: "Bank detail not found"
            });
        }
        // Check if bank is used in settings
        const settings = await Settings.findOne({ bankId: req.params.id });
        if (settings) {
            return res.status(400).json({
                message: "Cannot delete bank detail as it is used in settings"
            });
        }
        await BankDetail.findByIdAndDelete(req.params.id);
        res.status(200).json({
            message: "Bank detail deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: "Failed to delete bank detail",
            error: err.message
        });
    }
};