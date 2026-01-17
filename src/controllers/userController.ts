import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import Transaction from "../models/Transaction";
import User from "../models/User";

// @desc    Get user profile / dashboard data
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    // Aggregation to calculate global stats
    const stats = await Transaction.aggregate([
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

    const user = await User.findById(req.user._id).select(
      "-password -transactionPin",
    );

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
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Update Transaction PIN
// @route   PUT /api/users/profile/pin
// @access  Private
export const updateTransactionPin = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
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

    const user = await User.findById(req.user._id);

    if (user) {
      user.transactionPin = pin; // Will be hashed by pre-save
      await user.save();
      res.json({ message: "Transaction PIN updated successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get all unapproved users
// @route   GET /api/users/unapproved
// @access  Private/Admin
export const getUnapprovedUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const users = await User.find({ isApproved: false }).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Approve a user
// @route   PUT /api/users/:id/approve
// @access  Private/Admin
export const approveUser = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id);

    if (user) {
      user.isApproved = true;
      await user.save();
      res.json({ message: "User approved successfully" });
    } else {
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const users = await User.find({}).select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Get user details with transactions
// @route   GET /api/users/:id
// @access  Private/Admin
export const getUserDetails = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -transactionPin",
    );

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const transactions = await Transaction.find({ user: user._id }).sort({
      createdAt: -1,
    });

    res.json({
      user,
      transactions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};
