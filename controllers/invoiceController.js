const Invoice = require("../models/Invoice");
const Settings = require("../models/Settings");
const Client = require("../models/Client");
const PDFDocument = require("pdfkit");
const fs = require("fs").promises;
const path = require("path");
const nodemailer = require("nodemailer");
const sgMail = require("@sendgrid/mail");
require("dotenv").config();


// Helper to generate invoice number
const generateInvoiceNumber = async (suffix) => {
    const count = await Invoice.countDocuments();
    const number = (count + 1).toString().padStart(3, "0");
    return `${suffix}-${number}`;
};

// Helper to calculate taxes and total
const calculateTotal = (amount, currency, taxType, cgst = 9, sgst = 9, igst = 18) => {
    if (currency === "USD" || taxType === "NONE") {
        return amount;
    }
    if (taxType === "IGST") {
        return amount + (amount * igst) / 100;
    }
    return amount + (amount * cgst) / 100 + (amount * sgst) / 100;
};

// Helper to generate PDF
const generateInvoicePDF = async (invoice) => {
    const pdfPath = path.join(__dirname, "../../invoices", `${invoice.invoiceNumber}.pdf`);
    await fs.mkdir(path.dirname(pdfPath), { recursive: true });

    const stampDir = path.join(__dirname, "../../Uploads/stamp");
    const signatureDir = path.join(__dirname, "../../Uploads/signature");
    await fs.mkdir(stampDir, { recursive: true });
    await fs.mkdir(signatureDir, { recursive: true });

    const doc = new PDFDocument({ margin: 50 });
    const stream = require("fs").createWriteStream(pdfPath);
    doc.pipe(stream);

    // Company Details
    doc.fontSize(20).text(invoice.settingsId.companyId.companyName, 50, 50);
    doc.fontSize(10).text(invoice.settingsId.companyId.address, 50, 70);
    doc.fontSize(10).text(`Phone: ${invoice.settingsId.companyId.phoneNumber}`, 50, 85);
    doc.fontSize(10).text(`GST: ${invoice.settingsId.companyId.gstNumber}`, 50, 100);

    // Invoice Title and Details
    doc.fontSize(16).text("INVOICE", 400, 50, { align: "right" });
    doc.fontSize(10).text(`Invoice Number: ${invoice.invoiceNumber}`, 400, 70, { align: "right" });
    doc.fontSize(10).text(`Date: ${invoice.date.toLocaleDateString("en-GB")}`, 400, 85, { align: "right" });

    // Client Details
    doc.fontSize(12).text("Bill To:", 50, 130);
    doc.fontSize(10).text(invoice.clientId.companyName, 50, 145);
    doc.fontSize(10).text(invoice.clientId.address, 50, 160);
    doc.fontSize(10).text(`Phone: ${invoice.clientId.phoneNumber}`, 50, 175);
    doc.fontSize(10).text(`Email: ${invoice.clientId.email}`, 50, 190);
    doc.fontSize(10).text(`GST: ${invoice.clientId.gstNumber}`, 50, 205);

    // Bank Details
    doc.fontSize(12).text("Bank Details:", 400, 130);
    doc.fontSize(10).text(`Bank Name: ${invoice.settingsId.bankId.bankName}`, 400, 145);
    doc.fontSize(10).text(`A/c No: ${invoice.settingsId.bankId.accountName}`, 400, 160);
    doc.fontSize(10).text(`IFSC Code: ${invoice.settingsId.bankId.ifscCode}`, 400, 175);

    // Invoice Items
    doc.moveTo(50, 230).lineTo(550, 230).stroke();
    doc.fontSize(12).text("Description", 50, 240);
    doc.fontSize(12).text("Amount", 450, 240, { align: "right" });
    doc.moveTo(50, 260).lineTo(550, 260).stroke();
    doc.fontSize(10).text(invoice.description, 50, 270);
    doc.fontSize(10).text(`${invoice.amount.toFixed(2)} ${invoice.currency}`, 450, 270, { align: "right" });
    doc.moveTo(50, 290).lineTo(550, 290).stroke();

    // Taxes and Total
    let yPos = 310;
    if (invoice.currency === "INR") {
        if (invoice.taxType === "IGST") {
            doc.fontSize(10).text(`IGST (${invoice.igst}%)`, 400, yPos);
            doc.fontSize(10).text((invoice.amount * invoice.igst / 100).toFixed(2), 450, yPos, { align: "right" });
            yPos += 15;
        } else if (invoice.taxType === "CGST+SGST") {
            doc.fontSize(10).text(`CGST (${invoice.cgst}%)`, 400, yPos);
            doc.fontSize(10).text((invoice.amount * invoice.cgst / 100).toFixed(2), 450, yPos, { align: "right" });
            yPos += 15;
            doc.fontSize(10).text(`SGST (${invoice.sgst}%)`, 400, yPos);
            doc.fontSize(10).text((invoice.amount * invoice.sgst / 100).toFixed(2), 450, yPos, { align: "right" });
            yPos += 15;
        }
    }
    doc.moveTo(400, yPos).lineTo(550, yPos).stroke();
    doc.fontSize(12).text("Total Amount", 400, yPos + 10);
    doc.fontSize(12).text(`${invoice.totalAmount.toFixed(2)} ${invoice.currency}`, 450, yPos + 10, { align: "right" });

    // Other Comments
    doc.moveTo(50, yPos + 30).lineTo(550, yPos + 30).stroke();
    doc.fontSize(12).text("Other Comments", 50, yPos + 40);
    doc.fontSize(10).text(`Due Date: ${invoice.dueDate ? invoice.dueDate.toLocaleDateString("en-GB") : "N/A"}`, 50, yPos + 55);
    doc.fontSize(10).text(`Status: ${invoice.status}`, 50, yPos + 70);
    if (invoice.comments) {
        doc.fontSize(10).text(`Comments: ${invoice.comments}`, 50, yPos + 85);
    }

    // Stamp and Signature
    if (invoice.settingsId.stampImage) {
        const stampPath = path.join(__dirname, "../../Uploads/stamp", invoice.settingsId.stampImage);
        const stampExists = await fs.access(stampPath).then(() => true).catch(() => false);
        if (stampExists) {
            doc.image(stampPath, 50, yPos + 100, { width: 100 });
        }
    }
    if (invoice.settingsId.signatureImage) {
        const signaturePath = path.join(__dirname, "../../Uploads/signature", invoice.settingsId.signatureImage);
        const signatureExists = await fs.access(signaturePath).then(() => true).catch(() => false);
        if (signatureExists) {
            doc.image(signaturePath, 400, yPos + 100, { width: 100 });
        }
    }

    // Signatory and Thank You
    doc.fontSize(10).text(`For, ${invoice.settingsId.companyId.companyName}`, 400, yPos + 150);
    doc.fontSize(10).text(`(${invoice.settingsId.signatoryName})`, 400, yPos + 165);
    doc.fontSize(10).text("Authorized Signature", 400, yPos + 180);
    doc.fontSize(12).text(invoice.thanksNote, 50, yPos + 150);

    doc.end();
    await new Promise(resolve => stream.on("finish", resolve));
    return pdfPath;
};

