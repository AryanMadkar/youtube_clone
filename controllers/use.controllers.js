const usermodel = require("../models/user.models");
const { uploadVideo } = require("../utils/fileuplode");
const jwt = require("jsonwebtoken");

const registeruser = async (req, res) => {
  try {
    const { username, fullname, email, password } = req.body;

    // Check if any required field is missing
    if (
      [username, fullname, email, password].some(
        (field) => field?.trim() === ""
      )
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if the user already exists
    const existingUser = await usermodel.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const avatarlocalpath = req.files?.avatar?.[0]?.path;
    const coverimagelocalpath = req.files?.coverimage?.[0]?.path;

    if (!coverimagelocalpath) {
      return res.status(400).json({ message: "Cover image is required" });
    }

    if (!avatarlocalpath) {
      return res.status(400).json({ message: "Avatar is required" });
    }

    // Upload avatar and cover image
    const avatar = await uploadVideo(avatarlocalpath);
    const coverimage = await uploadVideo(coverimagelocalpath);

    if (!avatar) {
      return res.status(400).json({ message: "Avatar upload failed" });
    }

    // Create the user
    const user = await usermodel.create({
      fullname,
      email,
      username: username.toLowerCase(),
      password,
      avatar: avatar.url,
      coverimage: coverimage?.url || "",
    });

    // Remove sensitive information before sending the response
    const createduser = user.toObject();
    delete createduser.password;
    delete createduser.refreshtoken;

    // Send the response with the created user
    return res.status(200).json({
      message: "User registered successfully",
      user: createduser,
    });
  } catch (error) {
    console.log("Error in usercontroller", error); // Log the actual error for debugging
    res.status(500).json({ message: error.message });
  }
};

const generateacesandrefreshtokens = async (userId) => {
  try {
    const newuser = await usermodel.findById(userId);
    const newaccesstoken = await newuser.generateAccessToken();
    const refreshtoken = await newuser.generateRefreshToken();

    newuser.refreshtoken = refreshtoken;
    await newuser.save({
      validateBeforeSave: false,
    });
    return { newaccesstoken, refreshtoken };
  } catch (error) {
    console.log("error in generateacesandref", error); // Log the actual error for debugging
  }
};

const loginuser = async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!(username || email)) {
      return res.status(400).json({ message: "username or email required" });
    }
    const user = await usermodel.findOne({
      $or: [{ username: username }, { email }],
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordCorrect = await user.ispasswordCorrect(password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    const { newaccesstoken, refreshtoken } = await generateacesandrefreshtokens(
      user._id
    );

    const loginneduser = await usermodel
      .findById(user._id)
      .select(" -password -refreshtoken");

    const options = {
      httpOnly: true, // Prevent access from client-side scripts
      secure: true, // Set based on request protocol
    };

    res.cookie("newaccesstoken", newaccesstoken, options);
    res.cookie("refreshtoken", refreshtoken, options);
    return res.status(200).json({
      message: "User logged in successfully",
      user: loginneduser,
      accesstoken: newaccesstoken,
      refreshtoken: refreshtoken,
    });
  } catch (error) {
    console.log(error); // Log the actual error for debugging
  }
};

const logoutuser = async (req, res) => {
  try {
    await usermodel.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          refreshtoken: undefined,
        },
      },
      {
        new: true,
      }
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .clearCookie("access_token", options)
      .clearCookie("refresh_token", options)
      .json({
        message: "User logged out successfully",
      });
  } catch (error) {
    console.log(error); // Log the actual
  }
};

const refreshTokensroute = async (req, res) => {
  try {
    const incomingrefreshtoken =
      req.cookies.refreshTokens || req.body.refreshTokens;
    if (!incomingrefreshtoken) {
      return res.status(401).json({ message: "Refresh token is required" });
    }
    const decodedtoken = jwt.verify(
      incomingrefreshtoken,
      process.env.refresh_token_secret
    );

    const refreshtokenuser = await usermodel.findById(decodedtoken?._id);
    if (
      !refreshtokenuser ||
      refreshtokenuser?.refreshtoken !== incomingrefreshtoken
    ) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }
    const { newaccesstoken, refreshtoken } = await generateacesandrefreshtokens(
      refreshtokenuser._id
    );

    const options = {
      httpOnly: true, // Prevent access from client-side scripts
      secure: true, // Set based on request protocol
    };
    res.cookie("newaccesstoken", newaccesstoken, options);
    res.cookie("refreshtoken", refreshtoken, options);
    return res.status(200).json({
      accesstoken: newaccesstoken,
      refreshtoken: refreshtoken,
      message: "tokens refreshed",
    });
  } catch (error) {
    console.log(error); // Log the actual error for debugging
    res.status(500).json({ message: error.message });
  }
};

