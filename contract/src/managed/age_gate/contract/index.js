class CompactMap {
  constructor(entries = []) {
    this._map = new Map();
    for (const [k, v] of entries) {
      const keyStr =
        k instanceof Uint8Array
          ? Array.from(k).join(",")
          : typeof k === "object"
            ? JSON.stringify(k)
            : String(k);
      this._map.set(keyStr, { key: k, value: v });
    }
  }

  isEmpty() {
    return this._map.size === 0;
  }

  size() {
    return BigInt(this._map.size);
  }

  member(key) {
    const keyStr =
      key instanceof Uint8Array
        ? Array.from(key).join(",")
        : typeof key === "object"
          ? JSON.stringify(key)
          : String(key);
    return this._map.has(keyStr);
  }

  lookup(key) {
    const keyStr =
      key instanceof Uint8Array
        ? Array.from(key).join(",")
        : typeof key === "object"
          ? JSON.stringify(key)
          : String(key);
    const entry = this._map.get(keyStr);
    return entry ? entry.value : undefined;
  }

  insert(key, value) {
    const newMap = new CompactMap();
    newMap._map = new Map(this._map);
    const keyStr =
      key instanceof Uint8Array
        ? Array.from(key).join(",")
        : typeof key === "object"
          ? JSON.stringify(key)
          : String(key);
    newMap._map.set(keyStr, { key, value });
    return newMap;
  }

  *[Symbol.iterator]() {
    for (const item of this._map.values()) {
      yield [item.key, item.value];
    }
  }
}

const getInitialLedgerState = () => ({
  eligible: new CompactMap(),
  verification_timestamp: new CompactMap(),
  nullifier_registry: new CompactMap(),
  nullifier_tier: new CompactMap(),
  nullifier_expiry: new CompactMap(),
  revoked_nullifiers: new CompactMap(),
  contract_admin: new Uint8Array(32),
});

