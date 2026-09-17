export declare class Contract {
  constructor(witnesses?: any);
  initialState(constructorContext: any): any;
  impureCircuits: any;
}
export declare const ledger: (state?: any) => any;
export declare const ledgerState: any;
export type Ledger = {
  eligible: any;
  verification_timestamp: any;
  nullifier_registry: any;
  nullifier_tier: any;
  nullifier_expiry: any;
  revoked_nullifiers: any;
  contract_admin: any;
};
