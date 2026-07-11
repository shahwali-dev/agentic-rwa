// src/utils.ts

import { randomBytes } from "crypto";
import { ACCOUNT_HASH_LENGTH, NONCE_LENGTH } from "./constants";

/**
 * Removes 0x prefix if present.
 */
export function normalizeHex(value: string): string {
  return value.startsWith("0x") ? value.slice(2) : value;
}

/**
 * Normalizes Casper account hash.
 *
 * Accepts:
 * account-hash-xxxx
 * entity-account-xxxx
 * 0x....
 * xxxx
 *
 * Returns:
 * 64-character lowercase hex string.
 */
export function normalizeAccountHash(value: string): string {
  return normalizeHex(
    value
      .replace(/^account-hash-/, "")
      .replace(/^entity-account-/, "")
      .toLowerCase()
  );
}

/**
 * Normalizes contract hash.
 *
 * Accepts:
 * hash-xxxx
 * contract-package-wasmxxxx
 * 0x...
 * xxxx
 */
export function normalizeContractHash(
  value: string
): string {
  return normalizeHex(
    value
      .replace(/^contract-hash-/, "")
      .replace(/^contract-package-hash-/, "")
      .replace(/^contract-package-/, "")
      .replace(/^hash-/, "")
      .toLowerCase()
  );
}

/**
 * Generates a cryptographically secure 32-byte nonce.
 */
export function generateNonce(): string {
  return randomBytes(NONCE_LENGTH).toString("hex");
}

/**
 * Returns authorization validity window.
 *
 * validAfter = now
 * validBefore = now + timeout
 */
export function getAuthorizationWindow(timeoutSeconds = 300) {
  const now = Math.floor(Date.now() / 1000);

  return {
    validAfter: now,
    validBefore: now + timeoutSeconds,
  };
}

/**
 * Converts number/string/bigint into bigint.
 */
export function toBigInt(
  value: string | number | bigint
): bigint {
  if (typeof value === "bigint") {
    return value;
  }

  return BigInt(value);
}

/**
 * Validates generic hex string.
 */
export function assertHex(
  value: string,
  expectedLength?: number
): void {
  const hex = normalizeHex(value);

  if (!/^[0-9a-fA-F]+$/.test(hex)) {
    throw new Error(`Invalid hex value: ${value}`);
  }

  if (
    expectedLength !== undefined &&
    hex.length !== expectedLength
  ) {
    throw new Error(
      `Expected ${expectedLength} hex characters but received ${hex.length}.`
    );
  }
}

/**
 * Ensures value is exactly 32 bytes (64 hex chars).
 */
export function assertBytes32(value: string): void {
  assertHex(value, NONCE_LENGTH * 2);
}

/**
 * Ensures value is a valid Casper AccountHash.
 */
export function assertAccountHash(value: string): void {
  assertHex(
    normalizeAccountHash(value),
    ACCOUNT_HASH_LENGTH * 2
  );
}