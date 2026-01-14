import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Response } from "express";

const generateToken = (id: string): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET as string, {
    expiresIn: "30d",
  });
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(20).toString("hex");
};

export default generateToken;
