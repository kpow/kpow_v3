import { Router } from "express";
import passport from "passport";
import { isAuthenticated, isAdmin } from "../middleware/auth";

const router = Router();

// Log authentication attempts
router.use((req, res, next) => {
  console.log('Auth request path:', req.path);
  next();
});

router.get("/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    console.log('Google auth callback successful');
    res.redirect("/admin");
  }
);

router.get("/auth/user", isAuthenticated, (req, res) => {
  res.json(req.user);
});

router.get("/auth/logout", (req, res) => {
  req.logout(() => {
    res.redirect("/");
  });
});

// Test admin access
router.get("/auth/admin-check", isAdmin, (req, res) => {
  res.json({ message: "You have admin access" });
});

export default router;