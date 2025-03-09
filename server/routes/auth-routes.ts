import { Router } from "express";
import passport from "passport";
import { isAuthenticated, isAdmin } from "../middleware/auth";

const router = Router();

// Log authentication attempts
router.use((req, res, next) => {
  console.log('Auth request path:', req.path);
  console.log('Session:', {
    cookie: req.session.cookie,
  });
  console.log('User:', req.user);
  next();
});

router.get("/api/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/api/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    console.log('Google auth callback successful');
    console.log('User after auth:', req.user);
    res.redirect("/admin");
  }
);

router.get("/api/auth/user", isAuthenticated, (req, res) => {
  console.log('Checking authenticated user:', req.user);
  res.json(req.user);
});

router.get("/api/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Test admin access
router.get("/api/auth/admin-check", isAdmin, (req, res) => {
  res.json({ message: "You have admin access" });
});

export default router;