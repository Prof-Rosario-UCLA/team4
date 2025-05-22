import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

/*
Purpose:
Middleware tha runs before protected routes
Verifies the access token sent in Authorization: Bearer <token> header
*/
export function verifyJWT(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.sendStatus(401); // Unauthorize

  console.log(authHeader); // Bearer token

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) return res.sendStatus(403); // Forbidden - invalid token
    req.user = decoded.username;
    next();
  });
}
