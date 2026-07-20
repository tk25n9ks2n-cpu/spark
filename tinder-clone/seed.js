// seed.js
// Populates sample data into Firestore matching the dating app data model.
// Run with: node seed.js

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seed() {
  console.log("Seeding Firestore...");

  const userAId = "user_alice";
  const userBId = "user_bob";

  await db.collection("users").doc(userAId).set({
    email: "alice@example.com",
    name: "Alice",
    dob: admin.firestore.Timestamp.fromDate(new Date("1998-04-12")),
    gender: "female",
    bio: "Love hiking and coffee.",
    avatarUrl: "https://example.com/avatars/alice.jpg",
    settings: { notifications: true, distanceUnit: "km" },
    verified: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("Created user:", userAId);

  await db.collection("users").doc(userBId).set({
    email: "bob@example.com",
    name: "Bob",
    dob: admin.firestore.Timestamp.fromDate(new Date("1996-09-03")),
    gender: "male",
    bio: "Musician and dog dad.",
    avatarUrl: "https://example.com/avatars/bob.jpg",
    settings: { notifications: true, distanceUnit: "mi" },
    verified: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("Created user:", userBId);

  await db
    .collection("users")
    .doc(userAId)
    .collection("photos")
    .doc("photo_1")
    .set({
      url: "https://example.com/photos/alice_1.jpg",
      order: 0,
      isVerified: true,
    });
  console.log("Created photo for", userAId);

  await db
    .collection("users")
    .doc(userAId)
    .collection("posts")
    .doc("post_1")
    .set({
      imageUrl: "https://example.com/posts/alice_hike.jpg",
      caption: "Sunday hike",
      likes: 12,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  console.log("Created post for", userAId);

  const swipeId = `${userAId}_${userBId}`;
  await db.collection("swipes").doc(swipeId).set({
    swiperId: userAId,
    swipedId: userBId,
    direction: "right",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("Created swipe:", swipeId);

  const matchId = [userAId, userBId].sort().join("_");
  await db.collection("matches").doc(matchId).set({
    userAId,
    userBId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  console.log("Created match:", matchId);

  await db
    .collection("matches")
    .doc(matchId)
    .collection("messages")
    .doc("message_1")
    .set({
      senderId: userAId,
      content: "Hey! Nice to match with you",
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      readAt: null,
    });
  console.log("Created message in match:", matchId);

  console.log("\nSeeding complete!");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });