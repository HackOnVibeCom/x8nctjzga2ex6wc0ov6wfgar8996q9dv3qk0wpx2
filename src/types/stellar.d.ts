declare module '@stellar/stellar-sdk' {
  export class Keypair {
    static random(): Keypair;
    static fromSecret(secretKey: string): Keypair;
    publicKey(): string;
    secret(): string;
  }
}
