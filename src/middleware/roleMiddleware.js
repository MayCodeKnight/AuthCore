import AppError from "../utils/AppError.js";

export const requireRole = (role) =>{
    return (req,res,next) =>{
        if(req.user.role !== role){
            throw new AppError("Forbidden",403);
        }
        next();
    }
};