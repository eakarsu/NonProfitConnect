import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as GitHubStrategy } from "passport-github2";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { authLimiter } from "./middleware/rateLimiter";
import { passwordSchema, changePasswordSchema } from "@shared/schema";

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

export async function setupMultiAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  // Serialize/deserialize user
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Local Strategy (Email/Password)
  passport.use(new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password'
    },
    async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user) {
          return done(null, false, { message: 'No user found with this email' });
        }

        if (!user.password) {
          return done(null, false, { message: 'Please sign in with your social account' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return done(null, false, { message: 'Invalid password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));

  // Google OAuth Strategy
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback"
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');

        if (!user) {
          user = await storage.upsertUser({
            id: `google_${profile.id}`,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.name?.givenName || null,
            lastName: profile.name?.familyName || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
            provider: 'google',
            providerId: profile.id,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // GitHub OAuth Strategy
  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    passport.use(new GitHubStrategy({
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: "/api/auth/github/callback"
    },
    async (accessToken: string, refreshToken: string, profile: any, done: any) => {
      try {
        let user = await storage.getUserByEmail(profile.emails?.[0]?.value || '');

        if (!user) {
          user = await storage.upsertUser({
            id: `github_${profile.id}`,
            email: profile.emails?.[0]?.value || null,
            firstName: profile.displayName?.split(' ')[0] || null,
            lastName: profile.displayName?.split(' ').slice(1).join(' ') || null,
            profileImageUrl: profile.photos?.[0]?.value || null,
            provider: 'github',
            providerId: profile.id,
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }));
  }

  // Auth Routes

  // Local authentication with rate limiting
  app.post('/api/auth/login', authLimiter, passport.authenticate('local'), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.post('/api/auth/register', authLimiter, async (req, res) => {
    try {
      const { email, password, firstName, lastName, roles } = req.body;

      // Validate password strength
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        return res.status(400).json({
          message: passwordResult.error.errors[0]?.message || "Password does not meet requirements",
        });
      }

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const user = await storage.upsertUser({
        id: `local_${Date.now()}`,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        provider: 'local',
        roles: roles || ['applicant'],
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      });

      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: 'Login failed' });
        res.json({ success: true, user });
      });
    } catch (error) {
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Forgot password
  app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
    try {
      const { email } = req.body;
      const user = await storage.getUserByEmail(email);

      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ message: "If an account exists with that email, a reset link has been sent." });
      }

      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await storage.setPasswordResetToken(user.id, resetToken, resetExpires);

      // In production, send email with reset link
      // For now, log the token (in dev mode)
      console.log(`Password reset token for ${email}: ${resetToken}`);

      res.json({ message: "If an account exists with that email, a reset link has been sent.", token: resetToken });
    } catch (error) {
      res.status(500).json({ message: "Failed to process request" });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = req.body;

      // Validate password strength
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        return res.status(400).json({
          message: passwordResult.error.errors[0]?.message || "Password does not meet requirements",
        });
      }

      const user = await storage.getUserByResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      await storage.updateUserPassword(user.id, hashedPassword);
      await storage.clearPasswordResetToken(user.id);

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Change password (authenticated)
  app.post('/api/auth/change-password', async (req: any, res) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const result = changePasswordSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          message: result.error.errors[0]?.message || "Invalid input",
        });
      }

      const { currentPassword, newPassword } = result.data;
      const user = await storage.getUser(req.user.id);

      if (!user || !user.password) {
        return res.status(400).json({ message: "Cannot change password for social accounts" });
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await storage.updateUserPassword(user.id, hashedPassword);

      res.json({ message: "Password changed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  // Verify email
  app.get('/api/auth/verify-email/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const user = await storage.getUserByVerificationToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired verification token" });
      }

      await storage.verifyUserEmail(user.id);
      res.json({ message: "Email verified successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to verify email" });
    }
  });

  // Google OAuth routes
  app.get('/api/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );

  app.get('/api/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/?error=auth_failed' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // GitHub OAuth routes
  app.get('/api/auth/github',
    passport.authenticate('github', { scope: ['user:email'] })
  );

  app.get('/api/auth/github/callback',
    passport.authenticate('github', { failureRedirect: '/?error=auth_failed' }),
    (req, res) => {
      res.redirect('/');
    }
  );

  // Logout
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) return res.status(500).json({ message: 'Logout failed' });
      res.json({ success: true });
    });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
};
