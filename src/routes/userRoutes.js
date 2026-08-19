import express from "express";
import  {currentUser,updateCurrentUser}  from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me",authMiddleware,currentUser);
router.patch("/me",authMiddleware,updateCurrentUser);
// router.delete("/me");

export default router;