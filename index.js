const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

const clientRoutes = require("./routes/clientRoutes");
const companyRoutes = require("./routes/companyRoutes");
const bankRoutes = require("./routes/bankRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const userRoutes = require("./routes/userRoutes");

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Serve static files (for PDFs)
app.use("/invoices", express.static("invoices"));

// Validate environment variables
if (!process.env.MONGO_URI) {
    console.error("Error: MONGO_URI is missing in the .env file!");
    process.exit(1);
}

if (!process.env.JWT_SECRET) {
    console.error("Error: JWT_SECRET is missing in the .env file!");
    process.exit(1);
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Connected to MongoDB database!"))
    .catch(err => {
        console.error("Failed to connect to MongoDB:", err.message);
        process.exit(1);
    });

    app.get("/", (req, res) => {
    res.send("Welcome to the Invoice Management API!");
});
// Routes
app.use("/api/clients", clientRoutes);
app.use("/api/companies", companyRoutes);
app.use("/api/banks", bankRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/users", userRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));