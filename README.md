# 🏢 Agentic RWA Tokenization Platform

[![Buildathon](https://img.shields.io/badge/Casper-Agentic%20Buildathon%202026-blue?style=flat-square&logo=gitbook)](https://www.casper.network/ai)
[![Framework](https://img.shields.io/badge/Framework-Odra%20(Rust)-orange?style=flat-square)](https://odra.dev/)
[![Network](https://img.shields.io/badge/Network-Casper%20Testnet-red?style=flat-square)](https://testnet.cspr.live/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

An enterprise-grade, security-hardened Real-World Asset (RWA) tokenization platform engineered natively for the **Casper Network** using the **Odra Smart Contract Framework**. This repository implements a robust asset tokenization layer combined with native **x402 Micropayments capability**, allowing autonomous AI agents to sign, execute, and route tokenized property balances via cryptographic off-chain signatures with strict replay protection.

---

## 💎 Architectural Highlights & Engineering Excellence

This platform is architected from the ground up to support the tokenization of heavy physical assets (e.g., RealEstate) while maintaining tight security bounds for multi-agent autonomous execution.

- **Automated x402 Micropayments Engine:** Implements advanced `transfer_with_authorization` paradigms. Autonomous agents act as secure facilitators, parsing signed allocations without requiring direct on-chain allowance gas overhead or private key vulnerability exposure.
- **Hardened Security Matrix & Nonce Tracking:** Features strict cryptographic nonce mapping (`used_nonces`) coupled with rigid unix block-time validation controls (`valid_after` / `valid_before`) to completely mathematically eliminate transaction-replay vectors.
- **Strict Decimals & Numerical Precision:** Engineered with exact `u64` constraint limits matching Casper's native serialization protocols, alongside a custom-tailored configuration framework ensuring zero compile-time or floating-point dependency bloat.

---

## 📂 Repository Layout & Context Blueprint

```text
.
├── .cargo/
│   └── config.toml               # Rust compiler optimization settings
├── bin/
│   ├── build_contract.rs         # WASM contract build entrypoint
│   ├── build_schema.rs           # Contract schema generator
│   ├── cli.rs                    # Deployment CLI
│   └── deploy.rs                 # Casper Testnet deployment pipeline
├── client/
│   ├── src/
│   │   ├── config.ts             # Client configuration
│   │   ├── constants.ts          # Shared project constants
│   │   ├── eip712-signer.ts      # Casper EIP-712 signing engine
│   │   ├── index.ts              # Client entrypoint
│   │   ├── types.ts              # Shared TypeScript types
│   │   ├── utils.ts              # Utility helpers
│   │   └── x402-client.ts        # x402 payment workflow implementation
│   ├── package.json              # Node.js client dependencies
│   └── package-lock.json
├── src/
│   ├── flipper.rs                # Contract storage host module
│   └── lib.rs                    # RWA token smart contract (CEP-18 + x402 authorization)
├── tests/                        # Smart contract integration tests
├── wasm/                         # Compiled WASM artifacts
├── build.rs                      # Odra build orchestration
├── Cargo.toml                    # Rust workspace configuration
├── Cargo.lock
├── LICENSE
└── README.md
```

---

## 🛠️ Technology Stack & Dependencies

- **Smart Contract Layer:** Odra Framework (Rust bare-metal target compilation)
- **On-Chain Target Ecosystem:** Casper Network (Testnet Ledger runtime)
- **Micropayment Standard Architecture:** x402 Facilitator Matrix Framework
- **Validation Engine:** `casper-engine-test-support` (Rigid local VM state assertion testing)
- **Compiler Optimizations:** Binaryen optimization tools integration

---

## ⚙️ Usage & Development Workflow

It's recommended to install `cargo-odra` first.

### Build

To compile standard smart contract modules:

```bash
cargo odra build
```

To build a wasm file, you need to pass the `-b` parameter. The result files will be placed in `${project-root}/wasm` directory.

```bash
cargo odra build -b casper
```

### Test

To run test on your local machine, you can basically execute the command:

```bash
cargo odra test
```

To test actual wasm files against a backend, you need to specify the backend passing `-b` argument to `cargo-odra`.

```bash
cargo odra test -b casper
```

### 🚀 Live Execution (Client Agent)

To initialize local configurations and execute the automated TypeScript/Rust runtime agent mesh:

```bash
# Navigate to client layer
cd client

# Spin up environment loop natively
npm install
npm run build
npm start
```

---

## 🛡️ Security Posture & Sandbox Configuration

- **Cryptographic Replay Prevention:** Nonces are bound to explicit address mapping matrices. Once an asset transfer signature has been processed, the state is locked permanently on-chain.
- **Rigid Sandbox Isolation:** `.gitignore` rules aggressively enforce context protection blocks preventing the leakage of private keys (`secret_key.pem`, `wallet.json`), `.pem` file streams, or heavy host compilation caches into the global stream.

---

**Engineered and Hardened by [Shah Wali (shahwali-dev)](https://github.com/shahwali-dev) for Casper Agentic Buildathon 2026.**
