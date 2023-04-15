import { Address, Store } from "../deps.ts";
import { AccountDebt } from "../entities.ts";

export const calculateRetention = async (
  params: {
    account: Address;
    token: Address;
    store: Store;
    amount: number;
    previousRetentionRatio: number;
  },
) => {
  const { account, store, token, amount } = params;

  const highestBorrowAmount = await store.retrieve(
    `${account}:highestBorrowAmount:${token}`,
    async () => {
      const highestBorrow = await AccountDebt.find({
        account,
        token,
      }).sort({ debtAmountTotal: -1 }).limit(1).exec();

      return highestBorrow[0]?.debtAmountTotal ?? amount;
    },
  );

  return amount / highestBorrowAmount;
};