// Create Invoice
exports.createInvoice = async (req, res) => {
    try {
        // Validate required fields
        const { clientId, description, amount, currency, taxType, dueDate, status, comments, thanksNote } = req.body;
        if (!clientId || !description || !amount) {
            return res.status(400).json({ message: "Missing required fields: clientId, description, amount" });
        }

        // Validate client
        const client = await Client.findById(clientId);
        if (!client) {
            return res.status(400).json({ message: "Invalid clientId. Client does not exist" });
        }

        // Validate settings
        const settings = await Settings.findOne().populate("companyId bankId");
        if (!settings) {
            return res.status(400).json({ message: "Settings not found" });
        }

        // Validate amount
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount < 0) {
            return res.status(400).json({ message: "Amount must be a valid non-negative number" });
        }

        // Generate invoice number
        const invoiceNumber = await generateInvoiceNumber(settings.invoiceSuffix);

        // Calculate total based on tax type
        const selectedCurrency = currency || "INR";
        const selectedTaxType = selectedCurrency === "USD" ? "NONE" : (taxType || "CGST+SGST");
        const cgst = selectedTaxType === "CGST+SGST" ? 9 : 0;
        const sgst = selectedTaxType === "CGST+SGST" ? 9 : 0;
        const igst = selectedTaxType === "IGST" ? 18 : 0;
        const totalAmount = calculateTotal(parsedAmount, selectedCurrency, selectedTaxType, cgst, sgst, igst);

        // Create invoice
        const invoice = new Invoice({
            invoiceNumber,
            clientId,
            description,
            amount: parsedAmount,
            currency: selectedCurrency,
            taxType: selectedTaxType,
            cgst,
            sgst,
            igst,
            totalAmount,
            date: new Date(),
            dueDate: dueDate ? new Date(dueDate) : null,
            status: status || "Unpaid",
            comments,
            thanksNote: thanksNote || "Thank you for your business!",
            settingsId: settings._id
        });

        const savedInvoice = await invoice.save();
        const populatedInvoice = await Invoice.findById(savedInvoice._id)
            .populate("clientId", "companyName phoneNumber email address gstNumber")
            .populate({ path: "settingsId", populate: ["companyId", "bankId"] });

        // Generate PDF
        const pdfPath = await generateInvoicePDF(populatedInvoice);

        res.status(201).json({
            message: "Invoice created successfully",
            data: populatedInvoice,
            pdfPath: `/invoices/${invoice.invoiceNumber}.pdf`
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to create invoice", error: err.message });
    }
};

// Get All Invoices
exports.getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find()
            .populate("clientId", "companyName phoneNumber email address gstNumber")
            .populate({ path: "settingsId", populate: ["companyId", "bankId"] });
        res.status(200).json({
            message: "All invoices retrieved successfully",
            data: invoices
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to retrieve invoices", error: err.message });
    }
};

// Get Single Invoice
exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate("clientId", "companyName phoneNumber email address gstNumber")
            .populate({ path: "settingsId", populate: ["companyId", "bankId"] });
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }
        res.status(200).json({
            message: "Invoice retrieved successfully",
            data: invoice
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to retrieve invoice", error: err.message });
    }
};

