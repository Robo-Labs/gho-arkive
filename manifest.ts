import { Manifest } from "./deps.ts";
import { aToken } from "./ABI/aToken.ts";
import {
  AccountCollateral,
  AccountDebt,
  BorrowStats,
  Retention,
} from "./entities.ts";
import {
  collateralMintHandler,
  debtMintHandler,
} from "./handlers/mintHandler.ts";
import {
  collateralBurnHandler,
  debtBurnHandler,
} from "./handlers/burnHandler.ts";
import { aTokenSources, vDebtTokenSources } from "./sources.ts";
import { vDebtToken } from "./ABI/vDebtToken.ts";

const manifest = new Manifest("GHO");

const sepolia = manifest
  .chain("sepolia", { blockRange: 100n });

sepolia.contract(aToken)
  .addSources(aTokenSources)
  .addEventHandlers({
    Mint: collateralMintHandler,
    Burn: collateralBurnHandler,
  });

sepolia.contract(vDebtToken)
  .addSources(vDebtTokenSources)
  .addEventHandlers({
    Mint: debtMintHandler,
    Burn: debtBurnHandler,
  });

export default manifest
  .addEntities([AccountCollateral, AccountDebt, BorrowStats, Retention])
  .build();
