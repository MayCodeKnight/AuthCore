import pool from "../config/db.js";
import bcrypt from "bcrypt";
import AppError from "../utils/AppError.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import crypto from "crypto";
import {saveResetToken,resetUserPassword,findUserByResetToken} from "./userService.js";

dotenv.config();

export const findUserByEmail = async (email) =>{
    const result = await pool.query(`SELECT * FROM users WHERE email= $1`,[email]);

    return result.rows[0] || null;
};

export const hashPassword = async (newpassword) =>{
    const saltRounds = 10;

    const hashedPassword = await bcrypt.hash(newpassword,saltRounds);

    return hashedPassword;
};

export const registerUser = async (name, email, password) => {
    if (await findUserByEmail(email)) {
        throw new AppError("Email already exists",409);
    }

    const passwordHash = await hashPassword(password);

    const result = await pool.query(
        `INSERT INTO users (name, email, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, role, created_at, updated_at`,
        [name, email, passwordHash]
    );

    return result.rows[0];
};

export const loginUser = async (email, password) =>{
    const user = await findUserByEmail(email);
    if(!user){
        throw new AppError("Invalid email or password",401);
    }

    const isPasswordValid = await bcrypt.compare(password,user.password_hash);
    if(!isPasswordValid){
        throw new AppError("Invalid email or password",401);
    }

    const userToken = jwt.sign({
        sub: user.id,
        role: user.role,},
    process.env.JWT_SECRET,
    {expiresIn: "15m",});

    return {
        token: userToken
    };
};

export const generateResetToken = () =>{
    const resetToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const expiresAt = new Date(Date.now()+15*60*1000);

    return {
        resetToken,
        hashedToken,
        expiresAt
    };
} 

export const forgotPassword = async (email) =>{
    const user = await findUserByEmail(email);

    if(!user){
        return;
    }

    const {resetToken, hashedToken, expiresAt} = generateResetToken();

    const isSaved = await saveResetToken(user.id, hashedToken, expiresAt);

    if(!isSaved){
        throw new AppError("Failed to save reset token",500);
    }
    return resetToken;
};

export const resetPassword = async (token,newPassword) =>{
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await findUserByResetToken(hashedToken);

    if(!user){
        throw new AppError("Invalid or expired reset token",400);
    }

    const hashedPassword = await hashPassword(newPassword);

    const isUpdated = await resetUserPassword(user.id,hashedPassword);

    if(!isUpdated){
        throw new AppError("Failed to reset password",500);
    }
};
