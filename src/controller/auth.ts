import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { User } from "../model/user.js";
import { WalletEvent } from "../model/walletEvent.js";

import { signupSchema, signinSchema, onrampSchema } from "../types/auth.js";

export async function signUp(req: Request, res: Response) {
  try {
    const { username, password } = signupSchema.parse(req.body);
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      return res.status(409).json({
        error: "Username already exists",
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      balance: 0,
    });
    return res.status(201).json({
      id: user._id,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

export async function signIn(req: Request, res: Response) {
  try {
    const { username, password } = signinSchema.parse(req.body);

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        error: "Invalid credentials",
      });
    }
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }
    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      jwtSecret,
    );
    return res.json({ token });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

export async function onRamp(req: Request, res: Response) {
  try {
    const { amount } = onrampSchema.parse(req.body);
    const user = await User.findByIdAndUpdate(
      req.userId,
      { $inc: { balance: amount } },
      { new: true },
    );
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    await WalletEvent.create({
      userId: req.userId,
      tx_type: "onramp",
      amount,
    });
    return res.json({
      balance: user.balance,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}

export async function getProfile(req: Request, res: Response) {
  try {
    const user = User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({
        error: "User not found",
      });
    }
    return res.json(user);
  } catch (error) {
    return res.status(400).json({
      error: error.message,
    });
  }
}
export async function getTransactions(req: Request, res: Response) {
  try {
    const transactions = await WalletEvent.find({
      userId: req.userId,
    });

    return res.json(transactions);
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}
