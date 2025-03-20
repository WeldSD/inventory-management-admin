import admin from "firebase-admin";
import { VercelRequest, VercelResponse } from "@vercel/node";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "scanimals-725e9",
      clientEmail: "kathiriyajay04@gmail.com",
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  try {
    const snapshot = await db.collection("inventory").get();
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      checkedOut: doc.data().checkedOut,
    }));

    res.status(200).json({ data: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}