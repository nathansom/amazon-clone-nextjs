import NextAuth from "next-auth";
import GooglegleProvider from "next-auth/providers/google";

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    GooglegleProvider({
      clientId: process.env.GOOGLE_ID,
      clientSecret: process.env.GOOGLE_SECRET,
    })
  ],

  // A database is optional, but required to persist accounts in a database
  database: process.env.DATABASE_URL,
});
