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
exports.getTransactionById = exports.getTransactions = exports.makeWithdrawal = exports.addDeposit = void 0;
const Transaction_1 = __importDefault(require("../models/Transaction"));
const User_1 = __importDefault(require("../models/User"));
// @desc    Add a deposit
// @route   POST /api/transactions/deposit
// @access  Private
const addDeposit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, receipt, description } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ message: "Please enter a valid amount" });
            return;
        }
        if (!req.user) {
            res.status(401).json({ message: "User not found" });
            return;
        }
        // Create transaction
        const transaction = yield Transaction_1.default.create({
            user: req.user._id,
            amount,
            type: "DEPOSIT",
            status: "COMPLETED", // Assuming immediate completion per requirement "added to balance"
            receipt: receipt || "",
            description: description || "Deposit",
        });
        // Update user balance and income
        const user = yield User_1.default.findById(req.user._id);
        if (user) {
            user.balance += Number(amount);
            user.totalIncome += Number(amount);
            yield user.save();
        }
        res.status(201).json(transaction);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Server Error", error: error.message });
    }
});
exports.addDeposit = addDeposit;
// @desc    Make a withdrawal
// @route   POST /api/transactions/withdraw
// @access  Private
const makeWithdrawal = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { amount, pin } = req.body;
        if (!amount || amount <= 0) {
            res.status(400).json({ message: "Invalid amount" });
            return;
        }
        if (!req.user) {
            res.status(401).json({ message: "User not found" });
            return;
        }
        const user = yield User_1.default.findById(req.user._id);
        if (!user) {
            res.status(404).json({ message: "User not found" });
            return;
        }
        // Verify PIN
        if (!user.transactionPin) {
            res.status(400).json({ message: "Transaction PIN not set" });
            return;
        }
        const isPinMatch = yield user.matchTransactionPin(pin);
        if (!isPinMatch) {
            res.status(401).json({ message: "Invalid transaction PIN" });
            return;
        }
        // Check Global Balance
        const stats = yield Transaction_1.default.aggregate([
            { $match: { status: "COMPLETED" } },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: { $cond: [{ $eq: ["$type", "DEPOSIT"] }, "$amount", 0] },
                    },
                    totalOutgoing: {
                        $sum: { $cond: [{ $eq: ["$type", "WITHDRAWAL"] }, "$amount", 0] },
                    },
                },
            },
        ]);
        const globalStats = stats[0] || { totalIncome: 0, totalOutgoing: 0 };
        const globalBalance = globalStats.totalIncome - globalStats.totalOutgoing;
        if (globalBalance < amount) {
            res.status(400).json({ message: "Insufficient funds in the system" });
            return;
        }
        // Deduct from personal balance (optional tracking)
        user.balance = (user.balance || 0) - Number(amount);
        user.totalOutgoing = (user.totalOutgoing || 0) + Number(amount);
        yield user.save();
        // Create Transaction
        const transaction = yield Transaction_1.default.create({
            user: user._id,
            amount,
            type: "WITHDRAWAL",
            status: "COMPLETED",
            description: "Withdrawal",
        });
        res.status(201).json(transaction);
    }
    catch (error) {
        res
            .status(500)
            .json({ message: "Server Error", error: error.message });
    }
});
exports.makeWithdrawal = makeWithdrawal;
// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        const transactions = yield Transaction_1.default.find({})
            .sort({
            createdAt: -1,
        })
            .populate("user", "username email");
        res.json(transactions);
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
exports.getTransactions = getTransactions;
// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
const getTransactionById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const transaction = yield Transaction_1.default.findById(req.params.id);
        if (!transaction) {
            res.status(404).json({ message: "Transaction not found" });
            return;
        }
        // Ensure user owns the transaction
        if (transaction.user.toString() !==
            ((_a = req.user) === null || _a === void 0 ? void 0 : _a._id).toString()) {
            res.status(401).json({ message: "Not authorized" });
            return;
        }
        // Populate user details after verification
        yield transaction.populate("user", "username email");
        res.json(transaction);
    }
    catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});
exports.getTransactionById = getTransactionById;
