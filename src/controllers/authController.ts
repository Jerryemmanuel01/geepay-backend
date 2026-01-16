import { Request, Response } from "express";
import crypto from "crypto";
import User from "../models/User";
import generateToken, { generateRandomToken } from "../utils/generateToken";
import sendEmail from "../utils/sendEmail";
import { generateEmailTemplate } from "../utils/emailTemplate";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      res.status(400).json({ message: "Passwords do not match" });
      return;
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });

    if (userExists) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    // Generate verification token
    const verificationToken = generateRandomToken();
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await User.create({
      username,
      email,
      password,
      verificationToken,
      verificationTokenExpires,
    });

    // Send verification email
    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/verify-email/${verificationToken}`;
    const message = `Please confirm your email by clicking here: ${verificationUrl}`;
    const html = generateEmailTemplate({
      title: "Welcome to Geepay!",
      body: `Thank you for registering. Please confirm your email address to get started.\n\nThis link expires in 10 minutes.`,
      link: verificationUrl,
      linkText: "Verify Email",
    });

    try {
      await sendEmail({
        email: user.email,
        subject: "Geepay Email Verification",
        message,
        html,
      });

      res.status(201).json({
        message:
          "User registered. Please check your email to verify your account.",
      });
    } catch (error) {
      // Rollback user creation if email fails (optional but good practice)
      await User.findByIdAndDelete(user._id);
      res
        .status(500)
        .json({ message: "Email could not be sent. Please try again." });
    }
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server Error", error: (error as Error).message });
  }
};

// @desc    Verify email address
// @route   GET /api/auth/verify/:token
// @access  Public
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;

    const user = await User.findOne({
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
    await user.save();

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now login." });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.isVerified) {
      res.status(400).json({ message: "User is already verified" });
      return;
    }

    // Generate new token
    const verificationToken = generateRandomToken();
    const verificationTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.verificationToken = verificationToken;
    user.verificationTokenExpires = verificationTokenExpires;
    await user.save();

    const verificationUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/verify-email/${verificationToken}`;
    const message = `Please confirm your email by clicking here: ${verificationUrl}`;
    const html = generateEmailTemplate({
      title: "Verify Your Email",
      body: `You requested a new verification link. Please confirm your email address to continue.\n\nThis link expires in 10 minutes.`,
      link: verificationUrl,
      linkText: "Verify Email",
    });

    await sendEmail({
      email: user.email,
      subject: "Geepay Email Verification (Resend)",
      message,
      html,
    });

    res.status(200).json({ message: "Verification email resent." });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      if (!user.isVerified) {
        res.status(401).json({ message: "Please verify your email to login" });
        return;
      }

      const token = generateToken(user._id as unknown as string);

      res.json({
        _id: user._id,
        username: user.username,
        email: user.email,
        token,
      });
    } else {
      res.status(401).json({ message: "Invalid username or password" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Forgot Password - Send reset link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    const resetToken = generateRandomToken();
    // No expiration mentioned for reset in prompt, but standard protects against replay. Let's do 1 hour.
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetExpires;
    await user.save();

    // "token is passed to the reset password page"
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/auth/reset-password?token=${resetToken}`;
    const message = `You requested a password reset. Please go to this link to reset your password: ${resetUrl}`;
    const html = generateEmailTemplate({
      title: "Reset Your Password",
      body: `We received a request to reset your password. If you didn't make this request, you can safely ignore this email.\n\nOtherwise, click the button below to reset your password.`,
      link: resetUrl,
      linkText: "Reset Password",
    });

    try {
      await sendEmail({
        email: user.email,
        subject: "Geepay Password Reset",
        message,
        html,
      });

      res.status(200).json({ message: "Password reset email sent" });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      res.status(500).json({ message: "Email could not be sent" });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// @desc    Reset Password
// @route   PUT /api/auth/reset-password
// @access  Public
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  // Token passed via body or query, prompt says "token is passed to..." typically means frontend gets it from URL
  // and sends it to API. Let's expect it in body for security/simplicity of the PUT request.
  try {
    const { token, password } = req.body;

    // Find user with token and check expiry
    const user = await User.findOne({
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
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
