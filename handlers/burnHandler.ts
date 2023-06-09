import { EventHandlerFor, formatUnits } from "../deps.ts";
import { aToken } from "../ABI/aToken.ts";
import { AccountCollateral, AccountDebt, BorrowStats } from "../entities.ts";
import { vDebtToken } from "../ABI/vDebtToken.ts";
import { sDebtToken } from "../ABI/sDebtToken.ts";
import { getSymbol } from "../utils/symbol.ts";
import { getPrice } from "../utils/price.ts";

export const collateralBurnHandler: EventHandlerFor<typeof aToken, "Burn"> =
  async (
    { event, client, store, contract },
  ) => {
    const { from, value } = event.args;

    const address = event.address;

    // store.retrieve() will return the value if it exists in the store, otherwise it will run the function and store the result
    const decimals = await store.retrieve(
      `${address}:decimals`,
      contract.read.decimals,
    );

    const symbol = await getSymbol({
      client,
      store,
      address,
    });

    const underlying = await store.retrieve(
      `${address}:underlying`,
      contract.read.UNDERLYING_ASSET_ADDRESS,
    );

    const price = await getPrice({
      client,
      store,
      blockNumber: event.blockNumber,
      token: underlying,
    });

    // reduce rpc calls in case you have multiple events in the same block
    const timestamp = await store.retrieve(
      `${event.blockHash}:timestamp`,
      async () => {
        const block = await client.getBlock({ blockHash: event.blockHash });
        return Number(block.timestamp);
      },
    );

    const parsedValue = parseFloat(formatUnits(value, decimals));

    const [burnerBalance] = await Promise.all([
      await store.retrieve(
        `${from}:${address}:collateral`,
        async () => {
          const collateral = await AccountCollateral
            .find({ account: from, token: address })
            .sort({ timestamp: -1 })
            .limit(1);
          return collateral[0]?.collateralAmountTotal ??
            parseFloat(
              formatUnits(await contract.read.balanceOf([from]), decimals),
            );
        },
      ),
    ]);

    const burnerNewBalance = burnerBalance - parsedValue;

    // save the new balances to the database
    AccountCollateral.create({
      account: from,
      collateralAmountTotal: burnerNewBalance,
      collateralAmountTotalUsd: burnerNewBalance * price,
      token: address,
      timestamp,
      symbol,
    });

    store.set(`${from}:${address}:collateral`, burnerNewBalance);
  };

export const vDebtBurnHandler: EventHandlerFor<typeof vDebtToken, "Burn"> =
  async ({
    client,
    contract,
    event,
    store,
  }) => {
    const { from, value } = event.args;

    const address = event.address;

    const decimals = await store.retrieve(
      `${address}:decimals`,
      contract.read.decimals,
    );

    const symbol = await getSymbol({
      client,
      store,
      address,
    });

    const underlying = await store.retrieve(
      `${address}:underlying`,
      contract.read.UNDERLYING_ASSET_ADDRESS,
    );

    const price = await getPrice({
      client,
      store,
      blockNumber: event.blockNumber,
      token: underlying,
    });

    const timestamp = await store.retrieve(
      `${event.blockHash}:timestamp`,
      async () => {
        const block = await client.getBlock({ blockHash: event.blockHash });
        return Number(block.timestamp);
      },
    );

    const parsedValue = parseFloat(formatUnits(value, decimals));

    const [burnerBalance, highestBurnerBalance] = await store.retrieve(
      `${from}:${address}:debt`,
      async () => {
        const debt = await AccountDebt.find({ account: from, token: address })
          .sort({ timestamp: -1 })
          .limit(1);
        if (debt[0] === undefined) {
          const balance = parseFloat(
            formatUnits(await contract.read.balanceOf([from]), decimals),
          );
          return [balance, balance];
        }
        return [
          debt[0].debtAmountTotal,
          debt[0].highestAmount,
        ];
      },
    );

    const burnerNewBalance = burnerBalance - parsedValue;

    const borrowStats = await store.retrieve(
      `${address}:borrowStats`,
      async () => {
        const borrowStats = (await BorrowStats
          .find({ token: address })
          .sort({ timestamp: -1 })
          .limit(1))[0];

        return {
          count: (borrowStats?.count ?? 0) - 1,
          amount: (borrowStats?.amount ?? 0) - parsedValue,
        };
      },
    );

    AccountDebt.create({
      account: from,
      debtAmountTotal: burnerNewBalance,
      debtAmountTotalUsd: burnerNewBalance * price,
      token: address,
      timestamp,
      type: "variable",
      highestAmount: highestBurnerBalance,
      retaining: burnerNewBalance / highestBurnerBalance > 0.1,
      symbol,
    });
    BorrowStats.create({
      token: address,
      count: borrowStats.count,
      amount: borrowStats.amount,
      amountUsd: borrowStats.amount * price,
      timestamp,
      symbol,
    });

    store.set(`${from}:${address}:debt`, [
      burnerNewBalance,
      highestBurnerBalance,
    ]);
    store.set(`${address}:borrowStats`, borrowStats);
  };

