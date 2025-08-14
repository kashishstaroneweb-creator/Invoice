const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
    invoiceSuffix: {
        type: String,
        required: [true, "Invoice suffix is required"],
        unique: true,
        trim: true,
        minlength: [3, "Invoice suffix must be at least 3 characters"],
        maxlength: [20, "Invoice suffix cannot exceed 20 characters"]
    },
    stampImage: {
        type: String,
        default: null
    },
    signatureImage: {
        type: String,
        default: null
    },
    logoImage: {
        type: String,
        default: null
    },
    signatoryName: {
        type: String,
        required: [true, "Signatory name is required"],
        trim: true,
        minlength: [3, "Signatory name must be at least 3 characters"],
        maxlength: [100, "Signatory name cannot exceed 100 characters"]
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: [true, "Company ID is required"]
    },
    bankId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "BankDetail",
        required: [true, "Bank ID is required"]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Settings", settingsSchema);