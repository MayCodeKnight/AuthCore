import express from "express";
import  {getAllUsers,getUserById,getupdateUserRole,deleteUserByAdmin} from "../controllers/adminController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { requireRole } from "../middleware/roleMiddleware.js";
import validateId from "../middleware/validateId.js";

const router = express.Router();

router.get("/users", authMiddleware, requireRole("admin"), getAllUsers);
router.get("/users/:id", authMiddleware, requireRole("admin"), validateId, getUserById);
router.patch("/users/:id/role", authMiddleware, requireRole("admin"), validateId, getupdateUserRole);
router.delete("/users/:id", authMiddleware, requireRole("admin"), validateId, deleteUserByAdmin);


export default router;