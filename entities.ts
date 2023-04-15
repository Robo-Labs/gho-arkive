import { createEntity } from "./deps.ts";

interface IAccountCollateral {
  account: string;
  collateralAmountTotal: number;
  token: string;
  symbol: string;
  timestamp: number;
}

export const AccountCollateral = createEntity<IAccountCollateral>(
  "AccountCollateral",
  {
    account: String,
    collateralAmountTotal: Number,
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
  timestamp: number;
}

export const BorrowStats = createEntity<IBorrowStats>("BorrowStats", {
  token: String,
  symbol: String,
  count: Number,
  amount: Number,
  timestamp: {
    type: Number,
    index: true,
  },
});

// interface IRetention {
//   maxAccount: number;
//   inactiveAccount: number;
//   ratio: number;
//   day: number;
//   token: string;
//   symbol: string;
// }

// export const Retention = createEntity<IRetention>("Retention", {
//   maxAccount: Number,
//   inactiveAccount: Number,
//   ratio: Number,
//   day: Number,
//   token: String,
//   symbol: String,
// });

// interface IGHOStats {
//   borrowersVsTotalBorrowers: number;
//   borrowAmountVsTotalBorrowAmount: number;
//   retention: number;
//   collateralUsd: number;
//   collateralVsTotalCollateral: number;
//   treasuryInterest: number;
// }

// export const GHOStats = createEntity("GHOStats", {
//   borrowersVsTotalBorrowers: Number,
//   borrowAmountVsTotalBorrowAmount: Number,
//   retention: Number,
//   collateralUsd: Number,
//   collateralVsTotalCollateral: Number,
//   treasuryInterest: Number,
//   timestamp: {
//     type: Number,
//     index: true,
//   },
// });
