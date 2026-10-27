import type { Request, Response } from "express";
import { User } from "../model/user.js";
import { Market } from "../model/market.js";
import { Bet } from "../model/bet.js";
import { WalletEvent } from "../model/walletEvent.js";

import { createMarketSchema, placeBetSchema } from "../types/market.js";

export async function createMarket(req: Request, res: Response) {
  try {
    const data = createMarketSchema.parse(req.body);
    if (data.expiry <= new Date()) {
      return res.status(400).json({
        error: "Invalid expiry",
      });
    }
    const user = await User.findById(req.userId);
    if (!user || user.balance < data.initialWager) {
      return res.status(400).json({
        error: "Insufficient balance",
      });
    }
    user.balance -= data.initialWager;
    await user.save();

    const market = await Market.create({
      ...data,
      creatorId: req.userId,
    });
    await WalletEvent.create({
      userId: req.userId,
      tx_type: "created",
      externalId: { marketId: market._id },
      amount: -data.initialWager,
    });
    return res.status(201).json({
      id: market._id,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}
export async function getMarkets(req: Request, res: Response) {
  try {
    const markets = await Market.find().populate("creatorId", "username");

    return res.json(markets);
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}
export async function placeBet(req: Request, res: Response) {
  try {
    const { marketId, amount } = placeBetSchema.parse(req.body);
    const market = await Market.findOne({
      _id: marketId,
    });
    if (!market) {
      return res.status(404).json({
        error: "Market not found",
      });
    }
    if (market.resolution !== null) {
      return res.status(400).json({
        error: "Market already resolved",
      });
    }
    if (new Date() >= market.expiry) {
      return res.status(400).json({
        error: "Market expired",
      });
    }
    if (market.creatorId.toString() === req.userId) {
      return res.status(400).json({
        error: "Creator cannot bet against their own market",
      });
    }
    const existingBets = await Bet.find({
      marketId,
    });

    const totalBets = existingBets.reduce((sum, bet) => sum + bet.betAmount, 0);

    if (totalBets + amount > market.initialWager) {
      return res.status(400).json({
        error: "Bet exceeds remaining available amount",
      });
    }
    const user = await User.findById(req.userId);

    if (!user || user.balance < amount) {
      return res.status(400).json({
        error: "Insufficient balance",
      });
    }

    user.balance -= amount;
    await user.save();

    const bet = await Bet.create({
      userId: req.userId,
      marketId,
      betAmount: amount,
    });
    await WalletEvent.create({
      userId: req.userId,
      tx_type: "bet",
      externalId: {
        betId: bet._id,
        marketId,
      },
      amount: -amount,
    });

    return res.status(201).json({
      betId: bet._id,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}
export async function getBets(req: Request, res: Response) {
  try {
    const bets = await Bet.find({
      userId: req.userId,
    }).populate("marketId");

    return res.json(bets);
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}
