import { registerUser as registerUserService,loginUser as loginUserService,forgotPassword as forgotPasswordService,resetPassword as resetPasswordService,refreshAccessToken as refreshAccessTokenService,logoutUser as logoutUserService} from "../services/authService.js";
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

export const forgotPassword = async (req,res) =>{
    const {email} = req.body;

    if(!email){
        throw new AppError("Email is required", 400);
    }

    await forgotPasswordService(email);

    res.status(200).json(
    {
      message: "If an account exists with that email, a password reset link has been sent."
    }
    )
};

export const resetPassword = async (req,res) =>{
    const {token, newPassword} = req.body;

    if(!token || !newPassword){
        throw new AppError("Token and new password are required", 400);
    }

    await resetPasswordService(token, newPassword);

    res.status(200).json(
    {
      message: "Password has been reset successfully."
    }
    )
};

export const refreshAccessToken = async (req,res) =>{
    const {refreshToken} = req.body;

    if(!refreshToken){
        throw new AppError("Refresh token is required", 400);
    }

    const result = await refreshAccessTokenService(refreshToken);

    res.status(200).json(result);
};

export const logoutUser = async (req,res) =>{
    const {refreshToken} = req.body;

    if(!refreshToken){
        throw new AppError("Refresh token is required", 400);
    }

    await logoutUserService(refreshToken);

    res.status(200).json(
    {
      message: "Logged out successfully."
    }
    )
};