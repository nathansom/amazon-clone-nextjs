import { getSession, useSession } from "next-auth/react";
import moment from "moment";
import { collection, getDocs, query, orderBy } from "firebase/firestore/lite";

import Header from "../components/Header";
import db from "../../firebase";
import Order from "../components/Order";

async function getStripeOrders(firestore, userEmail) {
  const ordersRef = collection(firestore, "users", userEmail, "orders"),
    ordersQuery = query(ordersRef, orderBy("timestamp", "desc"));

  return getDocs(ordersQuery);
}

function Orders({ orders }) {
  const [session] = useSession();

  return (
    <div>
      <Header />
      <main className="max-w-screen-lg mx-auto p-10">
        <h1 className="text-3xl border-b mb-2 pb-1 border-yellow-400">
          Your Orders
        </h1>

        {session ? (
          <h2>{orders.length} Orders</h2>
        ) : (
          <h2>Please sign in to see your orders</h2>
        )}

        <div className="mt-5 space-y-4">
          {orders?.map(
            ({ id, amount, amountShipping, items, timestamp, images }) => (
              <Order
                key={id}
                id={id}
                amount={amount}
                amountShipping={amountShipping}
                items={items}
                timestamp={timestamp}
                images={imags}
              />
            )
          )}
        </div>
      </main>
    </div>
  );
}

export default Orders;

export async function getServerSideProps(context) {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  // Get the users logged in credentials....
  const session = await getSession(context);

  if (!session?.user?.email) {
    console.error("No email associated with the user.");

    return {
      props: {},
    };
  }

  const stripeOrders = await getStripeOrders(db, session.user.email),
    orders = await Promise.all(
      stripeOrders.docs.map(async (order) => ({
        id: order.id,
        amount: order.data().amount,
        amountShipping: order.data().amount,
        images: order.data().images,
        timestamp: moment(order.data().timestamp.toDate()).unix(),
        items: (
          await stripe.checkout.sessions.listLineItems(order.id, {
            limit: 100,
          })
        ).data,
      }))
    );

  return {
    props: {
      orders,
    },
  };
}
