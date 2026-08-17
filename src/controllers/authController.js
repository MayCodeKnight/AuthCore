import { registerUser as registerUserService } from "../services/authService.js";
import AppError from "../utils/AppError.js";

const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    if(!name || !email || !password){
        throw new AppError("Name, email and password are required", 400);
    }

    const user = await registerUserService(name, email, password);

    res.status(201).json(user);
};

export default registerUser;