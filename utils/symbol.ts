import { Address, getContract, PublicClient, Store } from "../deps.ts";
import { erc20 } from "../ABI/erc20.ts";

export const getSymbol = async (
  params: { client: PublicClient; store: Store; address: Address },
) => {
  const { client, store, address } = params;
  const symbol = await store.retrieve(
    `${address}:symbol`,
    async () => {
      const contract = getContract({
        publicClient: client,
        address,
        abi: erc20,
      });
      return await contract.read.symbol();
    },
  );
  return symbol;
};
