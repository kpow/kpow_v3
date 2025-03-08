import { Request, Response, NextFunction } from "express";

export interface AuthenticatedRequest extends Request {
  user?: any;
  isAuthenticated(): boolean;
}

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Unauthorized" });
};

// Middleware to check if user is an admin
export const isAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const allowedEmails = process.env.ADMIN_EMAILS?.split(',') || [];
  
  if (req.isAuthenticated() && req.user?.email && allowedEmails.includes(req.user.email)) {
    return next();
  }
  
  res.status(403).json({ error: "Forbidden - Admin access required" });
};
