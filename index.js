require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectodb = require("./db/db");
const cookieParser = require("cookie-parser");
const router = require("./routes/user.router");
const app = express();

app.use(
  express.json({
    limit: process.env.limit,
  })
);
app.use(cors());
app.use(
  express.urlencoded({
    extended: true, // to support URL-encoded bodies
    limit: process.env.limit, // to limit the size of the body
  })
);
app.use(express.static("public"));
app.use(cookieParser());
app.use("/api/v1/user", router);

const port = process.env.PORT || 3000;
const server = () => {
  app.listen(port, () => {
    connectodb();
    console.log(`Server is running on port ${port}`);
  });
};
server();
