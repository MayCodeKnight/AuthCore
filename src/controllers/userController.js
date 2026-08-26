import { findUserById,updateUser,deleteUser } from "../services/userService.js";
import AppError from "../utils/AppError.js";
import { isValidEmail } from "../utils/validation.js";

export const currentUser = async (req, res) => {
    const userId = req.user.sub;
    const user = await findUserById(userId);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    res.json(user);
};

export const updateCurrentUser = async (req, res) => {
    const userId = req.user.sub;
    const body = req.body;

    const allowedFields = ["name", "email"];
    const providedFields = Object.keys(body);
    
    if (providedFields.length === 0) {
        throw new AppError(
            "At least one field is required",
            400
        );
    }

    const hasInvalidField = providedFields.some(
        (field) => !allowedFields.includes(field)
    );

    if (hasInvalidField) {
        throw new AppError(
            "Only name and email can be updated",
            400
        );
    }
    const { name, email } = body;

    let normalizedName;
    let normalizedEmail;

    if (name !== undefined) {
        if (typeof name !== "string") {
            throw new AppError("Name must be a string", 400);
        }

        normalizedName = name.trim();

        if (
            normalizedName.length < 2 ||
            normalizedName.length > 100
        ) {
            throw new AppError(
                "Name must be between 2 and 100 characters long",
                400
            );
        }
    }

    if (email !== undefined) {
        if (typeof email !== "string") {
            throw new AppError("Email must be a string", 400);
        }

        normalizedEmail = email.trim().toLowerCase();

        if (!isValidEmail(normalizedEmail)) {
            throw new AppError("Invalid email format", 400);
        }
    }

    const updatedUser = await updateUser(
        userId,
        normalizedName,
        normalizedEmail
    );

    if (!updatedUser) {
        throw new AppError("User not found", 404);
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