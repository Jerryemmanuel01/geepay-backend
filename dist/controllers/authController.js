"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.loginUser = exports.resendVerification = exports.verifyEmail = exports.registerUser = void 0;
const User_1 = __importDefault(require("../models/User"));
const generateToken_1 = __importStar(require("../utils/generateToken"));
const sendEmail_1 = __importDefault(require("../utils/sendEmail"));
const emailTemplate_1 = require("../utils/emailTemplate");
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, confirmPassword } = req.body;
        if (password !== confirmPassword) {
            res.status(400).json({ message: "Passwords do not match" });
            return;
        }
        const userExists = yield User_1.default.findOne({ $or: [{ email }, { username }] });
        if (userExists) {
            res.status(400).json({ message: "User already exists" });
            return;
        }
        // Generate verification token
        const verificationToken = (0, generateToken_1.generateRandomToken)();
        const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        const user = yield User_1.default.create({
            username,
            email,
            password,
            verificationToken,
            verificationTokenExpires,
        });
        // Send verification email
        const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/verify-email/${verificationToken}`;
        const message = `Please confirm your email by clicking here: ${verificationUrl}`;
        const html = (0, emailTemplate_1.generateEmailTemplate)({
            title: "Welcome to Geepay!",
            body: `Thank you for registering. Please confirm your email address to get started.\n\nThis link expires in 10 minutes.`,
            link: verificationUrl,
            linkText: "Verify Email",
        });
        try {
            yield (0, sendEmail_1.default)({
                email: user.email,
                subject: "Geepay Email Verification",
                message,
                html,
            });
            res.status(201).json({
                message: "User registered. Please check your email to verify your account.",
            });
        }
        catch (error) {
            // Rollback user creation if email fails (optional but good practice)
            yield User_1.default.findByIdAndDelete(user._id);
            res
                .status(500)
                .json({ message: "Email could not be sent. Please try again." });
        }
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Server Error", error: error.message });
    }
});
exports.registerUser = registerUser;
// @desc    Verify email address
// @route   GET /api/auth/verify/:token
// @access  Public
const verifyEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token } = req.params;
        const user = yield User_1.default.findOne({
            verificationToken: token,
            verificationTokenExpires: { $gt: Date.now() },
        });
        if (!user) {
            res.status(400).json({ message: "Invalid or expired token" });
            return;
        }
        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpires = undefined;
        yield user.save();
        res
            .status(200)
            .json({ message: "Email verified successfully. You can now login." });
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
exports.verifyEmail = verifyEmail;
// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        if (user.isVerified) {
            res.status(400).json({ message: "User is already verified" });
            return;
        }
        // Generate new token
        const verificationToken = (0, generateToken_1.generateRandomToken)();
        const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);
        user.verificationToken = verificationToken;
        user.verificationTokenExpires = verificationTokenExpires;
        yield user.save();
        const verificationUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/verify-email/${verificationToken}`;
        const message = `Please confirm your email by clicking here: ${verificationUrl}`;
        const html = (0, emailTemplate_1.generateEmailTemplate)({
            title: "Verify Your Email",
            body: `You requested a new verification link. Please confirm your email address to continue.\n\nThis link expires in 10 minutes.`,
            link: verificationUrl,
            linkText: "Verify Email",
        });
        yield (0, sendEmail_1.default)({
            email: user.email,
            subject: "Geepay Email Verification (Resend)",
            message,
            html,
        });
        res.status(200).json({ message: "Verification email resent." });
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
exports.resendVerification = resendVerification;
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const user = yield User_1.default.findOne({ username });
        if (user && (yield user.matchPassword(password))) {
            if (!user.isVerified) {
                res.status(401).json({ message: "Please verify your email to login" });
                return;
            }
            const token = (0, generateToken_1.default)(user._id);
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                token,
            });
        }
        else {
            res.status(401).json({ message: "Invalid username or password" });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
exports.loginUser = loginUser;
// @desc    Forgot Password - Send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        const user = yield User_1.default.findOne({ email });
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        const resetToken = (0, generateToken_1.generateRandomToken)();
        // No expiration mentioned for reset in prompt, but standard protects against replay. Let's do 1 hour.
        const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = resetExpires;
        yield user.save();
        // "token is passed to the reset password page"
        const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/auth/reset-password?token=${resetToken}`;
        const message = `You requested a password reset. Please go to this link to reset your password: ${resetUrl}`;
        const html = (0, emailTemplate_1.generateEmailTemplate)({
            title: "Reset Your Password",
            body: `We received a request to reset your password. If you didn't make this request, you can safely ignore this email.\n\nOtherwise, click the button below to reset your password.`,
            link: resetUrl,
            linkText: "Reset Password",
        });
        try {
            yield (0, sendEmail_1.default)({
                email: user.email,
                subject: "Geepay Password Reset",
                message,
                html,
            });
            res.status(200).json({ message: "Password reset email sent" });
        }
        catch (error) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;
            yield user.save();
            res.status(500).json({ message: "Email could not be sent" });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
exports.forgotPassword = forgotPassword;
// @desc    Reset Password
// @route   PUT /api/auth/reset-password
// @access  Public
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // Token passed via body or query, prompt says "token is passed to..." typically means frontend gets it from URL
    // and sends it to API. Let's expect it in body for security/simplicity of the PUT request.
    try {
        const { token, password } = req.body;
        // Find user with token and check expiry
        const user = yield User_1.default.findOne({
            resetPasswordToken: token,
            resetPasswordExpire: { $gt: Date.now() },
        });
        if (!user) {
            res.status(400).json({ message: "Invalid or expired token" });
            return;
        }
        user.password = password; // Will be hashed by pre-save hook
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        yield user.save();
        res
            .status(200)
            .json({ message: "Password reset successful. You can now login." });
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
exports.resetPassword = resetPassword;
