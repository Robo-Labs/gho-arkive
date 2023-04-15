import { EventHandlerFor, formatUnits } from "../deps.ts";
import { aToken } from "../ABI/aToken.ts";
import { AccountCollateral, AccountDebt, BorrowStats } from "../entities.ts";
import { vDebtToken } from "../ABI/vDebtToken.ts";
import { sDebtToken } from "../ABI/sDebtToken.ts";
import { getSymbol } from "../utils/symbol.ts";
import { getPrice } from "../utils/price.ts";

export const collateralMintHandler: EventHandlerFor<typeof aToken, "Mint"> =
  async (
    { event, client, store, contract },
  ) => {
    const { onBehalfOf, value } = event.args;

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

    const [minterBalance] = await Promise.all([
      await store.retrieve(
        `${onBehalfOf}:${address}:collateral`,
        async () => {
          const collateral = await AccountCollateral
            .find({ account: onBehalfOf, token: address })
            .sort({ timestamp: -1 })
            .limit(1);
          return collateral[0]?.collateralAmountTotal ??
            parseFloat(
              formatUnits(
                await contract.read.balanceOf([onBehalfOf]),
                decimals,
              ),
            );
        },
      ),
    ]);

    const minterNewBalance = minterBalance + parsedValue;

    // save the new balances to the database
    AccountCollateral.create({
      account: onBehalfOf,
      collateralAmountTotal: minterNewBalance,
      collateralAmountTotalUsd: minterNewBalance * price,
      token: address,
      timestamp,
      symbol,
    });

    store.set(`${onBehalfOf}:${address}:collateral`, minterNewBalance);
  };

export const vDebtMintHandler: EventHandlerFor<typeof vDebtToken, "Mint"> =
  async ({
    client,
    event,
    store,
    contract,
  }) => {
    const { onBehalfOf, value } = event.args;

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

    const [minterBalance, highestMinterBalance] = await store.retrieve(
      `${onBehalfOf}:${address}:debt`,
      async () => {
        const debt = await AccountDebt.find({
          account: onBehalfOf,
          token: address,
        })
          .sort({ timestamp: -1 })
          .limit(1);
        if (debt[0] === undefined) {
          const balance = parseFloat(
            formatUnits(await contract.read.balanceOf([onBehalfOf]), decimals),
          );
          return [balance, balance];
        }
        return [
          debt[0].debtAmountTotal,
          debt[0].highestAmount,
        ];
      },
    );

    const borrowStats = await store.retrieve(
      `${address}:borrowStats`,
      async () => {
        const borrowStats = (await BorrowStats
          .find({ token: address })
          .sort({ timestamp: -1 })
          .limit(1))[0];

        return {
          count: (borrowStats?.count ?? 0) + 1,
          amount: (borrowStats?.amount ?? 0) + parsedValue,
        };
      },
    );

    const minterNewBalance = minterBalance + parsedValue;
    const highestNewMinterBalance = Math.max(
      highestMinterBalance,
      minterNewBalance,
    );

    AccountDebt.create({
      account: onBehalfOf,
      debtAmountTotal: minterNewBalance,
      debtAmountTotalUsd: minterNewBalance * price,
      token: address,
      timestamp,
      type: "variable",
      highestAmount: highestNewMinterBalance,
      retaining: minterNewBalance / highestNewMinterBalance > 0.1,
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

    store.set(`${onBehalfOf}:${address}:debt`, [
      minterNewBalance,
      highestNewMinterBalance,
    ]);
    store.set(`${address}:borrowStats`, borrowStats);
  };

export const sDebtMintHandler: EventHandlerFor<typeof sDebtToken, "Mint"> =
  async ({
    event,
    client,
    contract,
    store,
  }) => {
    const { onBehalfOf, amount } = event.args;

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

    const [minterBalance, highestMinterBalance] = await store.retrieve(
      `${onBehalfOf}:${address}:debt`,
      async () => {
        const debt = await AccountDebt.find({
          account: onBehalfOf,
          token: address,
        })
          .sort({ timestamp: -1 })
          .limit(1);
        if (debt[0] === undefined) {
          const balance = parseFloat(
            formatUnits(await contract.read.balanceOf([onBehalfOf]), decimals),
          );
          return [balance, balance];
        }
        return [
          debt[0].debtAmountTotal,
          debt[0].highestAmount,
        ];
      },
    );

    const borrowStats = await store.retrieve(
      `${address}:borrowStats`,
      async () => {
        const borrowStats = (await BorrowStats
          .find({ token: address })
          .sort({ timestamp: -1 })
          .limit(1))[0];

        return {
          count: (borrowStats?.count ?? 0) + 1,
          amount: (borrowStats?.amount ?? 0) + parsedValue,
        };
      },
    );

    const minterNewBalance = minterBalance + parsedValue;
    const highestNewMinterBalance = Math.max(
      highestMinterBalance,
      minterNewBalance,
    );

    AccountDebt.create({
      account: onBehalfOf,
      debtAmountTotal: minterNewBalance,
      debtAmountTotalUsd: minterNewBalance * price,
      token: address,
      timestamp,
      type: "stable",
      highestAmount: highestNewMinterBalance,
      retaining: minterNewBalance / highestNewMinterBalance > 0.1,
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

    store.set(`${onBehalfOf}:${address}:debt`, [
      minterNewBalance,
      highestNewMinterBalance,
    ]);
    store.set(`${address}:borrowStats`, borrowStats);
  };
