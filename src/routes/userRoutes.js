import express from "express";
import  currentUser  from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me",authMiddleware,currentUser);
router.patch("/me");
// router.delete("/me");

export default router;