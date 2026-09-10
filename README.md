# ContentProof

**A creator authenticity registry — provable, revocable claims to your content, backed by a real, verified human.**

Built for ETHGlobal Online. Targets the **ENS (Best Use of ENSv2)** and **World (Selfie Check)** prize tracks.

---

## The problem

Social platforms have no reliable, cross-platform way to prove who created
a piece of content first. Copying is nearly effortless — AI tools can
re-crop, recompress, or lightly edit media in seconds to dodge naive
duplicate-detection filters — and existing remedies (DMCA takedowns,
platform-native Content ID systems) are slow, reactive, and locked to a
single platform.

Worse, any attribution system that isn't tied to verified identity is
trivially gamed: sybil accounts can register content in bulk, turning
"who made this first" into "which bot registered fastest." An attribution
registry is only as trustworthy as the identity behind each claim.

## The solution

ContentProof gives creators a **portable, revocable, on-chain claim** to
their content, gated by proof that a real, unique human is behind it:

1. A creator verifies as a real, unique human via **World ID Selfie Check**.
2. They receive a personal **ENSv2 subname** (`alice.contentproof.eth`)
   under a root registry — an identity that exists independently of any
   platform.
3. Each piece of content they register gets its own content subname
   (`post-<hash>.alice.contentproof.eth`), with a **perceptual hash**,
   timestamp, origin URL, and license stored as resolver text records.
4. That claim is **non-transferable and revocable only by the original
   registrant**, enforced by ENSv2's Enhanced Access Control.
5. Anyone — a platform, a licensing party, another creator — can check
   whether a piece of content is already claimed, and by whom.
6. A duplicate registration attempt is automatically flagged and rejected;
   a fraudulent claim can be disputed and revoked by the true owner.

Because verification and attribution are combined, a claim actually means
something: *a specific, real, unique human — who can't be impersonated by
a sybil — holds a revocable, first record of this content.*

---

## Features

**Identity & trust**
- Verified-human registration via World ID Selfie Check
- Portable, platform-independent creator identity (ENSv2 subname)

**Content attribution**
- Per-content claims with hash, timestamp, origin URL, and license on-chain
- Edit-resistant perceptual-hash fingerprinting (survives recompression,
  cropping, watermarking — unlike exact file hashing)
- Non-transferable, revocable claims via Enhanced Access Control

