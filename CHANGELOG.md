# Changelog

## 2.0.1 — Bugfix release

- Fixed folder selection/encryption flow and prevented the folder picker from being used for normal file decryption.
- Added reliable folder input reset behavior and preserved relative folder paths.
- Added a 15 MB maximum for steganography input images and payload files.
- Hardened LSB extraction with deterministic RGB-channel addressing, header validation, payload-size validation, and shifted-stream recovery for compatible legacy images.
- Improved steganography PNG creation error handling.
- Fixed long Unicode/emoji steganography output overflowing its result container.
- Reworked Security Check so checks can be explicitly rerun with visible running/status feedback and localized results.
- Expanded Persian localization across the main tools, settings, help, key vault, signatures, inspector, hashing, file encryption, and steganography interfaces.
- Added safer UI messaging and clearer localized validation feedback.
- Bumped the application version to 2.0.1.
