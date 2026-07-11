/**
 * ============================================================================
 * x402 Casper Client
 * Shared Type Definitions
 * ============================================================================
 *
 * This file contains all shared interfaces and type definitions used by the
 * client. It should not contain any business logic.
 *
 * Compatible with:
 * - @casper-ecosystem/casper-eip-712 v1.2.x
 * - casper-js-sdk v5.x
 * - x402 Facilitator API
 * ============================================================================
 */

export type HexString = string;
export type AccountHash = string;
export type ContractHash = string;
export type PublicKeyHex = string;
export type SignatureHex = string;

/* ============================================================================
 * EIP-712 Domain
 * ========================================================================== */

export interface EIP712Domain {
  /**
   * Token / Protocol name
   */
  name: string;

  /**
   * Domain version
   */
  version: string;

  /**
   * CAIP-2 chain name
   *
   * Example:
   * casper:casper
   * casper:casper-test
   */
  network: string;

  /**
   * CEP-18 package hash
   *
   * 32-byte hex string
   */
  tokenContractHash: ContractHash;
}

/* ============================================================================
 * Transfer Authorization
 * ========================================================================== */

export interface TransferAuthorization {
  /**
   * Sender AccountHash (hex only)
   */
  from: AccountHash;

  /**
   * Receiver AccountHash (hex only)
   */
  to: AccountHash;

  /**
   * Token amount
   */
  value: string;

  /**
   * Unix timestamp
   */
  validAfter: string;

  /**
   * Unix timestamp
   */
  validBefore: string;

  /**
   * Random 32-byte nonce
   */
  nonce: HexString;
}

/* ============================================================================
 * Signed Authorization
 * ========================================================================== */

export interface SignedAuthorization {
  signature: SignatureHex;
  publicKey: PublicKeyHex;
  authorization: TransferAuthorization;
}

/* ============================================================================
 * Resource
 * ========================================================================== */

export interface Resource {
  url: string;
  description?: string;
}

/* ============================================================================
 * Payment Requirement
 * ========================================================================== */

export interface PaymentRequirementsExtra {
  name: string;
  version: string;
  decimals: string;
  symbol: string;
}

export interface PaymentRequirements {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra: PaymentRequirementsExtra;
}

/* ============================================================================
 * Accepted Payment
 * ========================================================================== */

export interface AcceptedPayment {
  scheme: string;
  network: string;
  asset: string;
  amount: string;
  payTo: string;
  maxTimeoutSeconds: number;
}

/* ============================================================================
 * x402 Payload
 * ========================================================================== */

export interface PaymentPayload {
  x402Version: number;

  resource: Resource;

  accepted: AcceptedPayment;

  payload: SignedAuthorization;
}

/* ============================================================================
 * Verify Request
 * ========================================================================== */

export interface VerifyRequest {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
}

/* ============================================================================
 * Verify Response
 * ========================================================================== */

export interface VerifyResponse {
  isValid: boolean;

  reason?: string;

  invalidReason?: string;

  invalidMessage?: string;
}

/* ============================================================================
 * Settlement Request
 * ========================================================================== */

export interface SettlementRequest {
  paymentPayload: PaymentPayload;
  paymentRequirements: PaymentRequirements;
}

/* ============================================================================
 * Settlement Response
 * ========================================================================== */

export interface SettlementResponse {
  success: boolean;

  transaction?: string;

  error?: string;
}

/* ============================================================================
 * Client Configuration
 * ========================================================================== */

export interface ClientConfig {
  facilitatorBaseUrl: string;

  apiKey: string;
}

/* ============================================================================
 * Payment Request
 * ========================================================================== */

export interface PaymentRequest {
  payerPemPath: string;

  payerAccountHash: AccountHash;

  recipientAccountHash: AccountHash;

  tokenContractHash: ContractHash;

  amount: string;

  resourceUrl: string;
}

/* ============================================================================
 * Signing Result
 * ========================================================================== */

export interface SigningResult {
  digest: Uint8Array;

  signature: SignatureHex;

  publicKey: PublicKeyHex;
}