**Detection & enforcement**
- Automatic duplicate-registration blocking
- Public authenticity checker (paste an image/URL, see if it's claimed)
- Fraud dispute and revocation, controlled solely by the original owner

**Interfaces**
- Creator dashboard: connect, verify, register, view, revoke
- Public checker page, backed by a fast off-chain index

---

## Architecture

```
Creator (wallet)
   |
   v
World ID / Selfie Check  --->  verifies real, unique human
   |
   v
ENSv2 subname registration  (alice.contentproof.eth)
   |
   v
Permissioned Resolver record  (content hash, timestamp, license)
   |
   v
New upload elsewhere  --->  hash computed  --->  Detection service
                                                       |
                                        +--------------+--------------+
                                        |                             |
                                   match found                  no match
                                        |                             |
                                        v                             v
                              flag copy, notify              register as new
                              original owner via                 content
                              resolver record
```

### Why ENSv2 specifically

Standard attribution schemes require deploying or managing a separate
record per item. ENSv2's Permissioned Registry lets content subnames
resolve **straight off their parent's resolver** via wildcard resolution —
so registering a new piece of content doesn't require a new contract
deployment, just a new subname under the creator's existing registry.
Enhanced Access Control is what makes a claim durable: it's what prevents
a claim from being silently reassigned or transferred away from its
original owner.

### Why World ID / Selfie Check specifically

Without a human-verification gate, this system reduces to "whoever
registers first wins" — trivially gamed by sybil wallets. Selfie Check
binds one real, unique human to one registration, so racing to claim
someone else's content requires racing with real, distinct people, not
disposable wallets.

---

## Tech stack

| Layer | Choice |
|---|---|
| Contracts | Solidity ^0.8.24, Foundry, deployed to Sepolia |
| ENS | ENSv2 Permissioned Registry + Permissioned Resolver + Enhanced Access Control |
| Identity | `@worldcoin/idkit` (Selfie Check), server-side proof verification |
| Chain interaction | `viem` + `wagmi`, `@ensdomains/ensjs` where ENSv2-compatible |
| Wallet connect | RainbowKit / ConnectKit |
| Perceptual hashing | `sharp` + `blockhash-core` |
| Off-chain index | Prisma + PostgreSQL (cache of on-chain resolver records, not source of truth) |
| Frontend/backend | Next.js (App Router) + TypeScript + Tailwind CSS |
| Deployment | Vercel (app), Alchemy/Infura (Sepolia RPC) |

---

## Prior art

Blockchain-anchored content attribution isn't a new category — and that's
a point in this project's favor, not against it:

- **C2PA / Adobe Content Authenticity Initiative** — the industry-standard
  approach to signed content metadata, backed by Adobe, AP, BBC, and others.
  It's metadata-based rather than on-chain, and by its own design can be
  stripped, and re-encoding on upload can break the credential chain —
  exactly the failure mode perceptual hashing is built to survive.
- **ScoreDetect** — a commercial product combining content fingerprinting
  with blockchain timestamping for tamper-proof provenance without storing
  the underlying file.

ContentProof's contribution is the specific combination: a **decentralized,
creator-owned** registry (not a proprietary platform's database) built on
**ENSv2's** revocable, non-transferable subname primitives, gated by
**World ID's** human-verification layer to close the sybil-registration
gap that a pure attribution registry can't solve alone.

---

## Repo structure

```
contentproof/
├── README.md
├── FEEDBACK.md                 <- World's required developer feedback doc
├── contracts/
│   ├── ContentProofRegistry.sol
│   └── ContentProofResolver.sol
├── backend/
│   ├── hashing/                <- perceptual hash service
│   ├── detection/               <- match/no-match logic
│   └── worldid/                 <- Selfie Check verification middleware
├── frontend/
│   ├── dashboard/               <- creator: register, view, revoke
│   └── checker/                  <- public: "is this content claimed?"
└── demo/
    └── demo-video.mp4 (or link)
```

---

## Implementation roadmap

See [IMPLEMENTATION.md](./IMPLEMENTATION.md) for what is done (Phase 0 scaffold) and the phased plan for frontend, backend, World ID, ENSv2 contracts, and submission.

## Getting started

```bash
git clone <repo-url>
cd contentproof
npm install

# Contracts (run Foundry from WSL — Ubuntu 22.04+ recommended)
cd contracts && forge install foundry-rs/forge-std && forge build && forge test && cd ..

# Database
# Requires a running PostgreSQL instance and DATABASE_URL in .env
npx prisma migrate dev

# Run locally
npm run dev
```

### Environment variables

```
NEXT_PUBLIC_WORLD_APP_ID=          # from World Developer Portal
NEXT_PUBLIC_WORLD_RP_ID=           # Relying Party id (World ID 4.x)
NEXT_PUBLIC_WORLD_ENVIRONMENT=staging
WORLD_RP_SIGNING_KEY=              # RP signing key (server-only)
WORLD_APP_SECRET=                   # cookie HMAC / legacy secret
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=
NEXT_PUBLIC_SEPOLIA_RPC_URL=        # Alchemy/Infura endpoint
DEPLOYER_PRIVATE_KEY=               # Sepolia deployer wallet, testnet only
DATABASE_URL=                       # PostgreSQL connection string (Prisma)
CONTENTPROOF_REGISTRY_ADDRESS=      # filled in after deploying the root registry
```

---

## Deployed contracts (Sepolia)

| Contract | Address |
|---|---|
| ContentProof Registry (`contentproof.eth`) | `TBD` |
| ContentProof Resolver | `TBD` |

## Demo

- Demo video: `TBD`
- Live app: `TBD`

---

## Sponsor track qualification

**ENS — Best Use of ENSv2**
- [ ] Functional on ENSv2 Sepolia, no hardcoded values
- [ ] Demo shows a duplicate registration attempt being caught
- [ ] README explains why ENSv2's hierarchy/resolver model specifically matters here (see above)

**World — Selfie Check**
- [ ] Selfie Check gates registration as a real abuse-prevention control
- [ ] Tested via the World ID Sandbox App
- [ ] `FEEDBACK.md` included with integration notes

---

## License

MIT