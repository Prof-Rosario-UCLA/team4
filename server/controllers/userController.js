import User from "../model/user.model.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) return res.status(204).json({ message: "No users found" });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error at getAllUsers." });
  }
};

export const getUserByID = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ message: "User ID required" });
    const { id } = req.params;
  try {
    const user = User.findById(id);
    if (!user) return res.status(204).json({ message: `User ID ${id} not found` });
  } catch (err) {
    res.status(500).json({ message: "Server error at getuserByID." });
  }
};
