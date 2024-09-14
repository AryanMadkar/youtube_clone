const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jsonwebtoken = require("jsonwebtoken");
const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      minlength: 6,
      maxlength: 20,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
      index: true,
    },
    avatar: {
      type: String,
      required: true,
    },
    coverimage: {
      type: String,
    },
    watchhistory: [{ type: [mongoose.Schema.Types.ObjectId], ref: "Video" }],
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    refreshtoken: {
      type: String,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.ispasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  const accesstoken = jsonwebtoken.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullname: this.fullname,
    },
    process.env.access_token_secret,
    {
      expiresIn: process.env.access_token_expeiry,
    }
  );
  return accesstoken;
};
userSchema.methods.generateRefreshToken = async function () {
  const refreshtoken = jsonwebtoken.sign(
    {
      _id: this._id,
    },
    process.env.refresh_token_secret,
    {
      expiresIn: process.env.refresh_token_expeiry,
    }
  );
  return refreshtoken;
};

const usermodel = mongoose.model("User", userSchema);

module.exports = usermodel;
