const errorMiddleware = (err, req, res, next) => {
    console.error(err);

    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            message: "Invalid JSON"
        });
    }

    if (err.isOperational) {
        return res.status(err.statusCode).json({
            message: err.message
        });
    }

    return res.status(500).json({
        message: "Internal server error"
    });
};

export default errorMiddleware;