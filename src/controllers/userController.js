import { findUserById } from "../services/userService.js";
import AppError from "../utils/AppError.js";

const currentUser = async (req, res) => {
    const userId = req.user.sub;
    const user = await findUserById(userId);

    if (!user) {
        throw new AppError("User not found", 404);
    }

    res.json(user);
};

export default currentUser;