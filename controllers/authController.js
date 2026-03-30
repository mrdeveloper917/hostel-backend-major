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

} = req.body;

/* validation */

if (!name || !email || !password) {
return res.status(400).json({
success:false,
message:"Name, Email and Password are required"
});
}

/* check existing user */

const userExists = await User.findOne({ email });

if (userExists) {
return res.status(400).json({
success:false,
message:"User already exists"
});
}

/* admin validation */

if (role === "admin") {

if (adminCode !== process.env.ADMIN_SECRET_CODE) {

return res.status(403).json({
success:false,
message:"Invalid Admin Secret Code"
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
floorNumber
});

res.status(201).json({
success:true,
message:"User Registered Successfully",
user
});

}catch(error){

console.error("REGISTER ERROR:", error);

res.status(500).json({
success:false,
message:error.message
});

}

};

/* ================= LOGIN ================= */

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      token,
      user,
    });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};