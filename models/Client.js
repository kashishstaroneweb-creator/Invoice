const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
    companyName: { type: String, required: [true, "Company name is required"] },
    phoneNumber: { type: String, required: [true, "Phone number is required"] },
    email: {
        type: String,
        required: [true, "Email is required"],
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"]
    },
    address: { type: String, required: [true, "Address is required"] },
    gstNumber: { type: String, required: [true, "GST number is required"] },
    isRecurrent: { type: Boolean, default: false }
}, {
    timestamps: true
});

module.exports = mongoose.model("Client", clientSchema);