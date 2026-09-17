import { Ledger } from "./managed/age_gate/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type AgeGatePrivateState = {
  readonly age: bigint;
  readonly birthYear?: bigint;
  readonly birthMonth?: bigint;
  readonly birthDay?: bigint;
  readonly identitySecret?: Uint8Array;
  readonly credentialExpiry?: bigint;
};

export const createAgeGatePrivateState = (
  age: bigint,
  options?: {
    birthYear?: bigint;
    birthMonth?: bigint;
    birthDay?: bigint;
    identitySecret?: Uint8Array;
    credentialExpiry?: bigint;
  },
): AgeGatePrivateState => ({
  age,
  birthYear: options?.birthYear ?? (2026n - age),
  birthMonth: options?.birthMonth ?? 1n,
  birthDay: options?.birthDay ?? 1n,
  identitySecret: options?.identitySecret ?? new Uint8Array(32),
  credentialExpiry: options?.credentialExpiry ?? 0n,
});

export const witnesses = {
  localAge: ({
    privateState,
  }: WitnessContext<Ledger, AgeGatePrivateState>): [
    AgeGatePrivateState,
    bigint,
  ] => [privateState, privateState.age ?? 0n],

  localBirthYear: ({
    privateState,
  }: WitnessContext<Ledger, AgeGatePrivateState>): [
    AgeGatePrivateState,
    bigint,
  ] => [privateState, privateState.birthYear ?? (2026n - (privateState.age ?? 0n))],

  localBirthMonth: ({
    privateState,
  }: WitnessContext<Ledger, AgeGatePrivateState>): [
    AgeGatePrivateState,
    bigint,
  ] => [privateState, privateState.birthMonth ?? 1n],

  localBirthDay: ({
    privateState,
  }: WitnessContext<Ledger, AgeGatePrivateState>): [
    AgeGatePrivateState,
    bigint,
  ] => [privateState, privateState.birthDay ?? 1n],

  localIdentitySecret: ({
    privateState,
  }: WitnessContext<Ledger, AgeGatePrivateState>): [
    AgeGatePrivateState,
    Uint8Array,
  ] => [privateState, privateState.identitySecret ?? new Uint8Array(32)],

  localCredentialExpiry: ({
    privateState,
  }: WitnessContext<Ledger, AgeGatePrivateState>): [
    AgeGatePrivateState,
    bigint,
  ] => [privateState, privateState.credentialExpiry ?? 0n],
};
