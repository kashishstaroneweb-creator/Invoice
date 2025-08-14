const Client = require("../models/Client");

// Add a new client
exports.createClient = async (req, res) => {
    try {
        const { companyName, phoneNumber, email, address, gstNumber, isRecurrent } = req.body;

        // Validate required fields
        if (!companyName || !phoneNumber || !email || !address || !gstNumber) {
            return res.status(400).json({ error: "All required fields (companyName, phoneNumber, email, address, gstNumber) must be provided" });
        }

        const client = new Client({ companyName, phoneNumber, email, address, gstNumber, isRecurrent });
        const savedClient = await client.save();
        res.status(201).json({
            message: "Client created successfully",
            client: savedClient
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Get all clients
exports.getAllClients = async (req, res) => {
    try {
        const clients = await Client.find();
        res.status(200).json({
            message: "Clients retrieved successfully",
            clients
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single client by ID (View)
exports.getClientById = async (req, res) => {
    try {
        const client = await Client.findById(req.params.id);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }
        res.status(200).json({
            message: "Client retrieved successfully",
            client
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a client
exports.updateClient = async (req, res) => {
    try {
        const { companyName, phoneNumber, email, address, gstNumber, isRecurrent } = req.body;

        // Validate required fields
        if (!companyName || !phoneNumber || !email || !address || !gstNumber) {
            return res.status(400).json({ error: "All required fields (companyName, phoneNumber, email, address, gstNumber) must be provided" });
        }

        const updatedClient = await Client.findByIdAndUpdate(
            req.params.id,
            { companyName, phoneNumber, email, address, gstNumber, isRecurrent },
            { new: true }
        );

        if (!updatedClient) {
            return res.status(404).json({ error: "Client not found" });
        }

        res.status(200).json({
            message: "Client updated successfully",
            client: updatedClient
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// Delete a client
exports.deleteClient = async (req, res) => {
    try {
        const client = await Client.findByIdAndDelete(req.params.id);
        if (!client) {
            return res.status(404).json({ error: "Client not found" });
        }
        res.status(200).json({ message: "Client deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};