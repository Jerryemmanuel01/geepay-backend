import mongoose, { Document, Schema } from "mongoose";

export interface ITransaction extends Document {
  user: mongoose.Types.ObjectId;
  amount: number;
  type: "DEPOSIT" | "WITHDRAWAL";
  status: "PENDING" | "COMPLETED" | "FAILED";
  description?: string;
  receipt?: string;
  createdAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAWAL"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
    },
    description: {
      type: String,
    },
    receipt: {
      type: String, // URL or base64? Assuming URL or path
    },
  },
  {
    timestamps: true,
  }
);

const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema
);

export default Transaction;
