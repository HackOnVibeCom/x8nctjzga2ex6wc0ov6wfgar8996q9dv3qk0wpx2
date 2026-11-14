declare module '@stellar/stellar-sdk' {
  export class Keypair {
    static random(): Keypair;
    static fromSecret(secretKey: string): Keypair;
    publicKey(): string;
    secret(): string;
  }

  export namespace Horizon {
    export class Server {
      constructor(serverURL: string, opts?: any);
      loadAccount(accountId: string): Promise<any>;
      submitTransaction(transaction: any): Promise<{
        hash: string;
        ledger: number;
        envelope_xdr?: string;
        result_xdr?: string;
      }>;
    }
  }

  export const Networks: {
    PUBLIC: string;
    TESTNET: string;
  };

  export class TransactionBuilder {
    constructor(sourceAccount: any, opts?: any);
    addOperation(operation: any): this;
    setTimeout(timeout: number): this;
    build(): any;
  }

  export class Asset {
    static native(): Asset;
    constructor(code: string, issuer: string);
  }

  export const Operation: {
    payment(opts: {
      destination: string;
      asset: any;
      amount: string;
    }): any;
    manageData(opts: {
      name: string;
      value: string | Buffer | null;
    }): any;
  };
}
