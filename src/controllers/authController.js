import { registerUser as registerUserService, loginUser as loginUserService } from "../services/authService.js";
import AppError from "../utils/AppError.js";

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    if(!name || !email || !password){
        throw new AppError("Name, email and password are required", 400);
    }

    const user = await registerUserService(name, email, password);

    res.status(201).json(user);
};

export const loginUser = async (req, res) =>{
    const {email, password} = req.body;
    if(!email || !password){
        throw new AppError("Email and password are required", 400);
    }

    const token = await loginUserService(email, password);

    res.status(200).json(token);
};