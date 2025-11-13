import express from "express";
import bcrypt from "bcrypt";
import uid2 from "uid2";

import "../models/connection.js";
import User from "../models/users.js";
import { checkBody } from "../modules/checkBody.js";

const router = express.Router();

router.post("/signup", async (req, res) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ result: false, error: "Missing or empty fields" });
  }

  const email = req.body.email.trim().toLowerCase();
  const password = req.body.password.trim();

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ result: false, error: "Email already exists" });
    }

    const hash = bcrypt.hashSync(password, 10);

    const newUser = new User({
      email,
      password: hash,
      token: uid2(32),
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      result: true,
      token: savedUser.token,
      id: savedUser._id,
    });
  } catch (err: any) {
    // gestion d'erreur mongoose
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ result: false, error: "Duplicate key", details: err.keyValue });
    }

    console.error("❌ Error during signup:", err);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});




// SIGNIN 
router.post("/signin", async (req, res) => {
  if (!checkBody(req.body, ["email", "password"])) {
    return res.json({ result: false, error: "Missing or empty fields" });
  }

  try {
    const user = await User.findOne({ email: req.body.email });
    if (user && bcrypt.compareSync(req.body.password, user.password)) {
      res.json({
        result: true,
        token: user.token,
        id: user._id,          // pour reconnaître ton profil
        nickname: user.nickname,
        color: user.color,     // ta couleur stockée
      });
    } else {
      res.json({ result: false, error: "User not found or wrong password" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false, error: "Server error" });
  }
});


//  CREATE / UPDATE PROFILE 
router.put("/profile", async (req, res) => {
  const { token, nickname, color } = req.body;

  if (!token) {
    return res.json({ result: false, error: "Missing token" });
  }

  // Correction ici
  const updates: Record<string, any> = {};

  if (nickname) updates.nickname = nickname.trim();
  if (color) updates.color = color;

  try {
    const updatedUser = await User.findOneAndUpdate(
      { token },
      updates,
      { new: true } // retourne le document modifié
    );

    if (updatedUser) {
      return res.json({
        result: true,
        nickname: updatedUser.nickname,
        color: updatedUser.color,
      });
    } else {
      return res.json({ result: false, error: "User not found" });
    }
  } catch (err) {
    console.error("❌ Error during profile update:", err);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});


// GET USER BY TOKEN 
router.get("/:token", async (req, res) => {
  try {
    const user = await User.findOne({ token: req.params.token });
    if (user) {
      res.json({ result: true, user });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

// UPDATE BEST SCORE & LEVEL 
router.patch("/best", async (req, res) => {
  const { token, bestScore, bestLevel } = req.body;

  if (!token) {
    return res.json({ result: false, error: "Missing token" });
  }

  try {
    const user = await User.findOne({ token });
    if (!user) {
      return res.json({ result: false, error: "User not found" });
    }

    if (bestScore > (user.bestScore || 0)) user.bestScore = bestScore;
    if (bestLevel > (user.bestLevel || 0)) user.bestLevel = bestLevel;

    await user.save();

    res.json({
      result: true,
      bestScore: user.bestScore,
      bestLevel: user.bestLevel,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

// FRIEND SYSTEM 

// Envoyer une demande d’ami
router.post("/friends/request", async (req, res) => {
  const { senderToken, receiverNickname } = req.body;

  try {
    const sender = await User.findOne({ token: senderToken });
    const receiver = await User.findOne({ nickname: receiverNickname });

    if (!sender || !receiver) {
      return res.json({ result: false, error: "Utilisateur introuvable" });
    }

    if (receiver.friendRequests.includes(sender._id)) {
      return res.json({ result: false, error: "Demande déjà envoyée" });
    }

    receiver.friendRequests.push(sender._id);
    await receiver.save();

    res.json({ result: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

// Accepter une demande d’ami
router.post("/friends/accept", async (req, res) => {
  const { userToken, friendId } = req.body;

  try {
    const user = await User.findOne({ token: userToken });
    const friend = await User.findById(friendId);

    if (!user || !friend) return res.json({ result: false });

    user.friends.push(friend._id);
    friend.friends.push(user._id);

    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== friendId
    );

    await user.save();
    await friend.save();

    res.json({ result: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

router.get("/friends/leaderboard/:token", async (req, res) => {
  try {
    const user = await User.findOne({ token: req.params.token })
      .populate("friends", "nickname bestScore bestLevel color")
      .lean();

    if (!user) {
      return res.json({ result: false, error: "Utilisateur introuvable" });
    }

    // Typage explicite ici
    const friends = user.friends as unknown as Array<{
      _id: string;
      nickname: string;
      bestScore: number;
      bestLevel: number;
      color?: string;
    }>;

    const leaderboard = [
      ...friends,
      {
        _id: user._id,
        nickname: user.nickname || "Moi",
        bestScore: user.bestScore || 0,
        bestLevel: user.bestLevel || 0,
        color: user.color || "#b388ff",
      },
    ]
      .sort((a, b) => (b.bestScore || 0) - (a.bestScore || 0))
      .map((u) => ({
        id: u._id,
        nickname: u.nickname,
        bestScore: u.bestScore,
        bestLevel: u.bestLevel,
        color: u.color || "#b388ff",
      }));

    return res.json({ result: true, leaderboard });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ result: false, error: "Server error" });
  }
});


// CHECK NICKNAME (anti-doublon pseudo)
router.get("/check-nickname/:nickname", async (req, res) => {
  try {
    const nicknameToCheck = req.params.nickname.trim();
    const existing = await User.findOne({ nickname: nicknameToCheck });
    res.json({ exists: !!existing });
  } catch (err) {
    console.error("❌ Erreur check-nickname :", err);
    res.status(500).json({ exists: false, error: "Server error" });
  }
});

// Obtenir les demandes d’amis reçues
router.get("/friends/requests/:token", async (req, res) => {
  try {
    const user = await User.findOne({ token: req.params.token })
      .populate("friendRequests", "nickname color");
    if (!user) return res.json({ result: false, error: "User not found" });

    res.json({ result: true, requests: user.friendRequests });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false, error: "Server error" });
  }
});

// SUPPRIMER UN AMI
router.delete("/friends/delete", async (req, res) => {
  const { token, friendId } = req.body;

  if (!token || !friendId) {
    return res.json({ result: false, error: "Missing token or friendId" });
  }

  try {
    const user = await User.findOne({ token });
    const friend = await User.findById(friendId);

    if (!user || !friend) {
      return res.json({ result: false, error: "User not found" });
    }

    // Retirer chacun de la liste d'amis de l'autre
    user.friends = user.friends.filter((id) => id.toString() !== friendId);
    friend.friends = friend.friends.filter((id) => id.toString() !== user._id.toString());

    // Nettoyage des demandes si une restait par erreur
    user.friendRequests = user.friendRequests.filter(
      (id) => id.toString() !== friendId
    );
    friend.friendRequests = friend.friendRequests.filter(
      (id) => id.toString() !== user._id.toString()
    );

    await user.save();
    await friend.save();

    res.json({ result: true });
  } catch (err) {
    console.error("❌ Error deleting friend:", err);
    res.status(500).json({ result: false, error: "Server error" });
  }
});



export default router;
