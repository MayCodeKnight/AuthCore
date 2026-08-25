export const isValidEmail = (email) =>{
    return  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isValidPassword = (password) =>{
    return typeof password === "string" && password.length >= 8;
};