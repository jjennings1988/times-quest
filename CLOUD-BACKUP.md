# Times Quest family backup and future cloud accounts

## What v0.11 implements

Protected family backup is a parent-controlled recovery and transfer tool. It
collects every local climber profile and save, encrypts that bundle inside the
browser, and hands the encrypted `.tqbackup` file to the device share sheet or
download manager. The parent chooses Files, iCloud Drive, Google Drive,
OneDrive, external storage, or another destination.

Times Quest does not run an account server for this feature. It receives no
profile names, learning history, camp state, backup file, cloud-drive token, or
passphrase. Normal play remains local and fully offline.

The previous plaintext single-climber JSON export remains under **Advanced
single-climber backup** for troubleshooting. Parents should prefer the protected
family backup when the file will leave the device.

## Data and security boundary

| Location | Contents | Protection |
|---|---|---|
| Browser storage | Local family profile index and one save per climber | Device/browser controls |
| Encrypted backup payload | Profile nicknames, avatar choices, mastery, realms, rewards, settings, and camps | AES-256-GCM |
| Visible backup envelope | Format/version, export time, encryption parameters, salt, IV, ciphertext | No child profile information |
| Times Quest server | Nothing from the backup feature | No upload endpoint exists |

The app derives the encryption key from the parent passphrase using
PBKDF2-HMAC-SHA-256 with 250,000 iterations and a fresh random 16-byte salt.
Each backup uses a fresh 12-byte IV and AES-256-GCM authenticated encryption.
The passphrase and derived key are never stored. A forgotten passphrase cannot
be recovered by Times Quest.

This protects a backup file from casual disclosure if copied or stored in a
cloud drive. It does not replace device security, a strong unique passphrase,
or the cloud provider's account protections.

## Restore rules

- The app accepts only the current protected-backup envelope and bundle format.
- It caps imports at 10 MB and validates profile count, unique IDs, names,
  avatars, and required save structures before changing local data.
- Every imported save is migrated in memory first. Only a fully valid family
  bundle is written.
- The parent sees the number of climbers and must confirm that restore replaces
  every local family profile.
- Profiles not present in the restored family are removed after the new profile
  book is safely written.
- A wrong passphrase, damaged file, unsupported version, failed migration, or
  cancelled warning leaves local progress unchanged.

This is intentional whole-family replacement, not automatic sync or merge.

## Hosted parent accounts: activation gates

Hosted sync should be a separate, opt-in release only after beta use proves a
real recurring multi-device need. Before any live child information is
collected, complete all of these gates:

1. Obtain current child-privacy legal review, including COPPA applicability,
   direct notice, verifiable parental consent, retention, deletion, and any
   relevant state or international requirements.
2. Select the parent identity, consent, hosting, email, monitoring, and backup
   processors; document their data handling and obtain the necessary written
   contractual assurances.
3. Publish an accurate privacy notice and in-product parent data map before
   collection begins.
4. Implement parent-only authentication and recovery. Child profiles continue
   to use only a nickname and avatar inside the family account—no child email,
   birth date, photo, voice, contacts, location, or public identifier.
5. Keep the local save authoritative and offline-capable. Upload only after an
   authenticated parent explicitly opts in.
6. Encrypt transport and storage, isolate every family server-side, rate-limit
   endpoints, log parent security actions without logging learning answers, and
   test authorization between accounts.
7. Ship parent access, portable export, deletion, consent withdrawal, and a
   short documented retention schedule before enabling sync.
8. Define deterministic conflicts. Fact mastery should merge by fact using the
   newest review evidence; unlocks should preserve the furthest earned state;
   currencies must use an append-only transaction ledger; camp layouts require
   a visible “choose this version” decision when both devices changed them.
9. Pilot with a small group of consenting families, exercise incident response,
   and verify account deletion through every processor and backup lifecycle.

No ads, behavioral profiling, public child profiles, chat, social graph,
leaderboards, or child-targeted push notifications should be added.

## Primary references

- [FTC: Complying with COPPA — Frequently Asked Questions](https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions)
- [FTC: Children's Online Privacy Protection Rule](https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa)
