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

export class Contract {
  constructor(witnesses = {}) {
    this.witnesses = witnesses;
    this.impureCircuits = {
      verifyEligibility: (context, user, threshold, timestamp) => {
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
        const stateData = context.currentQueryContext.state || {
          eligible: new CompactMap(),
          verification_timestamp: new CompactMap(),
        };
        const newEligible = stateData.eligible.insert(user, true);
        const newVerificationTimestamp =
          stateData.verification_timestamp.insert(user, timestamp);
        const updatedState = {
          eligible: newEligible,
          verification_timestamp: newVerificationTimestamp,
        };
        context.currentQueryContext.state = updatedState;
        context.currentPrivateState = nextPrivateState;
        return { context, result: true };
      },
    };
  }

  initialState(constructorContext) {
    const state = {
      eligible: new CompactMap(),
      verification_timestamp: new CompactMap(),
    };
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
    return state;
  }
  return {
    eligible: new CompactMap(),
    verification_timestamp: new CompactMap(),
  };
};

export const ledgerState = {
  eligible: new CompactMap(),
  verification_timestamp: new CompactMap(),
};
