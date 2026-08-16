import express from "express";
import  currentUser  from "../controllers/userController.js";

const router = express.Router();

router.get("/me", currentUser);
// router.patch("/me");
// router.delete("/me");

export default router;