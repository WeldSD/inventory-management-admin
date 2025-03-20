import admin from "firebase-admin";

// Ensure Firebase Admin SDK is initialized only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "scanimals-725e9",
      clientEmail: "firebase-adminsdk-fbsvc@scanimals-725e9.iam.gserviceaccount.com",
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = admin.firestore();

export async function GET(req) {
  try {
    const snapshot = await db.collection("inventory").get();
    const items = snapshot.docs.map((doc) => ({
      id: doc.id,
      name: doc.data().name,
      checkedOut: doc.data().checkedOut || false, // Default false if missing
    }));

    return Response.json({ data: items }, { status: 200 });
  } catch (error) {
    console.error("Error fetching inventory:", error);
    return Response.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}