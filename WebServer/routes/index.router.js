const express = require('express');
const router = express.Router();
const authRouter = require("../routes/auth.router");
const postRouter = require("../routes/posts.router");
const userRouter = require("../routes/user.router");
const agencyRouter = require("../routes/agency.router");

router.use("/auth", authRouter);
router.use("/post", postRouter);
router.use("/user", userRouter);
router.use("/agency", agencyRouter);

module.exports = router;