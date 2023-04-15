import { AaveOracle } from "../ABI/AaveOracle.ts";
import {
  Address,
  formatUnits,
  getContract,
  PublicClient,
  Store,
} from "../deps.ts";

export const getPrice = async (
  params: {
    token: Address;
    blockNumber: bigint;
    client: PublicClient;
    store: Store;
  },
) => {
  const { client, token, store } = params;

  if (
    token.toLowerCase() ===
      "0x2f7E653ff781d086C3BEcfb1Ca4381Ae22bECD03".toLowerCase()
  ) {
    return 1;
  }

  const aaveOracle = getContract({
    address: "0x132C06E86CcCf93Afef7B33f0FF3e2E97EECf8f6",
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
    `${token}:price`,
    async () => await aaveOracle.read.getAssetPrice([token]),
  );

  return parseFloat(formatUnits(price, decimals));
};
