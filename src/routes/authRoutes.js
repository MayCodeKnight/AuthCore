import express from "express";
import registerUser from "../controllers/authController.js";

const router = express.Router();

router.post("/register", registerUser);
// router.post("/login");
// router.post("/forgot-password");
// router.post("/reset-password");
// router.post("/logout");

export default router;