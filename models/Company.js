const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
    companyName: { type: String, required: [true, "Company name is required"] },
    address: { type: String, required: [true, "Address is required"] },
    phoneNumber: { type: String, required: [true, "Phone number is required"] },
    gstNumber: { type: String, required: [true, "GST number is required"] },
    panNumber: { type: String } // Optional field
}, {
    timestamps: true // Adds createdAt and updatedAt fields
});

module.exports = mongoose.model("Company", companySchema);