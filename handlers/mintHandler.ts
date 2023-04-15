import { EventHandlerFor, formatUnits } from "../deps.ts";
import { aToken } from "../ABI/aToken.ts";
import { AccountCollateral, AccountDebt, BorrowStats } from "../entities.ts";
import { vDebtToken } from "../ABI/vDebtToken.ts";
import { sDebtToken } from "../ABI/sDebtToken.ts";
import { getSymbol } from "../utils/symbol.ts";

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
        `${onBehalfOf}:${address}:debt`,
        async () => {
          const debt = await AccountDebt
            .find({ account: onBehalfOf, token: address })
            .sort({ timestamp: -1 })
            .limit(1);
          return debt[0]?.debtAmountTotal ??
            parseFloat(
              formatUnits(
                await contract.read.balanceOf([onBehalfOf]),
                decimals,
              ),
            );
        },
      ),
    ]);

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

    AccountDebt.create({
      account: onBehalfOf,
      debtAmountTotal: minterNewBalance,
      token: address,
      timestamp,
      type: "variable",
      symbol,
    });
    BorrowStats.create({
      token: address,
      count: borrowStats.count,
      amount: borrowStats.amount,
      timestamp,
      symbol,
    });

    store.set(`${onBehalfOf}:${address}:debt`, minterNewBalance);
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

    const timestamp = await store.retrieve(
      `${event.blockHash}:timestamp`,
      async () => {
        const block = await client.getBlock({ blockHash: event.blockHash });
        return Number(block.timestamp);
      },
    );

    const parsedValue = parseFloat(formatUnits(amount, decimals));

    const [minterBalance] = await Promise.all([
      await store.retrieve(
        `${onBehalfOf}:${address}:debt`,
        async () => {
          const debt = await AccountDebt
            .find({ account: onBehalfOf, token: address })
            .sort({ timestamp: -1 })
            .limit(1);
          return debt[0]?.debtAmountTotal ??
            parseFloat(
              formatUnits(
                await contract.read.balanceOf([onBehalfOf]),
                decimals,
              ),
            );
        },
      ),
    ]);

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

    AccountDebt.create({
      account: onBehalfOf,
      debtAmountTotal: minterNewBalance,
      token: address,
      timestamp,
      type: "stable",
      symbol,
    });
    BorrowStats.create({
      token: address,
      count: borrowStats.count,
      amount: borrowStats.amount,
      timestamp,
      symbol,
    });

    store.set(`${onBehalfOf}:${address}:debt`, minterNewBalance);
    store.set(`${address}:borrowStats`, borrowStats);
  };