const changepassword = async (req, res) => {
  try {
    const { oldpassword, newpassword, confermpassword } = req.body;
    if (!oldpassword || !newpassword || !confermpassword) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (newpassword !== confermpassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const newuser = await usermodel.findById(req.user?._id);
    if (!newuser) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordCorrect = await newuser.ispasswordCorrect(oldpassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    newuser.password = newpassword;
    await newuser.save({
      validateBeforeSave: false,
    });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.log(error); // Log the actual error for debugging
    res.status(500).json({ message: error.message });
  }
};

const getcurrentuser = async (req, res) => {
  try {
    return res.status(200).json({
      user: req.user,
      message: "current user fetch successfually",
    });
  } catch (error) {}
};

const updateaccountdetails = async (req, res) => {
  try {
    const { fullname, email } = req.body;
    if (!(fullname || email)) {
      return res
        .status(400)
        .json({ message: "fullname and email are required" });
    }
    const newuser2 = usermodel
      .findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            fullname,
            email,
          },
        },
        { new: true }
      )
      .select("-password");

    return res.status(200).json({
      user: newuser2,
      message: "account details updated successfully",
    });
  } catch (error) {
    console.log(error); // Log the actual error for debugging
    res.status(500).json({ message: error.message });
  }
};

const updateuseravatar = async (req, res) => {
  try {
    const avatarpath = req.file?.path;
    if (!avatarpath) {
      return res.status(400).json({ message: "Avatar is required" });
    }
    const newavatar = await uploadVideo(avatarpath);
    if (!newavatar.url) {
      return res.status(400).json({ message: "Avatar upload failed" });
    }

    const newuser3 = await usermodel
      .findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            avatar: newavatar.url,
          },
        },
        { new: true }
      )
      .select("-password");
    return res.status(200).json({
      newurl: newavatar.url,
      message: "avatar updated successfully",
    });
  } catch (error) {
    console.log(error); // Log the actual error for debugging
    res.status(500).json({ message: error.message });
  }
};

const updatecoverimage = async (req, res) => {
  try {
    const coverimage = req.files?.path;
    if (!coverimage) {
      return res.status(400).json({ message: "Cover image is required" });
    }
    const newcover = await uploadVideo(coverimage);
    if (!newcover.url) {
      return res.status(400).json({ message: "Cover image upload failed" });
    }
    const newuser4 = await usermodel
      .findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            coverimage: newcover.url,
          },
        },
        { new: true }
      )
      .select("-password");
    return res.status(200).json({
      newurl: newcover.url,
      message: "avatar updated successfully",
    });
  } catch (error) {
    console.log(error); // Log the actual error for debugging
    res.status(500).json({ message: error.message });
  }
};

const getuserchannelprofile = async (req, res) => {
  const { username } = req.params;

  // Check if the username is valid
  if (!username?.trim()) {
    return res.status(400).json({ message: "Username is required" });
  }

  try {
    const channel = await usermodel.aggregate([
      {
        $match: {
          username: username.toLowerCase(),
        },
      },
      {
        $lookup: {
          from: "Subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "SubscribersFrom",
        },
      },
      {
        $lookup: {
          from: "Subscriptions",
          localField: "_id",
          foreignField: "Subscriber",
          as: "SubscribedTo",
        },
      },
      {
        $addFields: {
          subscriberscount: {
            $size: "$SubscribersFrom",
          },
          channelssubscribetocount: {
            $size: "$SubscribedTo",
          },
          issubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$SubscribersFrom.Subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullname: 1,
          username: 1,
          subscriberscount: 1,
          channelssubscribetocount: 1,
          issubscribed: 1,
          avatar: 1,
          coverimage: 1,
          email: 1,
        },
      },
    ]);

    // Check if the channel was found
    if (!channel || channel.length === 0) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Return the found channel
    res.status(200).json(channel[0]);
  } catch (error) {
    // Handle any errors
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getwatchhistory = async (req, res) => {
  const user = await usermodel.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "Videos",
        localField: "watchhistory",
        foreignField: "_id",
        as: "watchhistory",
        pipeline: [
          {
            $lookup: {
              from: "Users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullname: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);
  return res.status(200).json({
    watchhistory: user[0]?.watchhistory || [],
    message: "watch history fetched successfully",
  });
};

module.exports = {
  getwatchhistory,
  getuserchannelprofile,
  registeruser,
  loginuser,
  logoutuser,
  refreshTokensroute,
  changepassword,
  getcurrentuser,
  updateaccountdetails,
  updateuseravatar,
  updatecoverimage,
};
