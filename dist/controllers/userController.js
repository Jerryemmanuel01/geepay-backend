"use strict";
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
exports.updateTransactionPin = exports.getUserProfile = void 0;
const Transaction_1 = __importDefault(require("../models/Transaction"));
const User_1 = __importDefault(require("../models/User"));
// @desc    Get user profile / dashboard data
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        // Aggregation to calculate global stats
        const stats = yield Transaction_1.default.aggregate([
            {
                $match: { status: "COMPLETED" },
            },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "DEPOSIT"] }, "$amount", 0],
                        },
                    },
                    totalOutgoing: {
                        $sum: {
                            $cond: [{ $eq: ["$type", "WITHDRAWAL"] }, "$amount", 0],
                        },
                    },
                },
            },
        ]);
        const globalStats = stats[0] || { totalIncome: 0, totalOutgoing: 0 };
        const globalBalance = globalStats.totalIncome - globalStats.totalOutgoing;
        const user = yield User_1.default.findById(req.user._id).select("-password -transactionPin");
        if (user) {
            res.json({
                _id: user._id,
                username: user.username,
                email: user.email,
                balance: globalBalance,
                totalIncome: globalStats.totalIncome,
                totalOutgoing: globalStats.totalOutgoing,
                isVerified: user.isVerified,
            });
        }
        else {
            res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
exports.getUserProfile = getUserProfile;
// @desc    Update Transaction PIN
// @route   PUT /api/users/profile/pin
// @access  Private
const updateTransactionPin = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { pin } = req.body;
        if (!pin || pin.length < 4) {
            res.status(400).json({ message: "PIN must be at least 4 chars" });
            return;
        }
        if (!req.user) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const user = yield User_1.default.findById(req.user._id);
        if (user) {
            user.transactionPin = pin; // Will be hashed by pre-save
            yield user.save();
            res.json({ message: "Transaction PIN updated successfully" });
        }
        else {
            res.status(404).json({ message: "User not found" });
        }
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
exports.updateTransactionPin = updateTransactionPin;