export class Contract {
  constructor(witnesses = {}) {
    this.witnesses = witnesses;
    this.impureCircuits = {
      verifyEligibility: (context, user, threshold, timestamp) => {
        const stateData = context.currentQueryContext.state || getInitialLedgerState();

        if (stateData.revoked_nullifiers && stateData.revoked_nullifiers.member(user)) {
          throw new Error("User identifier has been revoked");
        }

        const expiryWitness = this.witnesses.localCredentialExpiry;
        const [, expiry] = expiryWitness
          ? expiryWitness({ privateState: context.currentPrivateState, ...context })
          : [context.currentPrivateState, context.currentPrivateState?.credentialExpiry ?? 0n];

        if (expiry > 0n && timestamp > expiry) {
          throw new Error("Identity credential has expired");
        }

        const witnessFn = this.witnesses.localAge;
        const [nextPrivateState, age] = witnessFn
          ? witnessFn({
              privateState: context.currentPrivateState,
              ...context,
            })
          : [
              context.currentPrivateState,
              context.currentPrivateState?.age ?? 0n,
            ];

        if (age < threshold) {
          throw new Error("User age is below the required threshold");
        }

        const newEligible = (stateData.eligible || new CompactMap()).insert(user, true);
        const newVerificationTimestamp = (stateData.verification_timestamp || new CompactMap()).insert(user, timestamp);
        
        const updatedState = {
          ...stateData,
          eligible: newEligible,
          verification_timestamp: newVerificationTimestamp,
        };
        context.currentQueryContext.state = updatedState;
        context.currentPrivateState = nextPrivateState;
        return { context, result: true };
      },

      verifyDateOfBirthProof: (context, nullifier, currentYear, currentMonth, currentDay, thresholdYears, timestamp) => {
        const stateData = context.currentQueryContext.state || getInitialLedgerState();

        if (stateData.revoked_nullifiers && stateData.revoked_nullifiers.member(nullifier)) {
          throw new Error("Nullifier has been revoked");
        }

        const expiryWitness = this.witnesses.localCredentialExpiry;
        const [, expiry] = expiryWitness
          ? expiryWitness({ privateState: context.currentPrivateState, ...context })
          : [context.currentPrivateState, context.currentPrivateState?.credentialExpiry ?? 0n];

        if (expiry > 0n && timestamp > expiry) {
          throw new Error("Identity credential has expired");
        }

        const yearWitness = this.witnesses.localBirthYear;
        const monthWitness = this.witnesses.localBirthMonth;
        const dayWitness = this.witnesses.localBirthDay;

        const [, birthYear] = yearWitness
          ? yearWitness({ privateState: context.currentPrivateState, ...context })
          : [context.currentPrivateState, context.currentPrivateState?.birthYear ?? (2026n - (context.currentPrivateState?.age ?? 0n))];

        const [, birthMonth] = monthWitness
          ? monthWitness({ privateState: context.currentPrivateState, ...context })
          : [context.currentPrivateState, context.currentPrivateState?.birthMonth ?? 1n];

        const [nextPrivateState, birthDay] = dayWitness
          ? dayWitness({ privateState: context.currentPrivateState, ...context })
          : [context.currentPrivateState, context.currentPrivateState?.birthDay ?? 1n];

        if (birthMonth < 1n || birthMonth > 12n) {
          throw new Error("Invalid birth month");
        }
        if (birthDay < 1n || birthDay > 31n) {
          throw new Error("Invalid birth day");
        }
        if (currentYear < birthYear) {
          throw new Error("Current year cannot be before birth year");
        }

        const yearDiff = currentYear - birthYear;
        const isEligible = (yearDiff > thresholdYears) ||
          (yearDiff === thresholdYears && currentMonth > birthMonth) ||
          (yearDiff === thresholdYears && currentMonth === birthMonth && currentDay >= birthDay);

        if (!isEligible) {
          throw new Error("Date-of-Birth does not satisfy the age threshold requirement");
        }

        const newNullifierRegistry = (stateData.nullifier_registry || new CompactMap()).insert(nullifier, true);
        const newVerificationTimestamp = (stateData.verification_timestamp || new CompactMap()).insert(nullifier, timestamp);

        const updatedState = {
          ...stateData,
          nullifier_registry: newNullifierRegistry,
          verification_timestamp: newVerificationTimestamp,
        };
        context.currentQueryContext.state = updatedState;
        context.currentPrivateState = nextPrivateState;
        return { context, result: true };
      },

      verifyTieredAccess: (context, nullifier, requiredTier, currentTimestamp) => {
        const stateData = context.currentQueryContext.state || getInitialLedgerState();

        if (stateData.revoked_nullifiers && stateData.revoked_nullifiers.member(nullifier)) {
          throw new Error("Nullifier has been revoked");
        }

        const expiryWitness = this.witnesses.localCredentialExpiry;
        const [, expiry] = expiryWitness
          ? expiryWitness({ privateState: context.currentPrivateState, ...context })
          : [context.currentPrivateState, context.currentPrivateState?.credentialExpiry ?? 0n];

        if (expiry > 0n && currentTimestamp > expiry) {
          throw new Error("Credential has expired");
        }

        const witnessFn = this.witnesses.localAge;
        const [nextPrivateState, age] = witnessFn
          ? witnessFn({
              privateState: context.currentPrivateState,
              ...context,
            })
          : [
              context.currentPrivateState,
              context.currentPrivateState?.age ?? 0n,
            ];

        if (requiredTier === 1n || requiredTier === 1) {
          if (age < 13n) throw new Error("Age requirement not met for Tier 1 (Age >= 13)");
        } else if (requiredTier === 2n || requiredTier === 2) {
          if (age < 18n) throw new Error("Age requirement not met for Tier 2 (Age >= 18)");
        } else if (requiredTier === 3n || requiredTier === 3) {
          if (age < 21n) throw new Error("Age requirement not met for Tier 3 (Age >= 21)");
        } else if (requiredTier === 4n || requiredTier === 4) {
          if (age < 25n) throw new Error("Age requirement not met for Tier 4 (Age >= 25)");
        } else {
          throw new Error("Invalid compliance tier requested");
        }

        const newNullifierRegistry = (stateData.nullifier_registry || new CompactMap()).insert(nullifier, true);
        const newNullifierTier = (stateData.nullifier_tier || new CompactMap()).insert(nullifier, BigInt(requiredTier));
        const newVerificationTimestamp = (stateData.verification_timestamp || new CompactMap()).insert(nullifier, currentTimestamp);

        const updatedState = {
          ...stateData,
          nullifier_registry: newNullifierRegistry,
          nullifier_tier: newNullifierTier,
          verification_timestamp: newVerificationTimestamp,
        };
        context.currentQueryContext.state = updatedState;
        context.currentPrivateState = nextPrivateState;
        return { context, result: true };
      },

      revokeCredential: (context, nullifier) => {
        const stateData = context.currentQueryContext.state || getInitialLedgerState();
        const newRevoked = (stateData.revoked_nullifiers || new CompactMap()).insert(nullifier, true);

        const updatedState = {
          ...stateData,
          revoked_nullifiers: newRevoked,
        };
        context.currentQueryContext.state = updatedState;
        return { context, result: true };
      },
    };
  }

  initialState(constructorContext) {
    const state = getInitialLedgerState();
    return {
      currentPrivateState: constructorContext.initialPrivateState,
      currentZswapLocalState: {},
      currentContractState: {
        data: state,
      },
    };
  }
}

export const ledger = (state) => {
  if (state && state.eligible) {
    return {
      eligible: state.eligible || new CompactMap(),
      verification_timestamp: state.verification_timestamp || new CompactMap(),
      nullifier_registry: state.nullifier_registry || new CompactMap(),
      nullifier_tier: state.nullifier_tier || new CompactMap(),
      nullifier_expiry: state.nullifier_expiry || new CompactMap(),
      revoked_nullifiers: state.revoked_nullifiers || new CompactMap(),
      contract_admin: state.contract_admin || new Uint8Array(32),
    };
  }
  return getInitialLedgerState();
};

export const ledgerState = getInitialLedgerState();
