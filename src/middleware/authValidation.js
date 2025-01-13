const jwt = require('jsonwebtoken');

const authenticateUser = async (req, res, next) => {
    try {
        const bearerToken = req.headers['authorization'];
        const token = bearerToken && bearerToken.split(' ')[1];

        
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: Missing reference token" });
        }

        const userDecode = jwt.verify(token, process.env.ACCESS_TOKEN_KEY);
        if (!userDecode) {
            return res.status(401).json({ redirect: 'Token expired' });
        }
        req.user = userDecode;
        next();
    } catch (error) {
        return res.status(401).send({ redirect: error.message });
    }
};

module.exports = authenticateUser;
