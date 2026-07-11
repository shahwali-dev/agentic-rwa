/**
 * ============================================================================
 * x402 Casper Client
 * Configuration
 * ============================================================================
 *
 * Loads and validates all environment variables.
 *
 * This is the ONLY file that should access process.env.
 *
 * Compatible with:
 * - dotenv
 * - Node.js
 * ============================================================================
 */

import * as dotenv from "dotenv";

import type { ClientConfig } from "./types";

import {
  FACILITATOR_BASE_URL,
} from "./constants";

dotenv.config();

/* ============================================================================
 * Environment
 * ========================================================================== */

interface Environment {
  payerSecretKeyPath: string;

  payerAccountHash: string;

  facilitatorApiKey: string;
}

/* ============================================================================
 * Helpers
 * ========================================================================== */

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value.trim();
}

/* ============================================================================
 * Environment Variables
 * ========================================================================== */

const environment: Environment = {
  payerSecretKeyPath: requireEnv(
    "PAYER_SECRET_KEY_PATH"
  ),

  payerAccountHash: requireEnv(
    "PAYER_ACCOUNT_HASH"
  ),

  facilitatorApiKey: requireEnv(
    "CSPR_CLOUD_API_KEY"
  ),
};

/* ============================================================================
 * Client Configuration
 * ========================================================================== */

export const clientConfig: ClientConfig = {
  facilitatorBaseUrl: FACILITATOR_BASE_URL,

  apiKey: environment.facilitatorApiKey,
};

/* ============================================================================
 * Exported Configuration
 * ========================================================================== */

export const config = {
  env: environment,

  client: clientConfig,
} as const;