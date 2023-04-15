import { createEntity } from "./deps.ts";

interface IAccountCollateral {
  account: string;
  collateralAmountTotal: number;
  token: string;
  timestamp: number;
}

export const AccountCollateral = createEntity<IAccountCollateral>(
  "AccountCollateral",
  {
    account: String,
    collateralAmountTotal: Number,
    token: String,
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
  timestamp: number;
}

export const AccountDebt = createEntity<IAccountDebt>("AccountDebt", {
  account: String,
  debtAmountTotal: Number,
  token: String,
  timestamp: {
    type: Number,
    index: true,
  },
});

interface IBorrowStats {
  token: string;
  count: number;
  amount: number;
  timestamp: number;
}

export const BorrowStats = createEntity<IBorrowStats>("BorrowStats", {
  token: String,
  count: Number,
  amount: Number,
  timestamp: {
    type: Number,
    index: true,
  },
});

interface IRetention {
  maxAccount: number;
  inactiveAccount: number;
  ratio: number;
  day: number;
  token: string;
}

export const Retention = createEntity<IRetention>("Retention", {
  maxAccount: Number,
  inactiveAccount: Number,
  ratio: Number,
  day: Number,
  token: String,
});

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
