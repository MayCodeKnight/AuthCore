import pool from "../config/db.js";

const findAllUsers = async()=>{
        const result = await pool.query("SELECT * FROM users");
        return result.rows;
};

export default findAllUsers;