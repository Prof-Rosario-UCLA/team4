import User from "../model/user.model.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config({ path: '../.env' });

/*
Purpose:

*/
export async function handleLogout (req, res) {
  // On client, also delete the accessToken

  const cookies = req.cookies;
  if (!cookies?.jwt)    // If we have cookies and if theres a jwt token
    return res.sendStatus(204); // No content

  const refreshToken = cookies.jwt;

  // Check if refresh token already exist in the db or not
  const foundUser = await User.findOne({ refreshToken: refreshToken });
  if (!foundUser){
    res.clearCookie('jwt', { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 });
    return res.sendStatus(204); // No content
  }

  // Delete the refresh token in the database
  foundUser.refreshToken = '';
  await foundUser.save();

  res.clearCookie('jwt', { httpOnly: true, samSite: 'None', secure: true, maxAge: 24 * 60 * 60 * 1000 });  // secure: true - only serves on https
  res.sendStatus(204);
}
