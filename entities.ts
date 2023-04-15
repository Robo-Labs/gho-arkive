import { createEntity } from "./deps.ts";

interface IAccountCollateral {
  account: string;
  collateralAmountTotal: number;
  collateralAmountTotalUsd: number;
  token: string;
  symbol: string;
  timestamp: number;
}

export const AccountCollateral = createEntity<IAccountCollateral>(
  "AccountCollateral",
  {
    account: String,
    collateralAmountTotal: Number,
    collateralAmountTotalUsd: Number,
    token: String,
    symbol: String,
    timestamp: {
      type: Number,
      index: true,
    },
  },
);

interface IAccountDebt {
  account: string;
  debtAmountTotal: number;
  debtAmountTotalUsd: number;
  token: string;
  symbol: string;
  timestamp: number;
  retaining: boolean;
  highestAmount: number;
  type: "stable" | "variable";
}

export const AccountDebt = createEntity<IAccountDebt>("AccountDebt", {
  account: String,
  debtAmountTotal: Number,
  debtAmountTotalUsd: Number,
  token: String,
  symbol: String,
  type: String,
  retaining: Boolean,
  highestAmount: Number,
  timestamp: {
    type: Number,
    index: true,
  },
});

interface IBorrowStats {
  token: string;
  symbol: string;
  count: number;
  amount: number;
  amountUsd: number;
  timestamp: number;
}

export const BorrowStats = createEntity<IBorrowStats>("BorrowStats", {
  token: String,
  symbol: String,
  count: Number,
  amount: Number,
  amountUsd: Number,
  timestamp: {
    type: Number,
    index: true,
  },
});
