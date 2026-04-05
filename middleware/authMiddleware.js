import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* ================= PROTECT MIDDLEWARE ================= */
export const protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization?.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Not authorized, no token" });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id)
            .select("name email role room profileImage")
            .lean();

        if (!user) {
            return res.status(401).json({ message: "User not found" });
        }

        req.user = {
            ...user,
            id: user._id.toString(),
        };

        next();
    } catch (error) {
        console.log("AUTH ERROR:", error.message);
        return res.status(401).json({ message: "Token invalid or expired" });
    }
};

/* ================= ADMIN ONLY ================= */
export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        next();
    } else {
        return res.status(403).json({ message: "Admin access only" });
    }
};
