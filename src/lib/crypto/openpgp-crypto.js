// OpenPGP-style hybrid encryption using OpenPGP.js (audited library).
// Encrypts to a passphrase (symmetric) using AES-256 + Argon2nd KDF.

import * as openpgp from "openpgp";

const enc = new TextEncoder();

export async function openpgpEncrypt(plaintext, password) {
  const message = await openpgp.createMessage({ text: plaintext });
  const encrypted = await openpgp.encrypt({
    message,
    passwords: [password],
    config: { preferredSymmetricAlgorithm: "aes256" },
  });
  return encrypted; // armored string
}

export async function openpgpDecrypt(armored, password) {
  const message = await openpgp.readMessage({ armoredMessage: armored });
  const { data } = await openpgp.decrypt({
    message,
    passwords: [password],
    format: "string",
  });
  return data;
}

// Asymmetric: encrypt to a public key, decrypt with private key (armored)
export async function openpgpEncryptToKey(plaintext, publicKeyArmored) {
  const pubKeys = await openpgp.readKey({ armoredKey: publicKeyArmored });
  const message = await openpgp.createMessage({ text: plaintext });
  return openpgp.encrypt({ message, encryptionKeys: [pubKeys] });
}

export async function openpgpDecryptWithKey(armored, privateKeyArmored, passphrase) {
  const privKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });
  const key = passphrase ? await openpgp.decryptKey({ privateKey: privKey, passphrase }) : privKey;
  const message = await openpgp.readMessage({ armoredMessage: armored });
  const { data } = await openpgp.decrypt({ message, decryptionKeys: [key], format: "string" });
  return data;
}

export async function openpgpGenerateKeyPair(name, email, passphrase) {
  const { privateKey, publicKey } = await openpgp.generateKey({
    type: "ecc",
    curve: "ed25519",
    userIDs: [{ name: name || "User", email: email || "user@example.com" }],
    passphrase: passphrase || undefined,
    format: "armored",
  });
  return { privateKey, publicKey };
}