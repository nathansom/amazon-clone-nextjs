import admin from "firebase-admin";

const fulfillOrder = async (session) => {
  // Secure a connection to Firebase from the backend
  const serviceAccount = {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECTID,
    private_key_id: process.env.PRIVATE_KEY_ID,
    private_key: process.env.PRIVATE_KEY,
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

  return app
    .firestore()
    .collection("users")
    .doc(session.metadata.email)
    .collection("orders")
    .doc(session.id)
    .set({
      amount: session.amount_total / 100,
      amount_shipping: session.total_details.amount_shipping / 100,
      images: JSON.parse(session.metadata.images),
      title: JSON.parse(session.metadata.titles),
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      console.log(`SUCCESS: Order ${session.id} had been added to the DB`);
    });
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
    const payload = await req.text();
    const sig = req.headers.get("stripe-signature");

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
      return fulfillOrder(session).then(() =>
        res
          .status(200)
          .catch((err) =>
            res
              .status(400)
              .send(`Webhook Error (Firebase connection): ${err.message}`)
          )
      );
    }
  }
};

export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};
