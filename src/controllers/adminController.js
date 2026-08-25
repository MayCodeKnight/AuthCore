import {findAllUsers,findUserById,updateUserRole,deleteUser} from "../services/userService.js";
import AppError from "../utils/AppError.js";


export const getAllUsers = async (req,res) => {
    const result = await findAllUsers();
    res.json({
        users: result
    });
};

export const getUserById = async (req,res) =>{
    const user = await findUserById(req.params.id);

    if(!user){
        throw new AppError("User not found",404);
    }
    res.json({
        user: user
    });
};

export const getupdateUserRole = async (req, res) => {
    const userId = req.params.id;
    const body = req.body;

    const providedFields = Object.keys(body);

    if (providedFields.length === 0) {
        throw new AppError("Role is required", 400);
    }

    const hasInvalidField = providedFields.some(
        (field) => field !== "role"
    );

    if (hasInvalidField) {
        throw new AppError("Only role can be updated", 400);
    }

    const { role } = body;

    if (typeof role !== "string") {
        throw new AppError("Role must be a string", 400);
    }

    if (role !== "user" && role !== "admin") {
        throw new AppError(
            "Invalid role. Role must be either 'user' or 'admin'",
            400
        );
    }

    const updatedUser = await updateUserRole(userId, role);

    if (!updatedUser) {
        throw new AppError("User not found", 404);
    }

    res.json({
        user: updatedUser
    });
};

export const deleteUserByAdmin = async (req,res) =>{
    const userId = req.params.id;

    if (Number(userId) === Number(req.user.sub)) {
        throw new AppError(
            "Admins cannot delete their own account",
            400
        );
    }

    const deletedUser = await deleteUser(userId);

    if(!deletedUser){
        throw new AppError("User not found",404);
    }
    res.status(204).send();
};