import express from "express";
import {
  addDeposit,
  makeWithdrawal,
  getTransactions,
  getTransactionById,
} from "../controllers/transactionController";
import { protect } from "../middleware/authMiddleware";

const router = express.Router();

router.use(protect); // Protect all routes

/**
 * @swagger
 * tags:
 *   name: Transactions
 *   description: Deposit, Withdrawal and History
 */

/**
 * @swagger
 * /api/transactions/deposit:
 *   post:
 *     summary: Add a deposit
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *               receipt:
 *                 type: string
 *     responses:
 *       201:
 *         description: Deposit successful
 *       401:
 *         description: Not authorized
 */
router.route("/deposit").post(addDeposit);

/**
 * @swagger
 * /api/transactions/withdraw:
 *   post:
 *     summary: Make a withdrawal
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - pin
 *             properties:
 *               amount:
 *                 type: number
 *               pin:
 *                 type: string
 *     responses:
 *       201:
 *         description: Withdrawal successful
 *       400:
 *         description: Invalid amount, PIN, or insufficient balance
 *       401:
 *         description: Not authorized or PIN mismatch
 */
router.route("/withdraw").post(makeWithdrawal);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get all transactions for logged in user
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                  type: object
 *                  properties:
 *                    _id:
 *                      type: string
 *                    amount:
 *                      type: number
 *                    type:
 *                      type: string
 *                    status:
 *                      type: string
 *                    createdAt:
 *                      type: string
 *                      format: date-time
 */
router.route("/").get(getTransactions);

/**
 * @swagger
 * /api/transactions/{id}:
 *   get:
 *     summary: Get transaction by ID
 *     tags: [Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Transaction details
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Not authorized
 */
router.route("/:id").get(getTransactionById);

export default router;
