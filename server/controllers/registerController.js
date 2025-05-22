import User from "../model/user.model.js";
import bcrypt from "bcrypt";

// Create new user
export async function handleNewUser(req, res) {
  const { user, pwd } = req.body;
  if (!user || !pwd) {
    return res
      .status(400)
      .json({ message: "Username and password are required." });
  }

  const existUser = await User.findOne({ username: user });
  if (existUser) return res.sendStatus(409); // Conflict

  try {
    const hashedPwd = await bcrypt.hash(pwd, 10);
    const newUser = new User({ username: user, password: hashedPwd });

    // Store in MongoDB
    await newUser.save();

    console.log(newUser);
    res.status(201).json({ success: `New user ${user} created!` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

