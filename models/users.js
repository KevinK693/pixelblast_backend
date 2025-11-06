// backend/models/user.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  token:    { type: String, required: true },
  password: { type: String, required: true },
  nickname: { type: String, unique: true, sparse: true, trim: true },
  color:    { type: String, default: "#b388ff" },

  bestScore: { type: Number, default: 0, min: 0 },
  bestLevel: { type: Number, default: 1, min: 0 },

  gamesId:        [{ type: mongoose.Schema.Types.ObjectId, ref: "games" }],
  friends:        [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
  friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
});

export default mongoose.model("users", userSchema);

