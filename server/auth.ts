import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Express, Request } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { UserRole } from "@shared/schema";
import { User } from './models/index';

declare global {
  namespace Express {
    interface User {
      _id: string;
      username: string;
      email: string;
      name: string;
      role: string;
      avatar?: string;
    }
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Debug: Log environment variables
  console.log("Environment variables:");
  console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID);
  console.log("GOOGLE_CLIENT_SECRET:", process.env.GOOGLE_CLIENT_SECRET ? "SET" : "NOT SET");
  console.log("SESSION_SECRET:", process.env.SESSION_SECRET ? "SET" : "NOT SET");
  
  // Use a default secret for development. In production, this should be an environment variable
  const sessionSecret = process.env.SESSION_SECRET || "my-to-do-secret-key";
  
  const sessionSettings: session.SessionOptions = {
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false in development for easier testing
      sameSite: 'lax', // Helps with CSRF protection but still allows redirects
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await User.findOne({ username });
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL: "http://localhost:5000/api/auth/google/callback",
        scope: ["profile", "email"],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          console.log("Google OAuth initiated with Client ID:", process.env.GOOGLE_CLIENT_ID);
          console.log("Google profile:", profile);
          
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || "Unknown User";
          const avatar = profile.photos?.[0]?.value;
          
          if (!email) {
            return done(new Error("Email not provided by Google"));
          }

          console.log("Looking for user with email:", email);
          // Check if user exists
          let user = await User.findOne({ email });
          
          if (!user) {
            console.log("User not found, creating new user...");
            // Create new user
            user = await User.create({
              username: `google_${profile.id}`,
              password: "", // No password for OAuth users
              name,
              email,
              role: UserRole.TEAM_MEMBER,
              avatar,
              googleId: profile.id
            });
            console.log("New user created:", user);
          }

          return done(null, user);
        } catch (error) {
          console.error("Google OAuth error:", error);
          return done(error);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Google OAuth routes
  app.get("/api/auth/google", (req, res, next) => {
    console.log("Google OAuth initiated with Client ID:", process.env.GOOGLE_CLIENT_ID);
    passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next);
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Check if the username is already taken
      const existingUser = await User.findOne({ username: req.body.username });
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      // Create the user with hashed password
      const hashedPassword = await hashPassword(req.body.password);
      const user = await User.create({
        username: req.body.username,
        password: hashedPassword,
        name: req.body.name,
        email: req.body.email,
        role: UserRole.TEAM_MEMBER, // Default role for new users
        avatar: req.body.avatar,
      });

      // Remove password from the response
      const { password, ...userWithoutPassword } = user.toObject();

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: any, user: any, info: { message?: string } | undefined) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Authentication failed" });
      
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        
        // Remove password from the response
        const { password, ...userWithoutPassword } = user.toObject();
        res.json(userWithoutPassword);
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });
}

export const isAuthenticated = (req: Request, res: any, next: any) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};

export const isAdmin = (req: Request, res: any, next: any) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (req.user?.role !== UserRole.ADMIN) {
    return res.status(403).json({ message: "Forbidden: Admin access required" });
  }

  next();
};

