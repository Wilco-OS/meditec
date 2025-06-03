import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { User } from "@/models/User";
import dbConnect from "./dbConnect";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('Anmeldung fehlgeschlagen: Fehlende Anmeldedaten');
            return null;
          }

          console.log(`Anmeldeversuch für: ${credentials.email}`);
          try {
            await dbConnect();
            console.log('Datenbankverbindung hergestellt');
          } catch (dbError) {
            console.error('Datenbankfehler bei der Anmeldung:', dbError);
            throw new Error('Datenbank nicht erreichbar. Bitte versuchen Sie es später erneut.');
          }

          // Suche den Benutzer anhand der E-Mail-Adresse
          const user = await User.findOne({ email: credentials.email.toLowerCase() });

          if (!user) {
            console.log(`Benutzer nicht gefunden: ${credentials.email}`);
            return null;
          }

          if (!user.password) {
            console.log(`Benutzer hat kein Passwort: ${credentials.email}`);
            return null;
          }

          // Mehr Informationen für das Debugging
          console.log(`Benutzer gefunden: ${user.name}, Rolle: ${user.role}, Aktiv: ${user.active}`);

          // Überprüfe das Passwort
          const isValid = await bcrypt.compare(credentials.password, user.password);

          if (!isValid) {
            console.log(`Falsches Passwort für: ${credentials.email}`);
            return null;
          }

          // Prüfe, ob der Benutzer aktiv ist
          if (!user.active) {
            console.log(`Deaktivierter Account: ${credentials.email}`);
            throw new Error('Dieser Account ist deaktiviert. Bitte wenden Sie sich an Ihren Administrator.');
          }

          // Erfolgreiche Anmeldung protokollieren
          console.log(`Erfolgreiche Anmeldung: ${credentials.email}`);

          // Gib das Benutzerobjekt zurück (ohne Passwort)
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId?.toString(),
          };
        } catch (error) {
          console.error('Fehler bei der Autorisierung:', error);
          throw error;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.companyId = token.companyId as string;
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Hier könnten wir Benutzerstatistiken oder Login-Protokolle aktualisieren
      console.log(`User signed in: ${user.email}`);
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
};

// Funktion zur Überprüfung der Benutzerrolle
export const hasRole = (session: any, ...roles: string[]) => {
  return session?.user?.role && roles.includes(session.user.role);
};
