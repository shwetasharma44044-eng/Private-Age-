/*
 * Age Gate witnesses implementation for Midnight contract
 */

import { Ledger } from "./managed/bboard/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type AgeGatePrivateState = {
  readonly age: bigint;
};

export const createAgeGatePrivateState = (age: bigint = 18n): AgeGatePrivateState => ({
  age,
});

export const witnesses = {
  localAge: ({
    privateState,
  }: WitnessContext<Ledger, AgeGatePrivateState>): [
    AgeGatePrivateState,
    bigint,
  ] => [privateState ?? { age: 18n }, privateState?.age ?? 18n],
};
