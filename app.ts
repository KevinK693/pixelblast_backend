import express from "express";
import dotenv from "dotenv";
import userRouter from "./routes/users";
import gameRouter from "./routes/game";

dotenv.config();
const app = express();

// ⚡️ Déclare PORT avant app.listen
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Routes
app.use("/users", userRouter);
app.use("/game", gameRouter);

app.get("/ping", (req, res) => {
    res.json({ message: "pong ✅" });
  });

// Lancement du serveur
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
