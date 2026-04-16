import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { syncStudentRoom } from "../utils/roomSync.js";
import { buildPublicFileUrl } from "../utils/url.js";

/* ================= REGISTER ================= */

export const register = async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    const {
      name,
      email,
      password,
      role = "student",
      adminCode,

      hostelName,
      roomNumber,
      floorNumber,
      branch,
      course,
      rollNo,
      phone,
    } = req.body;

    // 🖼️ Image (multer)
    const profileImage = req.file
      ? buildPublicFileUrl(req, `uploads/${req.file.filename}`)
      : "";

    /* BASIC VALIDATION */
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Email and Password are required",
      });
    }

    /* CHECK EXISTING USER */
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    /* ADMIN VALIDATION */
    if (role === "admin") {
      if (adminCode !== process.env.ADMIN_SECRET_CODE) {
        return res.status(403).json({
          success: false,
          message: "Invalid Admin Secret Code",
        });
      }
    }

    /* STUDENT VALIDATION */
    if (role === "student") {
      if (!hostelName || !roomNumber || !branch) {
        return res.status(400).json({
          success: false,
          message: "Hostel & academic details required for student",
        });
      }
    }

    /* HASH PASSWORD */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* CREATE USER */
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,

      profileImage,

      hostelName: role === "student" ? hostelName : undefined,
      roomNumber: role === "student" ? roomNumber : undefined,
      floorNumber: role === "student" ? floorNumber : undefined,
      branch: role === "student" ? branch : undefined,
      course: role === "student" ? course : undefined,
      rollNo: role === "student" ? rollNo : undefined,

      phone,
    });

    await syncStudentRoom(user);
    await user.save();

    const userData = user.toObject();
    delete userData.password;

    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      user: userData,
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ================= LOGIN ================= */

export const login = async (req, res) => {
  try {
    console.log("LOGIN BODY:", req.body);

    const { email, password } = req.body;

    /* VALIDATION */
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    /* FIND USER */
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    /* PASSWORD CHECK */
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* TOKEN */
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* REMOVE PASSWORD */
    const userData = user.toObject();
    delete userData.password;

    /* RESPONSE */
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: userData,
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
