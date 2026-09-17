import * as AgeGate from "../../contract/src/managed/age_gate/contract/index.js";
import { type ContractAddress } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
import { type Logger } from "pino";
import {
  type AgeGateContract,
  type AgeGateDerivedState,
  type AgeGateProviders,
  type DeployedAgeGateContract,
  ageGatePrivateStateKey,
} from "./common-types.js";
import { CompiledAgeGateContractContract } from "../../contract/src/index.js";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js-contracts";
import { combineLatest, map, tap, from, type Observable } from "rxjs";
import { toHex, fromHex } from "@midnight-ntwrk/midnight-js-utils";
import { type AgeGatePrivateState } from "../../contract/src/witnesses.js";

export interface DeployedAgeGateAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<AgeGateDerivedState>;

  verify: (age: number, threshold: number) => Promise<void>;
  verifyDOB: (
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    thresholdYears: number,
  ) => Promise<void>;
  verifyTier: (tier: number) => Promise<void>;
}

export class AgeGateAPI implements DeployedAgeGateAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<AgeGateDerivedState>;

  private constructor(
    public readonly deployedContract: DeployedAgeGateContract,
    private readonly providers: AgeGateProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress =
      deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(
      this.deployedContractAddress,
    );

    this.state$ = combineLatest([
      providers.publicDataProvider
        .contractStateObservable(this.deployedContractAddress, {
          type: "latest",
        })
        .pipe(
          map((contractState) => AgeGate.ledger(contractState.data)),
          tap((ledgerState) =>
            logger?.trace({
              ledgerStateChanged: {
                ledgerState,
              },
            }),
          ),
        ),
      from(
        providers.privateStateProvider.get(
          ageGatePrivateStateKey,
        ) as Promise<AgeGatePrivateState>,
      ),
    ]).pipe(
      map(([ledgerState]) => {
        const userPubKeyHex = providers.walletProvider.getCoinPublicKey();

        let isEligible = false;
        let timestamp: bigint | undefined = undefined;
        let verifiedTier: number | undefined = undefined;
        let isRevoked = false;

        if (ledgerState.eligible) {
          for (const [key, val] of ledgerState.eligible) {
            if (toHex(key) === userPubKeyHex) {
              isEligible = val;
              break;
            }
          }
        }

        if (ledgerState.nullifier_registry) {
          for (const [key, val] of ledgerState.nullifier_registry) {
            if (toHex(key) === userPubKeyHex) {
              isEligible = val;
              break;
            }
          }
        }

        if (ledgerState.nullifier_tier) {
          for (const [key, val] of ledgerState.nullifier_tier) {
            if (toHex(key) === userPubKeyHex) {
              verifiedTier = Number(val);
              break;
            }
          }
        }

        if (ledgerState.revoked_nullifiers) {
          for (const [key, val] of ledgerState.revoked_nullifiers) {
            if (toHex(key) === userPubKeyHex) {
              isRevoked = val;
              break;
            }
          }
        }

        if (ledgerState.verification_timestamp) {
          for (const [key, val] of ledgerState.verification_timestamp) {
            if (toHex(key) === userPubKeyHex) {
              timestamp = val;
              break;
            }
          }
        }

        return {
          isEligible,
          timestamp,
          userPublicKey: userPubKeyHex,
          verifiedTier,
          isRevoked,
        };
      }),
    );
  }

  async verify(age: number, threshold: number): Promise<void> {
    this.logger?.info(`Verifying age: ${age} against threshold: ${threshold}`);

    const existingPrivateState = await this.providers.privateStateProvider.get(
      ageGatePrivateStateKey,
    );
    const updatedPrivateState: AgeGatePrivateState = {
      ...existingPrivateState,
      age: BigInt(age),
    };
    await this.providers.privateStateProvider.set(
      ageGatePrivateStateKey,
      updatedPrivateState,
    );

    const userPubKeyHex = this.providers.walletProvider.getCoinPublicKey();
    const userPubKeyBytes = fromHex(userPubKeyHex);
    const timestamp = BigInt(Date.now());

    const txData = await this.deployedContract.callTx.verifyEligibility(
      userPubKeyBytes,
      BigInt(threshold),
      timestamp,
    );

    this.logger?.trace({
      transactionAdded: {
        circuit: "verifyEligibility",
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  async verifyDOB(
    birthYear: number,
    birthMonth: number,
    birthDay: number,
    thresholdYears: number,
  ): Promise<void> {
    this.logger?.info(
      `Verifying DOB proof: Year ${birthYear}/${birthMonth}/${birthDay} threshold: ${thresholdYears}`,
    );

    const existingPrivateState = await this.providers.privateStateProvider.get(
      ageGatePrivateStateKey,
    );
    const calculatedAge = BigInt(2026 - birthYear);
    const updatedPrivateState: AgeGatePrivateState = {
      ...existingPrivateState,
      age: calculatedAge,
      birthYear: BigInt(birthYear),
      birthMonth: BigInt(birthMonth),
      birthDay: BigInt(birthDay),
    };
    await this.providers.privateStateProvider.set(
      ageGatePrivateStateKey,
      updatedPrivateState,
    );

    const userPubKeyHex = this.providers.walletProvider.getCoinPublicKey();
    const userPubKeyBytes = fromHex(userPubKeyHex);
    const now = new Date();
    const currentYear = BigInt(now.getFullYear() > 2024 ? now.getFullYear() : 2026);
    const currentMonth = BigInt(now.getMonth() + 1);
    const currentDay = BigInt(now.getDate());
    const timestamp = BigInt(Date.now());

    if (this.deployedContract.callTx.verifyDateOfBirthProof) {
      await this.deployedContract.callTx.verifyDateOfBirthProof(
        userPubKeyBytes,
        currentYear,
        currentMonth,
        currentDay,
        BigInt(thresholdYears),
        timestamp,
      );
    } else {
      await this.deployedContract.callTx.verifyEligibility(
        userPubKeyBytes,
        BigInt(thresholdYears),
        timestamp,
      );
    }
  }

  async verifyTier(tier: number): Promise<void> {
    this.logger?.info(`Verifying compliance Tier: ${tier}`);

    const userPubKeyHex = this.providers.walletProvider.getCoinPublicKey();
    const userPubKeyBytes = fromHex(userPubKeyHex);
    const timestamp = BigInt(Date.now());

    if (this.deployedContract.callTx.verifyTieredAccess) {
      await this.deployedContract.callTx.verifyTieredAccess(
        userPubKeyBytes,
        BigInt(tier),
        timestamp,
      );
    } else {
      const tierThreshold = tier === 1 ? 13 : tier === 2 ? 18 : tier === 3 ? 21 : 25;
      await this.deployedContract.callTx.verifyEligibility(
        userPubKeyBytes,
        BigInt(tierThreshold),
        timestamp,
      );
    }
  }

  static async deploy(
    providers: AgeGateProviders,
    logger?: Logger,
  ): Promise<AgeGateAPI> {
    logger?.info("deployContract");

    const deployedAgeGateContract = (await deployContract(providers, {
      compiledContract: CompiledAgeGateContractContract,
      privateStateId: ageGatePrivateStateKey,
      initialPrivateState: { age: 0n },
      args: [],
    })) as unknown as DeployedAgeGateContract;

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedAgeGateContract.deployTxData.public,
      },
    });

    return new AgeGateAPI(deployedAgeGateContract, providers, logger);
  }

  static async join(
    providers: AgeGateProviders,
    contractAddress: ContractAddress,
    logger?: Logger,
  ): Promise<AgeGateAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    const deployedAgeGateContract = await findDeployedContract<AgeGateContract>(
      providers,
      {
        contractAddress,
        compiledContract: CompiledAgeGateContractContract,
        privateStateId: ageGatePrivateStateKey,
        initialPrivateState: await AgeGateAPI.getPrivateState(
          providers,
          contractAddress,
        ),
      },
    );

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedAgeGateContract.deployTxData.public,
      },
    });

    return new AgeGateAPI(deployedAgeGateContract, providers, logger);
  }

  private static async getPrivateState(
    providers: AgeGateProviders,
    contractAddress: ContractAddress,
  ): Promise<AgeGatePrivateState> {
    providers.privateStateProvider.setContractAddress(contractAddress);
    const existingPrivateState = await providers.privateStateProvider.get(
      ageGatePrivateStateKey,
    );
    return existingPrivateState ?? { age: 0n };
  }
}

export * from "./common-types.js";
