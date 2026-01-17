"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userController_1 = require("../controllers/userController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.protect);
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
router.get("/profile", userController_1.getUserProfile);
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
router.put("/profile/pin", userController_1.updateTransactionPin);
router.get("/unapproved", authMiddleware_1.protect, authMiddleware_1.admin, userController_1.getUnapprovedUsers);
router.put("/:id/approve", authMiddleware_1.protect, authMiddleware_1.admin, userController_1.approveUser);
exports.default = router;
