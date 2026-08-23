import pool from "../config/db.js";
import AppError from "../utils/AppError.js";

export const findAllUsers = async () => {
    const result = await pool.query(
        `SELECT id, name, email, role, created_at, updated_at
         FROM users`
    );
    return result.rows;
};

export const findUserById = async(id) => {
        const result = await pool.query(`SELECT id, name, email, role, created_at, updated_at
        FROM users
        WHERE id = $1`, [id]);
        return result.rows[0] || null;
};

export const updateUser = async(id,name,email) =>{
        try{
                const result = await pool.query(`UPDATE users SET 
                name = COALESCE($1,name),
                email = COALESCE($2,email),
                updated_at = CURRENT_TIMESTAMP
                WHERE id = $3 RETURNING id, name, email, role, created_at, updated_at`, [name,email,id]);
        }catch(error){
                if(error.code === "23505"){
                        throw new AppError("Email already exists",409);
                }
                throw error;
        }
        return result.rows[0] || null;
};

export const deleteUser = async (id) => {
    const result = await pool.query(
        `DELETE FROM users WHERE id = $1 RETURNING id`,
        [id]
    );

    return result.rows[0] || null;
};

export const updateUserRole = async (id, role) => {
    const result = await pool.query(
        `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, role, created_at, updated_at`,
        [role, id]
    );
    return result.rows[0] || null;
};