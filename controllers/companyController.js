const Company = require("../models/Company");
const Settings = require("../models/Settings");

// Add a new company
exports.addCompany = async (req, res) => {
    try {
        const { companyName, address, phoneNumber, gstNumber, panNumber } = req.body;

        // Validate required fields
        if (!companyName || !address || !phoneNumber || !gstNumber) {
            return res.status(400).json({ error: "All required fields (companyName, address, phoneNumber, gstNumber) must be provided" });
        }

        const company = new Company({ companyName, address, phoneNumber, gstNumber, panNumber });
        const savedCompany = await company.save();
        res.status(201).json({
            message: "Company created successfully",
            company: savedCompany
        });
    } catch (error) {
        res.status(400).json({ error: "Failed to create company: " + error.message });
    }
};

// Get all companies
exports.getAllCompanies = async (req, res) => {
    try {
        const companies = await Company.find();
        res.status(200).json({
            message: "Companies retrieved successfully",
            companies
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve companies: " + error.message });
    }
};

// Get a single company by ID (View)
exports.getCompanyById = async (req, res) => {
    try {
        const company = await Company.findById(req.params.id);
        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }
        res.status(200).json({
            message: "Company retrieved successfully",
            company
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve company: " + error.message });
    }
};

// Update a company
exports.updateCompany = async (req, res) => {
    try {
        // Avoid destructuring directly to prevent undefined errors
        const body = req.body;

        // Validate required fields
        const requiredFields = ['companyName', 'address', 'phoneNumber', 'gstNumber'];
        const missingFields = requiredFields.filter(field => !body[field]);

        if (missingFields.length > 0) {
            return res.status(400).json({
                error: `Missing required fields: ${missingFields.join(', ')}. Ensure all fields are provided with correct names.`
            });
        }

        const { companyName, address, phoneNumber, gstNumber, panNumber } = body;

        const updatedCompany = await Company.findByIdAndUpdate(
            req.params.id,
            { companyName, address, phoneNumber, gstNumber, panNumber },
            { new: true }
        );

        if (!updatedCompany) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.status(200).json({
            message: "Company updated successfully",
            company: updatedCompany
        });
    } catch (error) {
        res.status(400).json({ error: "Failed to update company: " + error.message });
    }
};

// Delete a company
exports.deleteCompany = async (req, res) => {
    try {
        const companyId = req.params.id;
        // Check if company is used in settings
        const settings = await Settings.findOne({ companyId });
        if (settings) {
            return res.status(400).json({ error: "Cannot delete company as it is used in settings" });
        }

        const company = await Company.findByIdAndDelete(companyId);
        if (!company) {
            return res.status(404).json({ error: "Company not found" });
        }

        res.status(200).json({ message: "Company deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete company: " + error.message });
    }
};