export const sDebtBurnHandler: EventHandlerFor<typeof sDebtToken, "Burn"> =
  async ({
    event,
    client,
    store,
    contract,
  }) => {
    const { from, amount } = event.args;

    const address = event.address;

    const decimals = await store.retrieve(
      `${address}:decimals`,
      contract.read.decimals,
    );

    const symbol = await getSymbol({
      client,
      store,
      address,
    });

    const underlying = await store.retrieve(
      `${address}:underlying`,
      contract.read.UNDERLYING_ASSET_ADDRESS,
    );

    const price = await getPrice({
      client,
      store,
      blockNumber: event.blockNumber,
      token: underlying,
    });

    const timestamp = await store.retrieve(
      `${event.blockHash}:timestamp`,
      async () => {
        const block = await client.getBlock({ blockHash: event.blockHash });
        return Number(block.timestamp);
      },
    );

    const parsedValue = parseFloat(formatUnits(amount, decimals));

    const [burnerBalance, highestBurnerBalance] = await store.retrieve(
      `${from}:${address}:debt`,
      async () => {
        const debt = await AccountDebt.find({ account: from, token: address })
          .sort({ timestamp: -1 })
          .limit(1);
        if (debt[0] === undefined) {
          const balance = parseFloat(
            formatUnits(await contract.read.balanceOf([from]), decimals),
          );
          return [balance, balance];
        }
        return [
          debt[0].debtAmountTotal,
          debt[0].highestAmount,
        ];
      },
    );

    const burnerNewBalance = burnerBalance - parsedValue;

    const borrowStats = await store.retrieve(
      `${address}:borrowStats`,
      async () => {
        const borrowStats = (await BorrowStats
          .find({ token: address })
          .sort({ timestamp: -1 })
          .limit(1))[0];

        return {
          count: (borrowStats?.count ?? 0) - 1,
          amount: (borrowStats?.amount ?? 0) - parsedValue,
        };
      },
    );

    AccountDebt.create({
      account: from,
      debtAmountTotal: burnerNewBalance,
      debtAmountTotalUsd: burnerNewBalance * price,
      token: address,
      timestamp,
      type: "stable",
      highestAmount: highestBurnerBalance,
      retaining: burnerNewBalance / highestBurnerBalance > 0.1,
      symbol,
    });
    BorrowStats.create({
      token: address,
      count: borrowStats.count,
      amount: borrowStats.amount,
      amountUsd: borrowStats.amount * price,
      timestamp,
      symbol,
    });

    store.set(`${from}:${address}:debt`, [
      burnerNewBalance,
      highestBurnerBalance,
    ]);
    store.set(`${address}:borrowStats`, borrowStats);
  };
