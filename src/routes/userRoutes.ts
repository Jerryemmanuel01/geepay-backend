import express from "express";
import {
  getUserProfile,
  updateTransactionPin,
  getUnapprovedUsers,
  approveUser,
  getAllUsers,
  getUserDetails,
} from "../controllers/userController";
import { protect, admin } from "../middleware/authMiddleware";

const router = express.Router();

router.use(protect);

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User Profile Management
 */

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get user profile and dashboard stats
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 balance:
 *                   type: number
 *                 totalIncome:
 *                   type: number
 *                 totalOutgoing:
 *                   type: number
 *                 isVerified:
 *                   type: boolean
 */
router.get("/profile", getUserProfile);

/**
 * @swagger
 * /api/users/profile/pin:
 *   put:
 *     summary: Update Transaction PIN
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - pin
 *             properties:
 *               pin:
 *                 type: string
 *                 description: New transaction PIN (min 4 chars)
 *     responses:
 *       200:
 *         description: PIN updated successfully
 *       400:
 *         description: Invalid PIN format
 */
router.put("/profile/pin", updateTransactionPin);

router.get("/unapproved", protect, admin, getUnapprovedUsers);
router.put("/:id/approve", protect, admin, approveUser);

router.get("/", protect, admin, getAllUsers);
router.get("/:id", protect, admin, getUserDetails);

export default router;
