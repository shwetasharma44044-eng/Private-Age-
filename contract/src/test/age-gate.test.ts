import { AgeGateSimulator } from "./age-gate-simulator.js";
import { setNetworkId } from "@midnight-ntwrk/midnight-js-network-id";
import { describe, it, expect } from "vitest";
import { randomBytes } from "./utils.js";

setNetworkId("undeployed");

describe("AgeGate Level 5 smart contract test suite", () => {
  describe("Circuit 1: Standard Age Threshold Verification (verifyEligibility)", () => {
    it("allows verification when age is above or equal to threshold", () => {
      const user = randomBytes(32);
      const simulator = new AgeGateSimulator(20n);
      const threshold = 18n;
      const timestamp = BigInt(Date.now());

      const success = simulator.verifyEligibility(user, threshold, timestamp);
      expect(success).toBe(true);

      const ledgerState = simulator.getLedger();
      expect(ledgerState.eligible.lookup(user)).toBe(true);
      expect(ledgerState.verification_timestamp.lookup(user)).toBe(timestamp);
    });

    it("fails verification when age is below threshold", () => {
      const user = randomBytes(32);
      const simulator = new AgeGateSimulator(16n);
      const threshold = 18n;
      const timestamp = BigInt(Date.now());

      expect(() => {
        simulator.verifyEligibility(user, threshold, timestamp);
      }).toThrow("User age is below the required threshold");

      const ledgerState = simulator.getLedger();
      expect(ledgerState.eligible.member(user)).toBe(false);
    });

    it("fails verification when credential has expired", () => {
      const user = randomBytes(32);
      const pastExpiry = 1000n;
      const currentTimestamp = 2000n;
      const simulator = new AgeGateSimulator(25n, { credentialExpiry: pastExpiry });

      expect(() => {
        simulator.verifyEligibility(user, 18n, currentTimestamp);
      }).toThrow("Identity credential has expired");
    });
  });

  describe("Circuit 2: Date-of-Birth Calendar Proof (verifyDateOfBirthProof)", () => {
    it("verifies user whose 18th birthday is today or earlier", () => {
      const nullifier = randomBytes(32);
      // Born on Sept 15, 2005 (Age 21 on Sept 17, 2026)
      const simulator = new AgeGateSimulator(21n, {
        birthYear: 2005n,
        birthMonth: 9n,
        birthDay: 15n,
      });

      const currentYear = 2026n;
      const currentMonth = 9n;
      const currentDay = 17n;
      const thresholdYears = 18n;
      const timestamp = BigInt(Date.now());

      const success = simulator.verifyDateOfBirthProof(
        nullifier,
        currentYear,
        currentMonth,
        currentDay,
        thresholdYears,
        timestamp,
      );
      expect(success).toBe(true);

      const ledgerState = simulator.getLedger();
      expect(ledgerState.nullifier_registry.lookup(nullifier)).toBe(true);
      expect(ledgerState.verification_timestamp.lookup(nullifier)).toBe(timestamp);
    });

    it("fails verification when user has not yet reached their birthday this year", () => {
      const nullifier = randomBytes(32);
      // Born on Dec 25, 2008 (Only 17 years old on Sept 17, 2026 for 18 threshold)
      const simulator = new AgeGateSimulator(17n, {
        birthYear: 2008n,
        birthMonth: 12n,
        birthDay: 25n,
      });

      const currentYear = 2026n;
      const currentMonth = 9n;
      const currentDay = 17n;
      const thresholdYears = 18n;
      const timestamp = BigInt(Date.now());

      expect(() => {
        simulator.verifyDateOfBirthProof(
          nullifier,
          currentYear,
          currentMonth,
          currentDay,
          thresholdYears,
          timestamp,
        );
      }).toThrow("Date-of-Birth does not satisfy the age threshold requirement");
    });

    it("accurately handles exact boundary day matching", () => {
      const nullifier = randomBytes(32);
      // Born exactly 18 years ago today: Sept 17, 2008
      const simulator = new AgeGateSimulator(18n, {
        birthYear: 2008n,
        birthMonth: 9n,
        birthDay: 17n,
      });

      const success = simulator.verifyDateOfBirthProof(
        nullifier,
        2026n,
        9n,
        17n,
        18n,
        BigInt(Date.now()),
      );
      expect(success).toBe(true);
    });
  });

  describe("Circuit 3: Multi-Tier Access (verifyTieredAccess)", () => {
    it("allows Tier 1 (13+) for a 14 year old", () => {
      const nullifier = randomBytes(32);
      const simulator = new AgeGateSimulator(14n);
      const success = simulator.verifyTieredAccess(nullifier, 1n, BigInt(Date.now()));
      expect(success).toBe(true);

      const ledgerState = simulator.getLedger();
      expect(ledgerState.nullifier_tier.lookup(nullifier)).toBe(1n);
    });

    it("allows Tier 3 (21+) for a 22 year old and rejects Tier 4 (25+)", () => {
      const nullifier = randomBytes(32);
      const simulator = new AgeGateSimulator(22n);
      const success = simulator.verifyTieredAccess(nullifier, 3n, BigInt(Date.now()));
      expect(success).toBe(true);

      expect(() => {
        simulator.verifyTieredAccess(nullifier, 4n, BigInt(Date.now()));
      }).toThrow("Age requirement not met for Tier 4 (Age >= 25)");
    });
  });

  describe("Circuit 4: Revocation Management (revokeCredential)", () => {
    it("revokes a nullifier and prevents subsequent verifications", () => {
      const nullifier = randomBytes(32);
      const simulator = new AgeGateSimulator(25n);

      simulator.revokeCredential(nullifier);

      const ledgerState = simulator.getLedger();
      expect(ledgerState.revoked_nullifiers.lookup(nullifier)).toBe(true);

      expect(() => {
        simulator.verifyEligibility(nullifier, 18n, BigInt(Date.now()));
      }).toThrow("User identifier has been revoked");
    });
  });

  describe("Privacy & Zero-Knowledge Verification Guarantee", () => {
    it("ensures zero leak of private birthdate or secret keys to public ledger state", () => {
      const nullifier = randomBytes(32);
      const secret = randomBytes(32);
      const simulator = new AgeGateSimulator(28n, {
        birthYear: 1998n,
        birthMonth: 5n,
        birthDay: 12n,
        identitySecret: secret,
      });

      simulator.verifyDateOfBirthProof(nullifier, 2026n, 9n, 17n, 18n, BigInt(Date.now()));

      const ledgerState = simulator.getLedger();
      const publicKeys = Object.keys(ledgerState);

      expect(publicKeys).not.toContain("age");
      expect(publicKeys).not.toContain("birthYear");
      expect(publicKeys).not.toContain("birthMonth");
      expect(publicKeys).not.toContain("birthDay");
      expect(publicKeys).not.toContain("identitySecret");
    });
  });
});
