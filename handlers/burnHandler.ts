import { EventHandlerFor, formatUnits } from "../deps.ts";
import { aToken } from "../ABI/aToken.ts";
import { AccountCollateral, AccountDebt } from "../entities.ts";
import { vDebtToken } from "../ABI/vDebtToken.ts";

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

    const minterNewBalance = minterBalance - parsedValue;

    // save the new balances to the database
    AccountCollateral.create({
      account: from,
      collateralAmountTotal: minterNewBalance,
      token: address,
      timestamp,
    });

    store.set(`${from}:${address}:collateral`, minterNewBalance);
  };

export const debtBurnHandler: EventHandlerFor<typeof vDebtToken, "Burn"> =
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

    const timestamp = await store.retrieve(
      `${event.blockHash}:timestamp`,
      async () => {
        const block = await client.getBlock({ blockHash: event.blockHash });
        return Number(block.timestamp);
      },
    );

    const parsedValue = parseFloat(formatUnits(value, decimals));

    const [minterBalance] = await Promise.all([
      await store.retrieve(`${from}:${address}:debt`, async () => {
        const debt = await AccountDebt.find({ account: from, token: address })
          .sort({ timestamp: -1 })
          .limit(1);
        return debt[0]?.debtAmountTotal ??
          parseFloat(
            formatUnits(await contract.read.balanceOf([from]), decimals),
          );
      }),
    ]);

    const minterNewBalance = minterBalance - parsedValue;

    AccountDebt.create({
      account: from,
      debtAmountTotal: minterNewBalance,
      token: address,
      timestamp,
    });

    store.set(`${from}:${address}:debt`, minterNewBalance);
  };
