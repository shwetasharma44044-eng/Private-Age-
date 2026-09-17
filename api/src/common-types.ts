/* eslint-disable @typescript-eslint/no-explicit-any */
import { type MidnightProviders } from "@midnight-ntwrk/midnight-js-types";
import { type FoundContract } from "@midnight-ntwrk/midnight-js-contracts";
import type { AgeGatePrivateState } from "../../contract/src/index";

export const ageGatePrivateStateKey = "ageGatePrivateState";
export type PrivateStateId = typeof ageGatePrivateStateKey;

export type PrivateStates = {
  readonly ageGatePrivateState: AgeGatePrivateState;
};

export interface AgeGateContract {
  readonly witnesses: any;
  readonly circuits: {
    readonly verifyEligibility: (
      context: any,
      user: Uint8Array,
      threshold: bigint | number,
      timestamp: bigint | number,
    ) => any;
    readonly verifyDateOfBirthProof?: (
      context: any,
      nullifier: Uint8Array,
      currentYear: bigint | number,
      currentMonth: bigint | number,
      currentDay: bigint | number,
      thresholdYears: bigint | number,
      timestamp: bigint | number,
    ) => any;
    readonly verifyTieredAccess?: (
      context: any,
      nullifier: Uint8Array,
      requiredTier: bigint | number,
      currentTimestamp: bigint | number,
    ) => any;
    readonly revokeCredential?: (
      context: any,
      nullifier: Uint8Array,
    ) => any;
  };
  readonly provableCircuits: {
    readonly verifyEligibility: (
      context: any,
      user: Uint8Array,
      threshold: bigint | number,
      timestamp: bigint | number,
    ) => any;
    readonly verifyDateOfBirthProof?: (
      context: any,
      nullifier: Uint8Array,
      currentYear: bigint | number,
      currentMonth: bigint | number,
      currentDay: bigint | number,
      thresholdYears: bigint | number,
      timestamp: bigint | number,
    ) => any;
    readonly verifyTieredAccess?: (
      context: any,
      nullifier: Uint8Array,
      requiredTier: bigint | number,
      currentTimestamp: bigint | number,
    ) => any;
    readonly revokeCredential?: (
      context: any,
      nullifier: Uint8Array,
    ) => any;
  };
  readonly impureCircuits: {
    readonly verifyEligibility: (
      context: any,
      user: Uint8Array,
      threshold: bigint | number,
      timestamp: bigint | number,
    ) => { context: any; result: boolean };
    readonly verifyDateOfBirthProof?: (
      context: any,
      nullifier: Uint8Array,
      currentYear: bigint | number,
      currentMonth: bigint | number,
      currentDay: bigint | number,
      thresholdYears: bigint | number,
      timestamp: bigint | number,
    ) => { context: any; result: boolean };
    readonly verifyTieredAccess?: (
      context: any,
      nullifier: Uint8Array,
      requiredTier: bigint | number,
      currentTimestamp: bigint | number,
    ) => { context: any; result: boolean };
    readonly revokeCredential?: (
      context: any,
      nullifier: Uint8Array,
    ) => { context: any; result: boolean };
  };
  initialState(context: any): any;
}

export type AgeGateCircuitKeys = Exclude<
  keyof AgeGateContract["impureCircuits"],
  number | symbol
>;

export type AgeGateProviders = MidnightProviders<
  AgeGateCircuitKeys,
  PrivateStateId,
  AgeGatePrivateState
>;

export type DeployedAgeGateContract = FoundContract<AgeGateContract>;

export type AgeGateDerivedState = {
  readonly isEligible: boolean;
  readonly timestamp: bigint | undefined;
  readonly userPublicKey: string;
  readonly verifiedTier?: number;
  readonly isRevoked?: boolean;
};
