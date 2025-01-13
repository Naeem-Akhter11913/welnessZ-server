const jwt = require('jsonwebtoken');

const generateToken = async (credentials,secrete_key, tokenExp) => {
    try {
        const token = jwt.sign(credentials, secrete_key, { expiresIn: tokenExp });
        return {
            message: "Token generated",
            status: true,
            token
        }
    } catch (error) {
        return {
            message: error.message,
            status: false,
            token: null
        }
    }
}

module.exports = generateToken