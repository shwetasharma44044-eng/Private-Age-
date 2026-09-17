import {
  CostModel,
  createConstructorContext,
  sampleContractAddress,
} from "@midnight-ntwrk/compact-runtime";

import { Contract, ledger } from "../managed/age_gate/contract/index.js";
import { type AgeGatePrivateState, witnesses } from "../witnesses.js";
import { type AgeLedger } from "./compact-types.js";

export class AgeGateSimulator {
  private readonly contract: any;

  private circuitContext: any;

  constructor(
    age: bigint,
    options?: {
      birthYear?: bigint;
      birthMonth?: bigint;
      birthDay?: bigint;
      identitySecret?: Uint8Array;
      credentialExpiry?: bigint;
    },
  ) {
    this.contract = new (Contract as any)(witnesses);
    const initialPrivateState: AgeGatePrivateState = {
      age,
      birthYear: options?.birthYear ?? (2026n - age),
      birthMonth: options?.birthMonth ?? 1n,
      birthDay: options?.birthDay ?? 1n,
      identitySecret: options?.identitySecret ?? new Uint8Array(32),
      credentialExpiry: options?.credentialExpiry ?? 0n,
    };
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const result: any = this.contract.initialState(
      createConstructorContext(initialPrivateState, "00".repeat(32)),
    );
    this.circuitContext = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      currentPrivateState: result.currentPrivateState,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      currentZswapLocalState: result.currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: {
        state: result.currentContractState.data,
        address: sampleContractAddress(),
      },
    };
  }

  public getLedger(): AgeLedger {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): AgeGatePrivateState {
    return this.circuitContext.currentPrivateState as AgeGatePrivateState;
  }

  public verifyEligibility(
    user: Uint8Array,
    threshold: bigint,
    timestamp: bigint,
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.circuitContext = this.contract.impureCircuits.verifyEligibility(
      this.circuitContext,
      user,
      threshold,
      timestamp,
    ).context;
    return true;
  }

  public verifyDateOfBirthProof(
    nullifier: Uint8Array,
    currentYear: bigint,
    currentMonth: bigint,
    currentDay: bigint,
    thresholdYears: bigint,
    timestamp: bigint,
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.circuitContext = this.contract.impureCircuits.verifyDateOfBirthProof(
      this.circuitContext,
      nullifier,
      currentYear,
      currentMonth,
      currentDay,
      thresholdYears,
      timestamp,
    ).context;
    return true;
  }

  public verifyTieredAccess(
    nullifier: Uint8Array,
    requiredTier: bigint,
    currentTimestamp: bigint,
  ): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.circuitContext = this.contract.impureCircuits.verifyTieredAccess(
      this.circuitContext,
      nullifier,
      requiredTier,
      currentTimestamp,
    ).context;
    return true;
  }

  public revokeCredential(nullifier: Uint8Array): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    this.circuitContext = this.contract.impureCircuits.revokeCredential(
      this.circuitContext,
      nullifier,
    ).context;
    return true;
  }
}
