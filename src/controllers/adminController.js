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

export const getupdateUserRole = async (req,res) =>{
    const userId = req.params.id;
    const role=req.body.role;

    if(!role || (role !== "user" && role !== "admin")){
        throw new AppError("Invalid role. Role must be either 'user' or 'admin'",400);
    }

    const updatedUser = await updateUserRole(userId,role);

    if(!updatedUser){
        throw new AppError("User not found",404);
    }
    res.json({
        user: updatedUser
    });
};

export const deleteUserByAdmin = async (req,res) =>{
    const userId = req.params.id;

    const deletedUser = await deleteUser(userId);

    if(!deletedUser){
        throw new AppError("User not found",404);
    }
    res.status(204).send();
};