const express = require("express");

const {
  registeruser,
  loginuser,
  logoutuser,
  refreshTokensroute,
  changepassword,
  getcurrentuser,
  updateaccountdetails,
  updateuseravatar,
  updatecoverimage,
  getuserchannelprofile,
  getwatchhistory,
} = require("../controllers/use.controllers");
const { upload } = require("../middlewares/multer");
const virefyjwt = require("../middlewares/auth.middleware");
const router = express.Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverimage", maxCount: 1 },
  ]),
  registeruser
);
router.route("/login").post(loginuser);
router.route("/logout").post(virefyjwt, logoutuser);
router.route("/refresh_token").post(refreshTokensroute);
router.route("/changepassword").post(virefyjwt, changepassword);
router.route("/current_user").get(getcurrentuser);
router.route("/updataaccount").patch(virefyjwt, updateaccountdetails);
router
  .route("/avatar")
  .patch(virefyjwt, upload.single("avatar"), updateuseravatar);

router
  .route("/coverimage")
  .patch(virefyjwt, upload.single("coverimage"), updatecoverimage);

router.route("/c/:username").get(virefyjwt, getuserchannelprofile);

router.route("/watchhistory").get(virefyjwt, getwatchhistory);
module.exports = router;
