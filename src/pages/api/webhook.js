import admin from "firebase-admin";
import { buffer } from "micro";

const fulfillOrder = async (session) => {
  // Secure a connection to Firebase from the backend
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECTID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY.replace(/\\n/gm, "\n"),
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENTID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url:
      process.env.FIREBARE_AUTH_PROVIDER_X509CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_X509CERT_URL,
    universe_domain: "googleapis.com",
  };
  const app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });

  console.log("Fulfilling order", session);

  try {
    const writeResult = await app
      .firestore()
      .collection("users")
      .doc(session.metadata.email)
      .collection("orders")
      .doc(session.id)
      .set({
        amount: session.amount_total / 100,
        amount_shipping: session.total_details.amount_shipping / 100,
        images: JSON.parse(session?.metadata?.images || null),
        productIds: JSON.parse(session?.metadata?.productIds || null),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

    console.log("Successfully create order record at: ", writeResult.writeTime);
  } catch (e) {
    console.error("Failed to write order to database", e.message);
  }
};

export default async (req, res) => {
  if (req.method === "POST") {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const endpointSecret = process.env.STRIPE_SIGNING_SECRET;

    if (!secretKey)
      return res.status(400).send("Stripe secret key is undefined.");

    if (!endpointSecret)
      return res.status(400).send("Stripe signing secret is undefined.");

    const stripe = require("stripe")(secretKey);
    const payload = await buffer(req);
    const sig = req.headers["stripe-signature"];

    let event;

    if (!sig)
      return res
        .status(400)
        .send("Stripe signature is undefined in the headers.");

    // Verify that the Event posted came from Stripe
    try {
      event = stripe.webhooks.constructEvent(payload, sig, endpointSecret);
    } catch (err) {
      console.log("ERROR", err.message);
      return res
        .status(400)
        .send(`Webhook error (Stripe connection): ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      // Fulfill the order
      try {
        await fulfillOrder(session);

        return res.status(200);
      } catch (e) {
        return res
          .status(400)
          .send(`Webhook Error (Firebase connection): ${err.message}`);
      }
    }
  }
};

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
