import express from "express";
import bcrypt from "bcryptjs";
import multer from "multer";
import fs from "fs";
import { register, login } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import { syncStudentRoom } from "../utils/roomSync.js";
import { buildPublicFileUrl } from "../utils/url.js";

const router = express.Router();

const normalizeProfileImage = (profileImage = "") => {
  if (!profileImage) return "";
  if (profileImage.startsWith("http://") || profileImage.startsWith("https://")) {
    return profileImage;
  }

  return `/${profileImage.replace(/^\/+/, "")}`;
};

const formatUserProfile = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone || "",
  hostelName: user.hostelName || "",
  roomNumber: user.roomNumber || "",
  floorNumber: user.floorNumber || "",
  branch: user.branch || "",
  course: user.course || "",
  rollNo: user.rollNo || "",
  profileImage: normalizeProfileImage(user.profileImage),
  room: user.room || null,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

const buildProfileImageUrl = (req, file) =>
  buildPublicFileUrl(req, `uploads/${file.filename}`);

/* ================= MULTER SETUP ================= */

const uploadDir = "uploads/";

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const safeName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

/* ================= AUTH ================= */

// 🔥 REGISTER WITH IMAGE
router.post(
  "/register",
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "Image size must be 5MB or less" });
        }
        return res.status(400).json({ message: error.message });
      }

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      next();
    });
  },
  register
);

// 🔐 LOGIN
router.post("/login", login);

/* ================= UPDATE PROFILE ================= */

router.put(
  "/update-profile",
  protect,
  (req, res, next) => {
    upload.single("image")(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ message: "Image size must be 5MB or less" });
        }
        return res.status(400).json({ message: error.message });
      }

      if (error) {
        return res.status(400).json({ message: error.message });
      }

      next();
    });
  },
  async (req, res) => {
    try {
      const user = await User.findById(req.user._id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // 📝 Update fields
      if (req.body.name) user.name = req.body.name;
      if (req.body.email) user.email = req.body.email;
      if (req.body.phone) user.phone = req.body.phone;

      // 🏠 Student fields
      if (req.body.hostelName) user.hostelName = req.body.hostelName;
      if (req.body.roomNumber) user.roomNumber = req.body.roomNumber;
      if (req.body.floorNumber) user.floorNumber = req.body.floorNumber;
      if (req.body.branch) user.branch = req.body.branch;
      if (req.body.course) user.course = req.body.course;
      if (req.body.rollNo) user.rollNo = req.body.rollNo;

      // 🖼️ Image update
      if (req.file) {
        user.profileImage = buildProfileImageUrl(req, req.file);
      }

      await syncStudentRoom(user);
      await user.save();

      res.json({
        success: true,
        message: "Profile updated successfully",
        user: formatUserProfile(user),
      });

    } catch (error) {
      console.log("UPDATE ERROR:", error);
      res.status(500).json({
        success: false,
        message: "Update failed",
      });
    }
  }
);

/* ================= CHANGE PASSWORD ================= */

router.put("/change-password", protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: "Both passwords are required",
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isMatch) {
      return res.status(400).json({
        message: "Current password incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Password change failed",
    });
  }
});

export default router;
