import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Transaction from "../models/Transaction";
import User from "../models/User";

// @desc    Add a deposit
// @route   POST /api/transactions/deposit
// @access  Private
export const addDeposit = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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
    const transaction = await Transaction.create({
      user: req.user._id,
      amount,
      type: "DEPOSIT",
      status: "COMPLETED", // Assuming immediate completion per requirement "added to balance"
      receipt: receipt || "",
      description: description || "Deposit",
    });

    // Update user balance and income
    const user = await User.findById(req.user._id);
    if (user) {
      user.balance += Number(amount);
      user.totalIncome += Number(amount);
      await user.save();
    }

    res.status(201).json(transaction);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error", error: (error as Error).message });
  }
};

// @desc    Make a withdrawal
// @route   POST /api/transactions/withdraw
// @access  Private
export const makeWithdrawal = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
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

    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Verify PIN
    if (!user.transactionPin) {
      res.status(400).json({ message: "Transaction PIN not set" });
      return;
    }

    const isPinMatch = await user.matchTransactionPin(pin);
    if (!isPinMatch) {
      res.status(401).json({ message: "Invalid transaction PIN" });
      return;
    }

    // Check Global Balance
    const stats = await Transaction.aggregate([
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
    await user.save();

    // Create Transaction
    const transaction = await Transaction.create({
      user: user._id,
      amount,
      type: "WITHDRAWAL",
      status: "COMPLETED",
      description: "Withdrawal",
    });

    res.status(201).json(transaction);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error", error: (error as Error).message });
  }
};

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }
    const transactions = await Transaction.find({})
      .sort({
        createdAt: -1,
      })
      .populate("user", "username email");
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      res.status(404).json({ message: "Transaction not found" });
      return;
    }

    // Ensure user owns the transaction
    if (
      transaction.user.toString() !==
      (req.user?._id as unknown as string).toString()
    ) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    // Populate user details after verification
    await transaction.populate("user", "username email");

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
