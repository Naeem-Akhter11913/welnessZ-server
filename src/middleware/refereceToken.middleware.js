// const jwt = require("jsonwebtoken");
// const ReferenceToken = require("../models/ReferenceToken");
// const User = require("../models/User");

// // Helper to generate a new access token
// const generateAccessToken = (userId, role, expiresIn = "15m") => {
//     return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn });
// };


// // Helper to handle token refresh
// const handleTokenRefresh = async (req, res, next) => {
//     const { referenceToken } = req.body || {};

//     if (!referenceToken) {
//         return res.status(401).json({ message: "Unauthorized: Missing reference token" });
//     }

//     try {
//         // Validate the reference token
//         const storedToken = await ReferenceToken.findOne({ token: referenceToken });
//         if (!storedToken || storedToken.expiresAt < new Date()) {
//             return res.status(401).json({ message: "Unauthorized: Invalid or expired reference token" });
//         }

//         // Generate a new access token
//         const user = await User.findById(storedToken.userId);
//         const newAccessToken = generateAccessToken(user.id, user.role);

//         // Set the new access token in the secure cookie
//         res.cookie("accessToken", newAccessToken, {
//             httpOnly: true,
//             secure: true,
//             sameSite: "None",
//             maxAge: 15 * 60 * 1000, // 15 minutes
//         });

//         // Attach user to request
//         req.user = { id: user.id, role: user.role };
//         next();
//     } catch (error) {
//         console.error("Error during token refresh:", error);
//         return res.status(500).json({ message: "Internal server error during token refresh" });
//     }
// };

// const refreshTokenMiddleware = async (req, res, next) => {
//     try {
//         // Check if access token exists in the cookies
//         const accessToken = req.cookies.accessToken;
//         if (!accessToken) {
//             return res.status(401).json({ message: "Unauthorized: No access token" });
//         }

//         // Verify the access token
//         jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
//             if (!err) {
//                 // Token is valid, attach user details and proceed
//                 req.user = decoded;
//                 return next();
//             }

//             // If token is expired, handle refresh
//             if (err.name === "TokenExpiredError") {
//                 handleTokenRefresh(req, res, next);
//             } else {
//                 return res.status(401).json({ message: "Invalid access token" });
//             }
//         });
//     } catch (error) {
//         console.error("Error in refreshTokenMiddleware:", error);
//         return res.status(500).json({ message: "Internal server error" });
//     }
// };


// module.exports = refreshTokenMiddleware;


const jwt = require("jsonwebtoken");
const referecetokenModel = require("../schema/token.user.modal");
const User = require("../models/User");

// Helper to generate a new access token
const generateAccessToken = (userId, role, expiresIn = "15m") => 
    jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn });

// Helper to validate the reference token and generate a new access token
const refreshAccessToken = async (referenceToken) => {
    const storedToken = await referecetokenModel.findOne({ token: referenceToken });

    if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error("Invalid or expired reference token");
    }

    const user = await User.findById(storedToken.userId);
    if (!user) {
        throw new Error("User not found");
    }

    return generateAccessToken(user.id, user.role);
};

// Middleware to handle token refresh
const handleTokenRefresh = async (req, res, next) => {
    const { referenceToken } = req.signedCookies.token

    if (!referenceToken) {
        return res.status(401).json({ message: "Unauthorized: Missing reference token" });
    } 

    try {
        const newAccessToken = await refreshAccessToken(referenceToken);

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "None",
            maxAge: 15 * 60 * 1000, // 15 minutes
        });

        const decoded = jwt.decode(newAccessToken);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        console.error("Error during token refresh:", error.message);
        return res.status(401).json({ message: error.message });
    }
};

// Main middleware to validate or refresh the access token
const refreshTokenMiddleware = async (req, res, next) => {
    try {
        const accessToken = req.cookies.accessToken;

        if (!accessToken) {
            return res.status(401).json({ message: "Unauthorized: No access token" });
        }

        jwt.verify(accessToken, process.env.JWT_SECRET, (err, decoded) => {
            if (!err) {
                // Token is valid
                req.user = decoded;
                return next();
            }

            // Handle expired token
            if (err.name === "TokenExpiredError") {
                return handleTokenRefresh(req, res, next);
            }

            return res.status(401).json({ message: "Invalid access token" });
        });
    } catch (error) {
        console.error("Error in refreshTokenMiddleware:", error.message);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = refreshTokenMiddleware;
