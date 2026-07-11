import {
  buildDomain,
  CASPER_DOMAIN_TYPES,
  hashTypedData,
  TransferAuthorizationTypes,
} from "@casper-ecosystem/casper-eip-712";

import {
  KeyAlgorithm,
  PrivateKey,
} from "casper-js-sdk";

import { readFile } from "fs/promises";

import {
  EIP712Domain,
  SignedAuthorization,
  TransferAuthorization,
} from "./types";

import {
  assertAccountHash,
  assertBytes32,
  normalizeContractHash,
  toBigInt,
} from "./utils";

/**
 * Loads an ED25519 private key from a PEM file.
 */
async function loadPrivateKey(
  pemPath: string
): Promise<PrivateKey> {
  const pem = await readFile(pemPath, "utf8");

  return PrivateKey.fromPem(
    pem,
    KeyAlgorithm.ED25519
  );
}

/**
 * Builds the Casper-native EIP-712 domain.
 */
function createDomain(domain: EIP712Domain) {
  return buildDomain(
    domain.name,
    domain.version,
    domain.network,
    normalizeContractHash(domain.tokenContractHash)
  );
}

/**
 * Converts our application model into the
 * exact message expected by the EIP-712 library.
 */
function createMessage(
  authorization: TransferAuthorization
) {
  assertAccountHash(authorization.from);
  assertAccountHash(authorization.to);
  assertBytes32(authorization.nonce);

  return {
    from: authorization.from,
    to: authorization.to,
    value: toBigInt(authorization.value),
    valid_after: toBigInt(
      authorization.validAfter
    ),
    valid_before: toBigInt(
      authorization.validBefore
    ),
    nonce: authorization.nonce,
  };
}

/**
 * Builds the EIP-712 digest.
 */
export function buildTransferDigest(
  domain: EIP712Domain,
  authorization: TransferAuthorization
): Uint8Array {
  return hashTypedData(
    createDomain(domain),
    TransferAuthorizationTypes,
    "TransferAuthorization",
    createMessage(authorization),
    {
      domainTypes: CASPER_DOMAIN_TYPES,
    }
  );
}

/**
 * Signs a TransferAuthorization using
 * an ED25519 Casper private key.
 */
export async function signTransferAuthorization(
  pemPath: string,
  domain: EIP712Domain,
  authorization: TransferAuthorization
): Promise<SignedAuthorization> {
  const privateKey = await loadPrivateKey(
    pemPath
  );

  const digest = buildTransferDigest(
    domain,
    authorization
  );

  const signature =
    await privateKey.signAndAddAlgorithmBytes(
      digest
    );

  return {
    authorization,
    signature: Buffer.from(signature).toString(
      "hex"
    ),
    publicKey: privateKey.publicKey.toHex(),
  };
}