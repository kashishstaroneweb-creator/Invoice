const mongoose = require("mongoose");

const bankDetailSchema = new mongoose.Schema({
    bankName: {
        type: String,
        required: [true, "Bank name is required"],
        trim: true,
        minlength: [3, "Bank name must be at least 3 characters"],
        maxlength: [100, "Bank name cannot exceed 100 characters"]
    },
    accountName: {
        type: String,
        required: [true, "Account name is required"],
        trim: true,
        minlength: [3, "Account name must be at least 3 characters"],
        maxlength: [100, "Account name cannot exceed 100 characters"]
    },
    accountHolder: {
        type: String,
        required: [true, "Account holder name is required"],
        trim: true,
        minlength: [3, "Account holder name must be at least 3 characters"],
        maxlength: [100, "Account holder name cannot exceed 100 characters"]
    },
    ifscCode: {
        type: String,
        required: [true, "IFSC code is required"],
        trim: true,
        match: [/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("BankDetail", bankDetailSchema);