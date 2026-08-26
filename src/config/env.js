import dotenv from "dotenv";

dotenv.config({
    path: process.env.NODE_ENV === "test"
        ? ".env.test"
        : ".env"
});

const requiredEnv = [
    "JWT_SECRET",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD"
];

for (const key of requiredEnv) {
    if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
}