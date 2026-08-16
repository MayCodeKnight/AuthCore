import express from "express";
import  getAllUsers  from "../controllers/adminController.js";

const router = express.Router();

router.get("/users", getAllUsers);
// router.get("/users/:id");
// router.delete("/users/:id");
// router.patch("/users/:id/role");

export default router;