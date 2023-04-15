import { AaveOracle } from "../ABI/AaveOracle.ts";
import {
  Address,
  BlockTag,
  formatUnits,
  getContract,
  PublicClient,
  Store,
} from "../deps.ts";

export const getPrice = async (
  params: {
    token: Address;
    blockTag: BlockTag;
    client: PublicClient;
    store: Store;
  },
) => {
  const { client, token, blockTag, store } = params;

  const aaveOracle = getContract({
    address: token,
    abi: AaveOracle,
    publicClient: client,
  });

  const decimals = await store.retrieve(
    `${token}:decimals`,
    async () => {
      const baseCurrencyUnit = await aaveOracle.read.BASE_CURRENCY_UNIT();
      const decimals = Math.log10(Number(baseCurrencyUnit));
      return decimals;
    },
  );

  const price = await store.retrieve(
    `${token}:${blockTag}:price`,
    async () =>
      await aaveOracle.read.getAssetPrice([token], {
        blockTag,
      }),
  );

  return parseFloat(formatUnits(price, decimals));
};
