import mongoose from "mongoose";

const gameSchema = new mongoose.Schema({
  title: { type: String, required: true },

  // Référence(s) au(x) joueur(s)
  usersId: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
});

const Game = mongoose.model("Game", gameSchema);
export default Game;
