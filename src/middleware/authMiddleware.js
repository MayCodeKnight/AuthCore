import jwt from "jsonwebtoken";
import AppError  from "../utils/AppError.js";


const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        throw new AppError("Authorization required", 401);
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
        throw new AppError("Invalid authorization header", 401);
    }

    let verified;

    try {
        verified = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        throw new AppError("Invalid or expired token", 401);
    }

    req.user = verified;
    req.token = token;

    next();
};

export default authMiddleware;