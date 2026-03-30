import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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

      // optional fields
      gender,
      phone,
      branch,
      course,
      rollNo,
      hostelName,
      roomNumber,
      floorNumber,
    } = req.body;

    /* validation */
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, Email and Password are required",
      });
    }

    /* check existing user */
    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    /* admin validation */
    if (role === "admin") {
      if (adminCode !== process.env.ADMIN_SECRET_CODE) {
        return res.status(403).json({
          success: false,
          message: "Invalid Admin Secret Code",
        });
      }
    }

    /* hash password */
    const hashedPassword = await bcrypt.hash(password, 10);

    /* create user */
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      gender,
      phone,
      branch,
      course,
      rollNo,
      hostelName,
      roomNumber,
      floorNumber,
    });

    res.status(201).json({
      success: true,
      message: "User Registered Successfully",
      user,
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

    /* validation */
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and Password are required",
      });
    }

    /* find user */
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    /* compare password */
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    /* generate token */
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    /* remove password before sending */
    const userData = user.toObject();
    delete userData.password;

    /* FINAL RESPONSE */
    res.status(200).json({
      success: true,
      message: "Login successful",
      token,          // 🔥 IMPORTANT (frontend ke liye)
      user: userData, // 🔥 safe user data
    });

  } catch (error) {
    console.log("LOGIN ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};