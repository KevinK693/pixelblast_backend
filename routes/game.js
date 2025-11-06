import express from 'express';
import { checkBody } from '../modules/checkBody.js';
import User from '../models/users.js';
import Game from '../models/game.js';

const router = express.Router();

// === CREATE GAME ===
router.post('/create', async (req, res) => {
  // Vérifie que les champs de base sont présents
  if (!checkBody(req.body, ['token', 'title', 'score', 'niveau'])) {
    return res.json({ result: false, error: 'Missing or empty fields' });
  }

  try {
    // Récupère l'utilisateur via le token
    const user = await User.findOne({ token: req.body.token });
    if (!user) {
      return res.json({ result: false, error: 'User not found' });
    }

    // Crée la partie
    const newGame = new Game({
      title:  req.body.title,
      score:  req.body.score,
      niveau: req.body.niveau,
      usersId: [user._id],
    });

    const savedGame = await newGame.save();

    // (optionnel) relier la partie à l'utilisateur
    user.gamesId = savedGame._id;
    await user.save();

    res.json({ result: true, game: savedGame });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: false, error: 'Server error' });
  }
});

export default router;
