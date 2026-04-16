import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Otp from "../models/Otp.js";
import { syncStudentRoom } from "../utils/roomSync.js";
import { buildPublicFileUrl } from "../utils/url.js";
import { sendOtpEmail } from "../utils/email.js";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const SALT_ROUNDS = 10;

const normalizeEmail = (email = "") => String(email).trim().toLowerCase();
const sanitizeString = (value = "") => String(value || "").trim();
const sanitizeOptional = (value) => {
  const text = sanitizeString(value);
  return text || undefined;
};

const normalizeProfileImage = (profileImage = "") => {
  if (!profileImage) return "";
  if (
    profileImage.startsWith("http://") ||
    profileImage.startsWith("https://")
  ) {
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

const hashOtp = (otp) =>
  crypto.createHash("sha256").update(String(otp)).digest("hex");

const generateOtp = () =>
  String(Math.floor(100000 + Math.random() * 900000)).padStart(6, "0");

const validateEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePasswordStrength = (password = "") =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);

const signToken = (user) =>
  jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

const getProfileImageUrl = (req) =>
  req.file ? buildPublicFileUrl(req, `uploads/${req.file.filename}`) : "";

export const register = async (req, res) => {
  try {
    const role = sanitizeString(req.body.role || "student") || "student";
    const name = sanitizeString(req.body.name);
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");
    const adminCode = sanitizeString(req.body.adminCode);
    const hostelName = sanitizeOptional(req.body.hostelName);
    const roomNumber = sanitizeOptional(req.body.roomNumber);
    const floorNumber = sanitizeOptional(req.body.floorNumber);
    const branch = sanitizeOptional(req.body.branch);
    const course = sanitizeOptional(req.body.course);
    const rollNo = sanitizeOptional(req.body.rollNo);
    const phone = sanitizeOptional(req.body.phone);

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    if (!validatePasswordStrength(password)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase and a number.",
      });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: "User already exists.",
      });
    }

    if (role === "admin" && adminCode !== process.env.ADMIN_SECRET_CODE) {
      return res.status(403).json({
        success: false,
        message: "Invalid admin secret code.",
      });
    }

    if (role === "student" && (!hostelName || !roomNumber || !branch)) {
      return res.status(400).json({
        success: false,
        message: "Hostel name, room number and branch are required for students.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const profileImage = getProfileImageUrl(req);

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

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      token: signToken(user),
      user: formatUserProfile(user),
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to register user right now.",
    });
  }
};

export const login = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token: signToken(user),
      user: formatUserProfile(user),
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while logging in.",
    });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("room");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.json({
      success: true,
      user: formatUserProfile(user),
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to fetch profile.",
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const name = sanitizeString(req.body.name || user.name);
    const email = normalizeEmail(req.body.email || user.email);
    const phone = sanitizeString(req.body.phone || user.phone || "");
    const hostelName = sanitizeString(req.body.hostelName || user.hostelName || "");
    const roomNumber = sanitizeString(req.body.roomNumber || user.roomNumber || "");
    const floorNumber = sanitizeString(req.body.floorNumber || user.floorNumber || "");
    const branch = sanitizeString(req.body.branch || user.branch || "");
    const course = sanitizeString(req.body.course || user.course || "");
    const rollNo = sanitizeString(req.body.rollNo || user.rollNo || "");

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required.",
      });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const emailOwner = await User.findOne({ email, _id: { $ne: user._id } });

    if (emailOwner) {
      return res.status(400).json({
        success: false,
        message: "That email address is already in use.",
      });
    }

    user.name = name;
    user.email = email;
    user.phone = phone;

    if (user.role === "student") {
      user.hostelName = hostelName;
      user.roomNumber = roomNumber;
      user.floorNumber = floorNumber;
      user.branch = branch;
      user.course = course;
      user.rollNo = rollNo;
    }

    if (req.file) {
      user.profileImage = getProfileImageUrl(req);
    }

    await syncStudentRoom(user);
    await user.save();

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      user: formatUserProfile(user),
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to update profile right now.",
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Current, new and confirm password are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password must match.",
      });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase and a number.",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.resetOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to change password right now.",
    });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);

    if (!email || !validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.json({
        success: true,
        message: "If an account exists for this email, an OTP has been sent.",
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.resetOTP = otpHash;
    user.otpExpiry = otpExpiry;
    await user.save();

    await Otp.create({
      userId: user._id,
      email: user.email,
      otpHash,
      purpose: "password-reset",
      expiresAt: otpExpiry,
    });

    await sendOtpEmail({
      to: user.email,
      name: user.name,
      otp,
      expiryMinutes: OTP_EXPIRY_MINUTES,
    });

    return res.json({
      success: true,
      message: "If an account exists for this email, an OTP has been sent.",
      expiresInMinutes: OTP_EXPIRY_MINUTES,
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send OTP right now.",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = sanitizeString(req.body.otp);

    if (!email || !otp || otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: "Email and 6-digit OTP are required.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetOTP || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    if (user.otpExpiry.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    const incomingOtpHash = hashOtp(otp);

    if (incomingOtpHash !== user.resetOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    await Otp.findOneAndUpdate(
      {
        email,
        otpHash: incomingOtpHash,
        purpose: "password-reset",
      },
      {
        $set: {
          verifiedAt: new Date(),
        },
      },
      { sort: { createdAt: -1 } }
    );

    return res.json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP right now.",
    });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const otp = sanitizeString(req.body.otp);
    const newPassword = String(req.body.newPassword || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!email || !otp || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP, new password and confirm password are required.",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password must match.",
      });
    }

    if (!validatePasswordStrength(newPassword)) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters and include uppercase, lowercase and a number.",
      });
    }

    const user = await User.findOne({ email });

    if (!user || !user.resetOTP || !user.otpExpiry) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    if (user.otpExpiry.getTime() < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    if (hashOtp(otp) !== user.resetOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP is invalid or expired.",
      });
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    user.resetOTP = undefined;
    user.otpExpiry = undefined;
    await user.save();

    await Otp.updateMany(
      {
        email,
        purpose: "password-reset",
        verifiedAt: { $exists: false },
      },
      {
        $set: {
          verifiedAt: new Date(),
        },
      }
    );

    return res.json({
      success: true,
      message: "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reset password right now.",
    });
  }
};
