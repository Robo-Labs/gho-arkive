import { Manifest } from "./deps.ts";
import { aToken } from "./ABI/aToken.ts";
import { AccountCollateral, AccountDebt, BorrowStats } from "./entities.ts";
import {
  collateralMintHandler,
  sDebtMintHandler,
  vDebtMintHandler,
} from "./handlers/mintHandler.ts";
import {
  collateralBurnHandler,
  sDebtBurnHandler,
  vDebtBurnHandler,
} from "./handlers/burnHandler.ts";
import {
  aTokenSources,
  sDebtTokenSources,
  vDebtTokenSources,
} from "./sources.ts";
import { vDebtToken } from "./ABI/vDebtToken.ts";
import { sDebtToken } from "./ABI/sDebtToken.ts";

const manifest = new Manifest("GHO");

const sepolia = manifest
  .chain("sepolia", { blockRange: 1000n });

sepolia.contract(aToken)
  .addSources(aTokenSources)
  .addEventHandlers({
    Mint: collateralMintHandler,
    Burn: collateralBurnHandler,
  });

sepolia.contract(vDebtToken)
  .addSources(vDebtTokenSources)
  .addEventHandlers({
    Mint: vDebtMintHandler,
    Burn: vDebtBurnHandler,
  });

sepolia.contract(sDebtToken)
  .addSources(sDebtTokenSources)
  .addEventHandlers({
    Mint: sDebtMintHandler,
    Burn: sDebtBurnHandler,
  });

export default manifest
  .addEntities([AccountCollateral, AccountDebt, BorrowStats])
  .build();
