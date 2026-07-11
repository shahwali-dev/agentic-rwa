import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from "axios";
import { signTransferAuthorization } from "./eip712-signer";
import { config } from "./config";
import {
  API_ENDPOINTS,
  AUTHORIZATION_TIMEOUT_SECONDS,
  DEFAULT_NETWORK,
  DEFAULT_PAYMENT_SCHEME,
  DEFAULT_PAYMENT_TIMEOUT_SECONDS,
  DEFAULT_TOKEN_DECIMALS,
  DEFAULT_TOKEN_SYMBOL,
  DEFAULT_TOKEN_VERSION,
  DOMAIN_NAME,
  DOMAIN_VERSION,
  X402_VERSION,
} from "./constants";
import {
  EIP712Domain,
  PaymentPayload,
  PaymentRequest,
  PaymentRequirements,
  SettlementResponse,
  SignedAuthorization,
  TransferAuthorization,
  VerifyResponse,
} from "./types";
import {
  generateNonce,
  getAuthorizationWindow,
  normalizeAccountHash,
  normalizeContractHash,
} from "./utils";

/* ============================================================================
 * Error Classes
 * ========================================================================== */

export class X402ClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "X402ClientError";
  }
}

export class HttpError extends X402ClientError {
  constructor(message: string) {
    super(message);
    this.name = "HttpError";
  }
}

export class VerificationError extends X402ClientError {
  constructor(message: string) {
    super(message);
    this.name = "VerificationError";
  }
}

export class SettlementError extends X402ClientError {
  constructor(message: string) {
    super(message);
    this.name = "SettlementError";
  }
}

/* ============================================================================
 * Retry Helper
 * ========================================================================== */

async function retry<T>(operation: () => Promise<T>, attempts = 3, delayMs = 1000): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i === attempts - 1) break;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

/* ============================================================================
 * X402 Client
 * ========================================================================== */

export class X402Client {
  private readonly http: AxiosInstance;

  constructor() {
    this.http = axios.create({
      baseURL: config.client.facilitatorBaseUrl,
      timeout: 30000,
      headers: {
        Authorization: config.client.apiKey,
        "Content-Type": "application/json",
      },
    });
  }

  private log(message: string, data?: unknown): void {
    console.log(`[x402] ${message}`);
    if (data !== undefined) console.dir(data, { depth: null });
  }

  private async post<T>(endpoint: string, body: unknown, options?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.http.post<T>(endpoint, body, options);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new HttpError(this.formatAxiosError(error));
      }
      throw error;
    }
  }

  private formatAxiosError(error: AxiosError): string {
    if (error.response) return `HTTP ${error.response.status} : ${JSON.stringify(error.response.data)}`;
    if (error.request) return "No response received from facilitator.";
    return error.message;
  }

  private buildDomain(tokenContractHash: string): EIP712Domain {
    return {
      name: DOMAIN_NAME,
      version: DOMAIN_VERSION,
      network: DEFAULT_NETWORK,
      tokenContractHash: normalizeContractHash(tokenContractHash),
    };
  }

  private buildAuthorization(
    payer: string,
    recipient: string,
    amount: string
  ): TransferAuthorization {
    const window = getAuthorizationWindow(
      AUTHORIZATION_TIMEOUT_SECONDS
    );

    return {
      from: normalizeAccountHash(payer),

      to: this.formatPayTo(recipient),

      value: amount,
      validAfter: window.validAfter.toString(),
      validBefore: window.validBefore.toString(),
      nonce: generateNonce(),
    };
  }

  private async signAuthorization(pemPath: string, domain: EIP712Domain, authorization: TransferAuthorization): Promise<SignedAuthorization> {
    return signTransferAuthorization(pemPath, domain, authorization);
  }

  /**
 * Formats payTo exactly as expected by the facilitator.
 */
  private formatPayTo(recipient: string): string {
    const normalized = normalizeAccountHash(recipient);
    return `account-hash-${normalized}`;
  }

  private buildPaymentPayload(
    signed: SignedAuthorization,
    resourceUrl: string,
    recipient: string,
    tokenContractHash: string,
    amount: string
  ): PaymentPayload {
    return {
      x402Version: X402_VERSION,

      resource: {
        url: resourceUrl,
        description: "RWA Token Transfer",
      },

      accepted: {
        scheme: DEFAULT_PAYMENT_SCHEME,
        network: DEFAULT_NETWORK,
        asset: normalizeContractHash(tokenContractHash),
        amount,
        payTo: this.formatPayTo(recipient),
        maxTimeoutSeconds: DEFAULT_PAYMENT_TIMEOUT_SECONDS,
      },

      payload: signed,
    };
  }

  private buildPaymentRequirements(
    recipient: string,
    tokenContractHash: string,
    amount: string
  ): PaymentRequirements {
    return {
      scheme: DEFAULT_PAYMENT_SCHEME,
      network: DEFAULT_NETWORK,
      asset: normalizeContractHash(tokenContractHash),
      amount,
      payTo: this.formatPayTo(recipient),
      maxTimeoutSeconds: DEFAULT_PAYMENT_TIMEOUT_SECONDS,

      extra: {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        symbol: DEFAULT_TOKEN_SYMBOL,
        decimals: DEFAULT_TOKEN_DECIMALS,
      },
    };
  }

  public async verify(paymentPayload: PaymentPayload, paymentRequirements: PaymentRequirements): Promise<boolean> {
    this.log("Running verification...");
    const response = await retry(() => this.post<VerifyResponse>(API_ENDPOINTS.VERIFY, { paymentPayload, paymentRequirements }));

    console.dir(response, { depth: null });

    if (!response.isValid) throw new VerificationError(response.invalidMessage ?? response.reason ?? response.invalidReason ?? "Facilitator rejected payment.");
    this.log("Verification successful.");
    return true;
  }

  public async settle(paymentPayload: PaymentPayload, paymentRequirements: PaymentRequirements): Promise<string> {
    this.log("Submitting settlement request.");
    const response = await retry(() => this.post<SettlementResponse>(API_ENDPOINTS.SETTLE, { paymentPayload, paymentRequirements }));
    if (!response.success) throw new SettlementError(response.error ?? "Settlement failed.");
    this.log("Settlement completed successfully.");
    return response.transaction!;
  }

  public async makePayment(request: PaymentRequest): Promise<string> {
    const authorization = this.buildAuthorization(request.payerAccountHash, request.recipientAccountHash, request.amount);
    const domain = this.buildDomain(request.tokenContractHash);
    const signed = await this.signAuthorization(request.payerPemPath, domain, authorization);
    const payload = this.buildPaymentPayload(signed, request.resourceUrl, request.recipientAccountHash, request.tokenContractHash, request.amount);
    const requirements = this.buildPaymentRequirements(request.recipientAccountHash, request.tokenContractHash, request.amount);

    console.log("Authorization:");
    console.dir(authorization, { depth: null });

    console.log("Payment Payload:");
    console.dir(payload, { depth: null });

    console.log("Payment Requirements:");
    console.dir(requirements, { depth: null });

    await this.verify(payload, requirements);
    return await this.settle(payload, requirements);
  }
}