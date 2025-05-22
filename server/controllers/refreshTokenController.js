import User from "../model/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

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
export async function handleRefreshToken (req, res) {
  const cookies = req.cookies;
  if (!cookies?.jwt)    // If we have cookies and if theres a jwt token
    return res.sendStatus(401);

  console.log(cookies.jwt);

  const refreshToken = cookies.jwt;

  // Check if refresh token already exist in the db or not
  const foundUser = await User.findOne({ refreshToken: refreshToken });
  if (!foundUser) return res.sendStatus(403); // Forbidden

  // Verify the refresh token. Send an access token if refresh token is valid
  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    (err, decoded) => {
        if (err || foundUser.username !== decoded.username) return res.sendStatus(403);
        const accessToken = jwt.sign(
            { "username": decoded.username },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '30s' }
        );
        res.json({ accessToken });
    }
  );
}
