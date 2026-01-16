import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import path from "path";

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet({ crossOriginResourcePolicy: false })); // Allow cross-origin for images
app.use(morgan("dev"));

app.use(express.static(path.join(__dirname, "../public")));

import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger";

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

import authRoutes from "./routes/authRoutes";
import transactionRoutes from "./routes/transactionRoutes";
import userRoutes from "./routes/userRoutes";

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/users", userRoutes);
app.get("/", (req: Request, res: Response) => {
  res.send("API is running...");
});

import { notFound, errorHandler } from "./middleware/errorMiddleware";

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

export default app;
