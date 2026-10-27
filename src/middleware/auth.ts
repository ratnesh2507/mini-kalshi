import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({
      error: "Token required",
    });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return res.status(500).json({
      error: "JWT secret not configured",
    });
  }

  try {
    const decoded = jwt.verify(token, secret);

    req.userId = decoded.userId;

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
}
