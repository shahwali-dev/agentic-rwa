/**
 * ============================================================================
 * x402 Casper Client
 * Shared Constants
 * ============================================================================
 *
 * Central location for all project constants.
 *
 * Compatible with:
 * - Casper Testnet
 * - Casper Mainnet
 * - x402 Facilitator
 * ============================================================================
 */

/* ============================================================================
 * Client
 * ========================================================================== */

export const CLIENT_NAME = "rwa-token-client";

export const CLIENT_VERSION = "1.0.0";

/* ============================================================================
 * x402
 * ========================================================================== */

export const X402_VERSION = 2;

export const FACILITATOR_BASE_URL =
  "https://x402-facilitator.cspr.cloud";

/* ============================================================================
 * Network
 * ========================================================================== */

export const CASPER_TESTNET =
  "casper:casper-test";

export const CASPER_MAINNET =
  "casper:casper";

/**
 * Default network used by the client.
 */
export const DEFAULT_NETWORK =
  CASPER_TESTNET;

/* ============================================================================
 * EIP-712
 * ========================================================================== */

export const DOMAIN_NAME = "Cep18x402";

export const DOMAIN_VERSION = "1";

/**
 * Compatibility aliases.
 */
export const TOKEN_NAME = DOMAIN_NAME;

export const TOKEN_VERSION = DOMAIN_VERSION;

/* ============================================================================
 * Payment
 * ========================================================================== */

export const DEFAULT_PAYMENT_SCHEME = "exact";

export const DEFAULT_PAYMENT_TIMEOUT_SECONDS = 300;

export const DEFAULT_VERIFY_TIMEOUT_SECONDS = 900;

/* ============================================================================
 * Token Defaults
 * ========================================================================== */

export const DEFAULT_TOKEN_SYMBOL = "RWA";

export const DEFAULT_TOKEN_DECIMALS = "0";

export const DEFAULT_TOKEN_VERSION = "1";

/* ============================================================================
 * Nonce
 * ========================================================================== */

export const NONCE_SIZE_BYTES = 32;

/**
 * 32-byte compatibility alias.
 */
export const BYTES32_LENGTH =
  NONCE_SIZE_BYTES;

/* ============================================================================
 * Time
 * ========================================================================== */

export const SECONDS_PER_MINUTE = 60;

export const DEFAULT_AUTHORIZATION_LIFETIME_SECONDS =
  5 * SECONDS_PER_MINUTE;

/**
 * Compatibility alias.
 */
export const AUTHORIZATION_TIMEOUT_SECONDS =
  DEFAULT_AUTHORIZATION_LIFETIME_SECONDS;

/* ============================================================================
 * HTTP
 * ========================================================================== */

export const HTTP_HEADERS = {
  CONTENT_TYPE: "application/json",
} as const;

/* ============================================================================
 * API Endpoints
 * ========================================================================== */

export const API_ENDPOINTS = {
  VERIFY: "/verify",
  SETTLE: "/settle",
} as const;

/* ============================================================================
 * Logging
 * ========================================================================== */

export const LOG_PREFIX = {
  INFO: "ℹ️",
  SUCCESS: "✅",
  WARNING: "⚠️",
  ERROR: "❌",
  REQUEST: "📤",
  RESPONSE: "📥",
  SIGN: "✍️",
  VERIFY: "🔍",
  SETTLE: "🚀",
} as const;

/* ============================================================================
 * Validation
 * ========================================================================== */

export const ACCOUNT_HASH_LENGTH = 32;

export const CONTRACT_HASH_LENGTH = 32;

export const NONCE_LENGTH = 32;

export const PUBLIC_KEY_MIN_LENGTH = 32;

export const SIGNATURE_LENGTH = 64;

/* ============================================================================
 * Regular Expressions
 * ========================================================================== */

export const HEX_REGEX =
  /^[0-9a-fA-F]+$/;

export const HEX_WITH_PREFIX_REGEX =
  /^0x[0-9a-fA-F]+$/;

/* ============================================================================
 * Account Prefixes
 * ========================================================================== */

export const ACCOUNT_HASH_PREFIX =
  "account-hash-";

export const ENTITY_ACCOUNT_PREFIX =
  "entity-account-";

export const HEX_PREFIX = "0x";