import sha256 from "crypto-js/sha256";

export function getIdentifier(emailOrUniqueId: string): string {
  if (!process.env.IDENTIFIER_SALT) {
    throw new Error("Missing salt configuration");
  }

  return sha256(process.env.IDENTIFIER_SALT + emailOrUniqueId).toString();
}
