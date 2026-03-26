import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import { register, login } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";

const router = express.Router();

/* ================= MULTER SETUP ================= */

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

/* ================= AUTH ================= */

router.post("/register", register);
router.post("/login", login);

/* ================= UPDATE PROFILE (IMAGE + DATA) ================= */

router.put(
    "/update-profile",
    protect,
    upload.single("image"),
    async (req, res) => {
        try {
            console.log("BODY:", req.body);
            console.log("FILE:", req.file);

            const user = await User.findById(req.user._id);

            if (!user) {
                return res.status(404).json({ message: "User not found" });
            }

            if (req.body.name) user.name = req.body.name;
            if (req.body.email) user.email = req.body.email;

            if (req.file) {
                user.profileImage =
                    req.protocol +
                    "://" +
                    req.get("host") +
                    "/uploads/" +
                    req.file.filename;
            }

            await user.save();

            res.json({ message: "Profile updated", user });

        } catch (error) {
            console.log("UPDATE ERROR:", error);
            res.status(500).json({ message: "Update failed" });
        }
    }
);

/* ================= CHANGE PASSWORD ================= */

router.put("/change-password", protect, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await User.findById(req.user._id);

        if (!user)
            return res.status(404).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isMatch)
            return res
                .status(400)
                .json({ message: "Current password incorrect" });

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.json({ message: "Password changed successfully" });

    } catch (error) {
        res.status(500).json({ message: "Password change failed" });
    }
});

export default router;