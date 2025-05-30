import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../model/user.model.js";

dotenv.config();

/*
Purpose:
Middleware that runs before protected routes
Verifies the access token sent in Authorization: Bearer <token> header
*/
export async function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.sendStatus(401); // Unauthorized

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // Use the userId from the token directly
    req.user = {
      _id: decoded.userId,
      username: decoded.username,
    };

    next();
  } catch (err) {
    console.error("JWT verification error: ", err);
    return res.sendStatus(403); // Forbidden - invalid token
  }
}
