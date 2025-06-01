import User from "../model/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export async function handleLogin(req, res) {
  const { user, pwd } = req.body;
  if (!user || !pwd)
    return res
      .status(400)
      .json({ message: "Username and password are required." });

  // Check for usernames in the db
  const foundUser = await User.findOne({ username: user });
  if (!foundUser) return res.sendStatus(401); // Unauthorized

  // Evaluate Password
  const match = await bcrypt.compare(pwd, foundUser.password);
  if (match) {
    // Create JWTs
    const accessToken = jwt.sign(
      {
        username: foundUser.username,
        userId: foundUser._id.toString(),
      },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    const refreshToken = jwt.sign(
      { username: foundUser.username },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Store the current refreshtoken in to the correspond user in MongoDB
    foundUser.refreshToken = refreshToken;
    await foundUser.save();

    // Store the refreshtoken also in http-only cookie
    res.cookie("jwt", refreshToken, {
      httpOnly: true,
      samSite: "None",
      secure: true,
      maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
    });

    res.json({ accessToken });
  } else {
    res.sendStatus(401); // Unauthorized
  }
}
