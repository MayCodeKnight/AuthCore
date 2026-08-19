import {findAllUsers} from "../services/userService.js";

const getAllUsers = async (req,res) => {
    const result = await findAllUsers();
    res.json({
        users: result
    });
}

export default getAllUsers;