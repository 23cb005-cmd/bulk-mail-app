const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const admin = await Admin.findOne({ email: email.toLowerCase().trim() });
  if (!admin) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const isMatch = await bcrypt.compare(password, admin.passwordHash);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: admin._id.toString(), email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
  );

  return res.json({
    token,
    admin: { id: admin._id, email: admin.email, name: admin.name },
  });
}

async function me(req, res) {
  const admin = await Admin.findById(req.admin.id).select("-passwordHash");
  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }
  return res.json({ admin });
}

module.exports = { login, me };
