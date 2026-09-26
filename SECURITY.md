# Security Policy

## Scope

Encryption Center is a client-side cryptography application. Security reports about cryptographic misuse, authentication failures, data leakage, unsafe parsing, or vulnerabilities in the application are welcome.

## Reporting

Please do not publish a newly discovered vulnerability with enough detail to enable exploitation before it has been reviewed. Open a private security report through the repository's GitHub security reporting mechanism when available.

Include:

- affected version/commit
- browser and operating system
- exact reproduction steps
- expected vs actual behavior
- security impact
- a minimal proof of concept when safe to provide

## Cryptographic changes

Do not replace established cryptographic primitives with custom implementations. Prefer Web Crypto API or maintained cryptographic libraries and document the security model of new formats.

## Threat model

The project does not protect against a compromised operating system, malicious browser extensions, injected scripts, malware, or an attacker who can inspect the user's device while secrets are in memory.
