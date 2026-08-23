import { findUserById,updateUser,deleteUser } from "../services/userService.js";
import AppError from "../utils/AppError.js";

export const currentUser = async (req, res) => {
    const userId = req.user.sub;
    const user = await findUserById(userId);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    res.json(user);
};

export const updateCurrentUser = async (req,res) =>{
    const userId =req.user.sub;
    const {name,email} =req.body;

    const updatedUser = await updateUser(userId,name,email);

    if(!updatedUser){
        throw new AppError("User not found",404);
    }

    res.json(updatedUser);
};

export const deleteCurrentUser = async (req,res) =>{
    const userId = req.user.sub;
    const deletedUser = await deleteUser(userId);

    if(!deletedUser){
        throw new AppError("User not found",404);
    }

    res.status(204).send();
};