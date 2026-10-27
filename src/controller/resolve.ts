import type { Request, Response } from "express";
import { User } from "../model/user.js";
import { Market } from "../model/market.js";
import { Bet } from "../model/bet.js";
import { WalletEvent } from "../model/walletEvent.js";

import { resolveMarketSchema } from "../types/resolve.js";

export async function resolveMarket(req: Request, res: Response) {
  try {
    const { marketId, resolution } = resolveMarketSchema.parse(req.body);
    const market = await Market.findOne({
      _id: marketId,
    });
    if (!market) {
      return res.status(404).json({
        error: "Market not found",
      });
    }
    if (market.creatorId.toString() !== req.userId) {
      return res.status(403).json({
        error: "Only creator can resolve",
      });
    }
    if (market.resolution !== null) {
      return res.status(400).json({
        error: "Market already resolved",
      });
    }
    const bets = await Bet.find({
      marketId,
    });

    const totalBets = bets.reduce((sum, bet) => sum + bet.betAmount, 0);

    if (market.side === resolution) {
      // Creator wins

      const payout = totalBets * 2 + (market.initialWager - totalBets);

      await User.updateOne(
        { _id: market.creatorId },
        { $inc: { balance: payout } },
      );

      await WalletEvent.create({
        userId: market.creatorId,
        tx_type: "payout",
        externalId: { marketId },
        amount: payout,
      });
    } else {
      // People betting against creator win

      for (const bet of bets) {
        const payout = bet.betAmount * 2;

        await User.updateOne(
          { _id: bet.userId },
          { $inc: { balance: payout } },
        );

        await WalletEvent.create({
          userId: bet.userId,
          tx_type: "payout",
          externalId: {
            marketId,
            betId: bet._id,
          },
          amount: payout,
        });
      }

      // Refund unmatched creator stake
      const refund = market.initialWager - totalBets;

      if (refund > 0) {
        await User.updateOne(
          { _id: market.creatorId },
          { $inc: { balance: refund } },
        );

        await WalletEvent.create({
          userId: market.creatorId,
          tx_type: "refund",
          externalId: { marketId },
          amount: refund,
        });
      }
    }

    market.resolution = resolution;
    await market.save();

    return res.json({
      message: "Market resolved successfully",
      resolution,
    });
  } catch (error: any) {
    return res.status(400).json({
      error: error.message,
    });
  }
}
