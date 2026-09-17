# 🛡️ Private Age Gate

[![CI Build](https://github.com/shwetasharma44044-eng/Private-Age-/actions/workflows/ci.yml/badge.svg)](https://github.com/shwetasharma44044-eng/Private-Age-/actions/workflows/ci.yml)

A production-grade decentralized application (**Level 5 - Full Moon Submission**) built on the Midnight Network. The Private Age Gate allows users to cryptographically prove they meet a specific age threshold (e.g., ≥ 18) without ever revealing their actual age, date of birth, or identity.

## 🌟 Hackathon Submission (Level 5)

- **On-Chain Preprod Contract Address:** `79346a13d2544938966e81c3723d594d2ff2b3d8f3321d21a40f3692125ff6f6` 🔗
- **Midnight Explorer:** [View Verified On-Chain Contract](https://preprod.midnightexplorer.com/contracts/0x79346a13d2544938966e81c3723d594d2ff2b3d8f3321d21a40f3692125ff6f6)🔍
- **Live Website:** [View the Deployed Vercel App](https://private-age-jet.vercel.app/) 🌐
- **Demo Video:** [Watch the working demo here](https://photos.app.goo.gl/NW1CeTQCNTADJQFHA) 🎥
- **X / Twitter:** [Follow on X (@PrivateAgeweb3)](https://x.com/PrivateAgeweb3) 🐦
- **👥 52 Preprod Users Log:** Refer to [USERS.md](./USERS.md) (also in [docs/USERS.md](./docs/USERS.md)) for 52 verifiable test transactions on Midnight Preprod.
- **📝 Community Feedback Form:** [Google Form Survey](https://forms.gle/1UVUCzzTTdDPB5x47) 📋
- **📊 Live Feedback Responses Sheet:** [View 52 Survey Responses (Google Sheets)](https://docs.google.com/spreadsheets/d/1Co11YVtVtqe5wlQQ6sB6nmK5wng1HXk2zy4FJZdsl9g/edit?usp=sharing) 📈
- **🔄 User Feedback Loop:** Refer to [docs/FEEDBACK.md](./docs/FEEDBACK.md) (also in [FEEDBACK.md](./FEEDBACK.md)) for survey analysis, NPS metrics, and product iterations.
- **📢 User Acquisition Messages:** See [docs/USER_ACQUISITION.md](./docs/USER_ACQUISITION.md) for community recruitment message templates (Discord, X, Telegram, College groups).
- **Proposal:** Please refer to the [PROPOSAL.md](./PROPOSAL.md) for the detailed problem statement and solution overview.

## 🏛️ Level 5 Contract Architecture & Privacy Model

The application leverages Midnight's Compact smart contracts with a multi-circuit ZK Identity & Credential architecture:

| Data | Storage | Visibility |
|------|---------|------------|
| **User's Actual Age / DOB (Year, Month, Day)** | Local Wallet Enclave (Witness) | 🔒 **Private** (Never leaves client device) |
| **Master Identity Secret & Salt** | Local Witness Enclave | 🔒 **Private** |
| **Anonymous Action Nullifier** | Midnight Public Ledger | 🌍 **Public** (Unlinkable Sybil-Resistant ID) |
| **Eligibility Result & Verified Tier** | Midnight Public Ledger | 🌍 **Public** (Verifiable on-chain) |
| **Verification Timestamp & Expiry** | Midnight Public Ledger | 🌍 **Public** |

### ⚡ Level 5 Compact Circuits

1. **`verifyEligibility(user, threshold, timestamp)` (Standard Age Gate):**
   - Ingests `localAge` and `localCredentialExpiry` from private witness enclaves.
   - Asserts age meets threshold and credential has not expired or been revoked.
2. **`verifyDateOfBirthProof(nullifier, currentYear, currentMonth, currentDay, thresholdYears, timestamp)` (DOB Calendar Arithmetic):**
   - Ingests `(localBirthYear, localBirthMonth, localBirthDay)`.
   - Computes day-accurate cryptographic proof: `(currentYear - birthYear > threshold) || (yearDiff == threshold && currentMonth > birthMonth) || (yearDiff == threshold && currentMonth == birthMonth && currentDay >= birthDay)`.
   - Preserves complete zero-knowledge privacy with 0 leak of birthdate.
3. **`verifyTieredAccess(nullifier, requiredTier, currentTimestamp)` (Multi-Tier Permission):**
   - **Tier 1 (≥ 13):** Teen & Social Platforms
   - **Tier 2 (≥ 18):** Web3 Gaming & General dApps
   - **Tier 3 (≥ 21):** DeFi & Regulated Financial Protocols
   - **Tier 4 (≥ 25):** Accredited / Institutional Access
4. **`revokeCredential(nullifier)` (Credential Revocation):**
   - Revocation blacklist registry circuit ensuring compromised or outdated credentials cannot be reused.


## 🚀 Setup and Local Run

### Prerequisites
- Node.js 24+
- Docker (required for `compact` compiler toolchain)
- Lace Wallet browser extension

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/shwetasharma44044-eng/Private-Age-.git
   cd Private-Age-
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the contract and build the frontend:
   ```bash
   npm run build:start
   ```
4. Open the UI at `http://localhost:xxxx` (port will be printed in the terminal).

## 🧪 Testing

The project includes strict verification tests ensuring zero privacy leaks.

```bash
# Run contract circuit tests
npm run test:contract

# Run frontend UI tests
npm run test:ui
```

## 📸 Screenshots & Proof of Work

### 1. User Interface (UI)
*Add a screenshot of your beautiful Tailwind CSS frontend here.*
![UI Screenshot](image.png)

### 2. CI/CD Pipeline Success
*GitHub Actions CI workflow passing all checks.*
![CI/CD Pipeline Success](image-3.png)

### 3. Test Outputs
*Passing unit tests for both Compact contract circuits and React UI.*
![Test Outputs](image-2.png)

## 📝 Contract Address

- **Environment:** Midnight Preprod
- **Deployed Contract Address (Preprod):** `79346a13d2544938966e81c3723d594d2ff2b3d8f3321d21a40f3692125ff6f6`
- **Explorer Contract Link:** [https://preprod.midnight.network/contract/79346a13d2544938966e81c3723d594d2ff2b3d8f3321d21a40f3692125ff6f6](https://preprod.midnightexplorer.com/contracts/0x79346a13d2544938966e81c3723d594d2ff2b3d8f3321d21a40f3692125ff6f6)
- **Live Website:** [https://private-age-jet.vercel.app/](https://private-age-jet.vercel.app/)

## 🌕 Level 5 Milestones (Full Moon)

- **👥 52 Preprod Beta Testers:** Successfully onboarded 52 verifiable user transactions on Midnight Preprod network with 100% ZK proof verification success. See [USERS.md](./USERS.md) and [docs/USERS.md](./docs/USERS.md).
- **🔄 Structured Feedback Loop:** Collected detailed feedback across 52 users (NPS: +74, 96% satisfaction) and implemented UI/UX improvements (visual proof badges, error resilience, privacy explainer). See [docs/FEEDBACK.md](./docs/FEEDBACK.md).
- **📢 User Acquisition:** Drafted targeted messages for Discord, X/Twitter, Telegram, and College groups in [docs/USER_ACQUISITION.md](./docs/USER_ACQUISITION.md).
- **📈 Minimum 20 Commits:** Over 100+ meaningful, structured commits documenting the evolution from Level 1 to Level 5.

## 👩‍💻 Author & Social Details

- **Author / Developer:** Shweta Sharma
- **GitHub Profile:** [@shwetasharma44044-eng](https://github.com/shwetasharma44044-eng)
- **Twitter / X Profile:** [https://x.com/Shweta_Sharma_3](https://x.com/PrivateAgeweb3)
- **GitHub Repository:** [Private-Age-](https://github.com/shwetasharma44044-eng/Private-Age-)
- **Live Website:** [https://private-age-jet.vercel.app/](https://private-age-jet.vercel.app/)


