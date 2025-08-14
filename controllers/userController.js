const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Create a User (Sign Up)
exports.createUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "Oops! This email is already used!" });
        }

        // Hide the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            role: role || "staff"
        });

        const savedUser = await user.save();
        res.status(201).json({
            message: " New user added!",
            data: { id: savedUser._id, name: savedUser.name, email: savedUser.email, role: savedUser.role }
        });
    } catch (err) {
        res.status(400).json({ error: "Trouble adding user: " + err.message });
    }
};

// Login User
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: "Oops! Email or password is wrong!" });
        }

        // Check the password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Oops! Email or password is wrong!" });
        }

        // Create a token (the secret toy key)
        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET || "your-secret-key",
            { expiresIn: "1h" } // Token lasts for 1 hour
        );

        res.json({
            message: " Welcome back!",
            token,
            user: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(400).json({ error: "Trouble logging in: " + err.message });
    }
};

// Get All Users (Protected - only for admins)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json({
            message: " Here are all the users!",
            data: users.map(user => ({
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }))
        });
    } catch (err) {
        res.status(500).json({ error: "Trouble fetching users: " + err.message });
    }
};

// Get One User (Protected - user can see their own details)
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Only allow the user to see their own details (unless they're admin)
        if (req.user.userId !== user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ error: "You can only see your own details!" });
        }

        res.json({
            message: " User found!",
            data: { id: user._id, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(400).json({ error: "Trouble finding user: " + err.message });
    }
};

// Update User (Protected - user can update their own details)
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Only allow the user to update their own details (unless they're admin)
        if (req.user.userId !== user._id.toString() && req.user.role !== "admin") {
            return res.status(403).json({ error: "You can only update your own details!" });
        }

        const updateData = {
            name: req.body.name || user.name,
            email: req.body.email || user.email,
            role: req.body.role || user.role
        };

        // If updating password, hash it
        if (req.body.password) {
            updateData.password = await bcrypt.hash(req.body.password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json({
            message: "User updated!",
            data: { id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role }
        });
    } catch (err) {
        res.status(400).json({ error: "Trouble updating user: " + err.message });
    }
};

// Delete User (Protected - only for admins)
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User deleted!" });
    } catch (err) {
        res.status(500).json({ error: "Trouble deleting user: " + err.message });
    }
};

exports.protect = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1]; // Get token from "Bearer <token>"
        if (!token) {
            return res.status(401).json({ error: "You need a key to enter! Please log in." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
        req.user = decoded; // Add user info to the request
        next();
    } catch (err) {
        res.status(401).json({ error: "Invalid key! Please log in again." });
    }
};

// Middleware to Restrict to Admins
exports.restrictToAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Only admins can do this!" });
    }
    next();
};

// Logout User (Client-Side)
exports.logoutUser = (req, res) => {
    res.json({ message: "You’re logged out! Remove the key on your side." });
};