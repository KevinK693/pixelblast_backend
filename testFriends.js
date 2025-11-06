import fetch from "node-fetch";

const BACK_URL = "http://localhost:3000/users"; // ou ton URL en ligne si hébergé

async function runTests() {
  console.log("🚀 TEST DU SYSTÈME D'AMIS");
  console.log("====================================");

  // 1️⃣ Création des deux comptes
  console.log("📦 Création des deux utilisateurs...");

  const playerARes = await fetch(`${BACK_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "playerA@test.com",
      password: "test123",
      nickname: "PlayerA_" + Math.floor(Math.random() * 1000),
    }),
  });
  const playerA = await playerARes.json();

  const playerBRes = await fetch(`${BACK_URL}/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "playerB@test.com",
      password: "test123",
      nickname: "PlayerB_" + Math.floor(Math.random() * 1000),
    }),
  });
  const playerB = await playerBRes.json();

  if (!playerA.result || !playerB.result) {
    console.log("❌ Erreur création comptes:", playerA, playerB);
    return;
  }

  console.log("✅ Comptes créés !");
  console.log("A:", playerA.nickname, playerA.token);
  console.log("B:", playerB.nickname, playerB.token);

  // 2️⃣ A envoie une demande à B
  console.log("\n💌 Envoi de la demande d’ami A → B...");
  const reqRes = await fetch(`${BACK_URL}/friends/request`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      senderToken: playerA.token,
      receiverNickname: playerB.nickname,
    }),
  });
  console.log("Résultat:", await reqRes.json());

  // 3️⃣ On récupère B pour avoir les ID
  const bInfoRes = await fetch(`${BACK_URL}/${playerB.token}`);
  const bInfo = await bInfoRes.json();
  const friendId = bInfo.user.friendRequests[0];
  console.log("📬 ID de la demande reçue:", friendId);

  // 4️⃣ B accepte la demande
  console.log("\n✅ Acceptation par B...");
  const acceptRes = await fetch(`${BACK_URL}/friends/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userToken: playerB.token,
      friendId: friendId,
    }),
  });
  console.log("Résultat:", await acceptRes.json());

  // 5️⃣ Vérifie le leaderboard pour A
  console.log("\n🏆 Lecture du leaderboard pour A...");
  const leadRes = await fetch(`${BACK_URL}/friends/leaderboard/${playerA.token}`);
  const lead = await leadRes.json();
  console.log(JSON.stringify(lead, null, 2));

  console.log("\n✅ TEST TERMINÉ !");
}

runTests().catch((err) => console.error("❌ Erreur globale:", err));
