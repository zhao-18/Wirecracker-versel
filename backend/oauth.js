import express from "express";
import passport from "passport";
import session from "express-session";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

const router = express.Router();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Session Middleware
router.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

// Initialize Passport
router.use(passport.initialize());
router.use(passport.session());

// Passport Configuration
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("Google Profile:", profile);
        // Check if the user exists in the database
        let { data: user, error } = await supabase
          .from("users")
          .select("*")
          .eq("email", profile.emails[0].value)
          .single();

        // If the user does not exist, create a new one
        if (!user) {
          const { data, error: insertError } = await supabase
            .from("users")
            .insert([
              { email: profile.emails[0].value, name: profile.displayName, password_hash: 'google' },
            ])
            .select()
            .single();

          if (insertError) throw insertError;
          user = data;
        }

        // Generate session token
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days expiration

        // Store session in Supabase
        await supabase.from("sessions").insert([{ user_id: user.id, token, expires_at: expiresAt }]);

        // Attach token to user object for frontend use
        user.token = token;
        return done(null, user);
      } catch (error) {
        console.error("Google Auth Error:", error);
        return done(error, null);
      }
    }
  )
);

// Serialize and Deserialize User
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Google Auth Route
router.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

// Google Auth Callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/" }),
  (req, res) => {
    if (req.user.token) {
        localStorage.setItem("token", req.user.token);
    }
    res.redirect("/");
  }
);

export default router;
