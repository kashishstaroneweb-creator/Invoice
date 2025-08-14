const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: [true, "Invoice number is required"],
        unique: true
    },
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Client",
        required: [true, "Client ID is required"]
    },
    description: {
        type: String,
        required: [true, "Description is required"],
        trim: true
    },
    amount: {
        type: Number,
        required: [true, "Amount is required"],
        min: [0, "Amount must be non-negative"]
    },
    currency: {
        type: String,
        enum: ["INR", "USD"],
        default: "INR"
    },
    taxType: {
        type: String,
        enum: ["IGST", "CGST+SGST", "NONE"],
        default: "CGST+SGST"
    },
    igst: {
        type: Number,
        default: 18
    },
    cgst: {
        type: Number,
        default: 9
    },
    sgst: {
        type: Number,
        default: 9
    },
    totalAmount: {
        type: Number,
        required: [true, "Total amount is required"],
        min: [0, "Total amount must be non-negative"]
    },
    date: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ["Paid", "Unpaid"],
        default: "Unpaid"
    },
    comments: {
        type: String,
        trim: true
    },
    thanksNote: {
        type: String,
        default: "Thank you for your business!"
    },
    settingsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Settings",
        required: [true, "Settings ID is required"]
    }
}, {
    timestamps: true
});

module.exports = mongoose.model("Invoice", invoiceSchema);