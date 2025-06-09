import User from "../model/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

/*
Purpose:
Called from frontend when API returns 403 due to expired token.
Keeps user logged in without making them sign in again.

How it works:
Read the jwt cookie (refresh token)
Checks if it exists and matches a user in the DB
Verifies it with the secret
Issues a fresh access token if all valid
*/
export async function handleRefreshToken(req, res) {
  const cookies = req.cookies;
  if (!cookies?.jwt)
    // If we have cookies and if theres a jwt token
    return res.sendStatus(401);

  const refreshToken = cookies.jwt;

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Check if refresh token already exist in the db or not
    const foundUser = await User.findOne({
      username: decoded.username,
      refreshToken: refreshToken,
    });
    if (!foundUser) return res.sendStatus(403); // Forbidden

    const accessToken = jwt.sign(
      { username: decoded.username, userId: foundUser._id.toString() },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    res.json({ accessToken });
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.sendStatus(403);
  }
}
