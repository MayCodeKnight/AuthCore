import pool from "../config/db.js";

export const findAllUsers = async()=>{
        const result = await pool.query("SELECT * FROM users");
        return result.rows;
};

export const findUserById = async(id) => {
        const result = await pool.query(`SELECT id, name, email, role, created_at, updated_at
        FROM users
        WHERE id = $1`, [id]);
        return result.rows[0] || null;
};