// Update Invoice
exports.updateInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // Validate client if provided
        if (req.body.clientId) {
            const client = await Client.findById(req.body.clientId);
            if (!client) {
                return res.status(400).json({ message: "Invalid clientId. Client does not exist" });
            }
        }

        // Validate amount if provided
        let parsedAmount = invoice.amount;
        if (req.body.amount) {
            parsedAmount = parseFloat(req.body.amount);
            if (isNaN(parsedAmount) || parsedAmount < 0) {
                return res.status(400).json({ message: "Amount must be a valid non-negative number" });
            }
        }

        // Calculate total based on updated values
        const currency = req.body.currency || invoice.currency;
        const taxType = currency === "USD" ? "NONE" : (req.body.taxType || invoice.taxType);
        const cgst = taxType === "CGST+SGST" ? 9 : 0;
        const sgst = taxType === "CGST+SGST" ? 9 : 0;
        const igst = taxType === "IGST" ? 18 : 0;
        const totalAmount = calculateTotal(parsedAmount, currency, taxType, cgst, sgst, igst);

        // Prepare update data
        const updateData = {
            clientId: req.body.clientId || invoice.clientId,
            description: req.body.description || invoice.description,
            amount: parsedAmount,
            currency,
            taxType,
            cgst,
            sgst,
            igst,
            totalAmount,
            dueDate: req.body.dueDate ? new Date(req.body.dueDate) : invoice.dueDate,
            status: req.body.status || invoice.status,
            comments: req.body.comments || invoice.comments,
            thanksNote: req.body.thanksNote || invoice.thanksNote
        };

        const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, updateData, { new: true })
            .populate("clientId", "companyName phoneNumber email address gstNumber")
            .populate({ path: "settingsId", populate: ["companyId", "bankId"] });

        // Regenerate PDF
        const pdfPath = await generateInvoicePDF(updatedInvoice);

        res.status(200).json({
            message: "Invoice updated successfully",
            data: updatedInvoice,
            pdfPath: `/invoices/${updatedInvoice.invoiceNumber}.pdf`
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to update invoice", error: err.message });
    }
};

// Delete Invoice
exports.deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        // Delete associated PDF
        const pdfPath = path.join(__dirname, "../../invoices", `${invoice.invoiceNumber}.pdf`);
        await fs.unlink(pdfPath).catch((err) => {
            console.warn(`Failed to delete PDF at ${pdfPath}: ${err.message}`);
        });

        // Delete invoice from database
        await Invoice.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Invoice deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Failed to delete invoice", error: err.message });
    }
};

// Email Invoice with Mailtrap
exports.emailInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id)
            .populate("clientId", "companyName phoneNumber email address gstNumber")
            .populate({ path: "settingsId", populate: ["companyId", "bankId"] });

        if (!invoice) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        if (!invoice.clientId.email) {
            return res.status(400).json({ message: "Client email is not available" });
        }

        const pdfPath = path.join(__dirname, "../../invoices", `${invoice.invoiceNumber}.pdf`);
        const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
        if (!pdfExists) {
            await generateInvoicePDF(invoice);
        }

        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: `"${invoice.settingsId.companyId.companyName}" <${process.env.SMTP_FROM}>`,
            to: invoice.clientId.email,
            subject: `Invoice ${invoice.invoiceNumber} from ${invoice.settingsId.companyId.companyName}`,
            text: `Dear ${invoice.clientId.companyName},\n\nPlease find attached your invoice.\n\n${invoice.thanksNote}\n${invoice.settingsId.companyId.companyName}`,
            attachments: [
                {
                    filename: `${invoice.invoiceNumber}.pdf`,
                    path: pdfPath
                }
            ]
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: "Invoice emailed successfully (via Mailtrap)" });

    } catch (err) {
        res.status(500).json({ message: "Failed to email invoice", error: err.message });
    }
};