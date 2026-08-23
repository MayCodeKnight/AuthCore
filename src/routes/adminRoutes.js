import express from "express";
import  {getAllUsers,getUserById,getupdateUserRole,deleteUserByAdmin} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.get("/users", authMiddleware, requireRole("admin"), getAllUsers);
router.get("/users/:id", authMiddleware, requireRole("admin"),getUserById);
router.patch("/users/:id/role", authMiddleware, requireRole("admin"), getupdateUserRole);
router.delete("/users/:id", authMiddleware, requireRole("admin"), deleteUserByAdmin);


export default router;