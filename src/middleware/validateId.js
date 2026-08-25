import AppError from "../utils/AppError.js";

const validateId = (req, res, next) => {
    const { id } = req.params;

    if (!/^\d+$/.test(id) || Number(id) <= 0) {
        throw new AppError("Invalid user ID", 400);
    }

    next();
};

export default validateId;