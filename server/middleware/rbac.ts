import type { RequestHandler } from "express";

export function requireRole(...roles: string[]): RequestHandler {
  return (req: any, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get user from either passport or Replit auth
    const userRoles = user.claims ? [] : (user.roles || []);

    const hasRole = roles.some((role) => userRoles.includes(role));
    if (!hasRole) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
}
