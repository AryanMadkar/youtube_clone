const jwt = require("jsonwebtoken");
const usermodel = require("../models/user.models");
const virefyjwt = async (req, res, next) => {
  try {
    const token =
      req.cookies["newaccesstoken"] ||
      req.headers["authorization"].split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }
    if (token === "{}") {
      return res.status(401).json({ message: "Invalid token" });
    }
    console.log(token);

    const payload = jwt.verify(token, process.env.access_token_secret);

    const mainuser = await usermodel
      .findById(payload._id)
      .select("-password -refreshtoken");

    if (!mainuser) {
      return res.status(403).json({ message: "Unauthorized" });
    }
    req.user = mainuser;
    next();
  } catch (error) {
    console.error("Error verifying token:", error.message);
    return res.status(500).json({ message: "Failed to verify token" });
  }
};

module.exports = virefyjwt;
