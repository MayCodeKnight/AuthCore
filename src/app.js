import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import errorMiddleware from "./middleware/errorMiddleware.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); 
app.use("/api/admin", adminRoutes);
app.use(errorMiddleware);

export default app;