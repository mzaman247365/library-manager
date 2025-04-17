import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { Express, Request } from "express";
import session from "express-session";
import bcrypt from "bcrypt";
import { storage } from "./storage";
import { User as SelectUser, InsertUser } from "@shared/schema";
import { log } from "./vite";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

// Number of salt rounds for bcrypt
const SALT_ROUNDS = 12;

// Helper function to hash a password using bcrypt
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Helper function to compare a password with a hash using bcrypt
async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return await bcrypt.compare(supplied, stored);
}

// Helper to create a safe user object without password
function getSafeUser(user: SelectUser): Omit<SelectUser, "password"> {
  const { password, ...safeUser } = user;
  return safeUser;
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "library-management-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === "production",
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "Incorrect username" });
        }
        
        const isValidPassword = await comparePasswords(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: "Incorrect password" });
        }
        
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  // Google OAuth strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: "/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Try to find user with this Google ID
            let user = await findOrCreateOAuthUser({
              oauthProvider: "google",
              oauthId: profile.id,
              email: profile.emails?.[0]?.value,
              fullName: profile.displayName,
              profileImage: profile.photos?.[0]?.value,
            });
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  } else {
    log("Google OAuth not configured - skipping setup");
  }

  // Facebook OAuth strategy
  if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(
      new FacebookStrategy(
        {
          clientID: process.env.FACEBOOK_APP_ID,
          clientSecret: process.env.FACEBOOK_APP_SECRET,
          callbackURL: "/auth/facebook/callback",
          profileFields: ["id", "displayName", "photos", "email"],
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            // Try to find user with this Facebook ID
            let user = await findOrCreateOAuthUser({
              oauthProvider: "facebook",
              oauthId: profile.id,
              email: profile.emails?.[0]?.value,
              fullName: profile.displayName,
              profileImage: profile.photos?.[0]?.value,
            });
            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
  } else {
    log("Facebook OAuth not configured - skipping setup");
  }

  // Helper to find or create a user based on OAuth data
  async function findOrCreateOAuthUser(data: {
    oauthProvider: string;
    oauthId: string;
    email?: string;
    fullName?: string;
    profileImage?: string;
  }) {
    const { oauthProvider, oauthId, email, fullName = "User", profileImage } = data;

    // Look for a user with this OAuth ID and provider
    const existingUserByOAuth = await storage.getUserByOAuthId(oauthProvider, oauthId);
    if (existingUserByOAuth) {
      return existingUserByOAuth;
    }

    // If user has email, check if exists in database
    if (email) {
      const existingUserByEmail = await storage.getUserByEmail(email);
      if (existingUserByEmail) {
        // Update the existing user with OAuth details
        return await storage.updateUser(existingUserByEmail.id, {
          oauthProvider,
          oauthId,
          profileImage,
        });
      }
    }

    // Create a new user
    let username = email ? email.split("@")[0] : `${oauthProvider}_${oauthId}`;
    
    // Ensure username is unique
    let baseUsername = username;
    let counter = 1;
    while (await storage.getUserByUsername(username)) {
      username = `${baseUsername}${counter++}`;
    }

    // Create the new user
    const newUser: InsertUser = {
      username,
      password: await hashPassword(Math.random().toString(36).slice(2)), // random password
      fullName,
      email,
      oauthProvider,
      oauthId,
      profileImage,
      isAdmin: false,
    };

    return await storage.createUser(newUser);
  }

  // Serialize and deserialize user
  passport.serializeUser((user, done) => done(null, user.id));
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Registration endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      if (req.body.email) {
        const existingEmail = await storage.getUserByEmail(req.body.email);
        if (existingEmail) {
          return res.status(400).json({ message: "Email already exists" });
        }
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
        isAdmin: false, // Always false for regular registration
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(getSafeUser(user));
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ 
          message: info?.message || "Invalid username or password" 
        });
      }
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(200).json(getSafeUser(user));
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(getSafeUser(req.user as SelectUser));
  });

  // Google OAuth routes
  app.get(
    "/auth/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { failureRedirect: "/auth" }),
    (req, res) => {
      res.redirect("/");
    }
  );

  // Facebook OAuth routes
  app.get(
    "/auth/facebook",
    passport.authenticate("facebook", { scope: ["email"] })
  );

  app.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/auth" }),
    (req, res) => {
      res.redirect("/");
    }
  );
}
