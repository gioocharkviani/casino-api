# Promotions — end-to-end flow

Services involved: **API gateway** (HTTP) → **Promotions microservice** (TCP, entities/logic) → **Wallet microservice** (crediting) and **Game microservice** (free spins grant, dispatched by provider prefix).

## 1. Admin creates a promotion
`POST /admin/promotions` → gateway → Promotions `create()` (`promotions.service.ts:47`)
- Saved as `PromotionEntity`, status `DRAFT`.
- Key fields: `type` (`FREE_SPINS` | deposit/cashback/etc.), `rewardType` (`REAL_BALANCE` vs bonus/wagered), `rewardValue`, `wageringMultiplier`, `maxUsagePerUser`, `validityHours`, `triggerCondition` (JSON — e.g. `{ eventType: 'deposit', minDeposit: 20 }` or `{ promoCode: 'WELCOME50' }`), and for free spins: `freeSpinsGameIds` (admin-picked games), `userChoosesGame` (bool), `eligibleCategories`, `freeSpinsBetAmount`.
- Admin flips it to `ACTIVE` via `update()` when ready to go live.

## 2. Promotion reaches a user — three entry paths

**a) Manual/admin assign** — `assignToUser()` (`:146`)
Creates a `UserPromotionEntity` row (status `ASSIGNED`). If it's a free-spins promo with admin-picked games (`!userChoosesGame`), it **immediately** calls the game microservice's `GRANT_FREE_SPINS` message pattern once per game UUID in `freeSpinsGameIds` — this is now provider-agnostic (dispatches to Revolver or NuxGame based on the game's provider prefix, see `game.service.ts` `grantFreeSpins()`).

**b) Promo code redemption** — `redeemCode()` (`:315`), player-facing
Looks up an `ACTIVE` promotion whose `triggerCondition.promoCode` matches, then internally calls `assignToUser()` + `activate()` in one step.

**c) Automatic event trigger** — `handleTriggerEvent()` (`:461`)
Fired via TCP event `PROMO_TRIGGER` (emitted by the gateway, e.g. `PromotionsGatewayService.emitTrigger()` after a confirmed deposit webhook). Scans all `ACTIVE` promotions, matches `triggerCondition.eventType`/`minDeposit`, checks the user hasn't exceeded `maxUsagePerUser`, then calls `assignToUser()`.

## 3. User claims/activates the bonus
`activate()` (`:224`), inside a DB transaction:
- Computes the grant amount (`computeGrant`).
- **Wager-free + REAL_BALANCE reward** → credits the real wallet immediately via `creditWallet()` (TCP to Wallet microservice), status → `COMPLETED`.
- **Wagered reward** → locks the grant into an isolated `bonusBalance` on the `UserPromotionEntity`, sets `wageringRequired = grant * wageringMultiplier`, status → `ACTIVE`, `expiresAt` set.

## 4. Free spins — game selection (only if `userChoosesGame = true`)
- Player calls `PROMO_ELIGIBLE_GAMES` → `getEligibleGames()` to see allowed categories.
- Player picks a game → `PROMO_CHOOSE_GAME` → `chooseGameAndActivate()` (`:360`) → calls `GRANT_FREE_SPINS` for that one game, then flips the `UserPromotionEntity` to `ACTIVE`.
- This is the point that was previously hardcoded to `REVOLVER_GRANT_FREE_SPINS` — now generic `GRANT_FREE_SPINS`, so NuxGame games work here without extra promotions-side code.

## 5. Wagering progress (bonus-balance bonuses only)
- Every real-money bet fires a wallet debit callback (`POST /wallet/debit`, or now also `/wallet/nuxgame/debit`) → on success, gateway emits TCP event `BET_SETTLED` with `{ userId, betAmount, gameKey }`.
- Promotions microservice `@EventPattern('BET_SETTLED')` → `WageringService.applyBet()` advances `wageringCompleted` on the user's active bonus. When `wageringCompleted >= wageringRequired`, the bonus balance is presumably converted to real balance and status → `COMPLETED` (implemented in `WageringService`, not re-derived here — check `apps/promotions/src/wagering.service.ts` if you need the exact conversion logic).

## 6. Expiry
A cron job calls `PROMO_EXPIRE_STALE` → `WageringService.expireStale()` periodically to forfeit bonuses past `expiresAt`.

## 7. Audit trail
Every state change (`ASSIGNED`, `ACTIVATED`, cancellations) writes a `PromotionAuditEntity` row via `writeAudit()` — visible to admins via `getAuditLog()`.

## Provider coupling — what changed for NuxGame support
Before this change, free-spins granting and demo-URL admin lookups called Revolver-specific message patterns (`REVOLVER_GRANT_FREE_SPINS`, `REVOLVER_GET_DEMO_URL`) directly from Promotions/Admin. This meant every new provider required touching those services.

Now: Game microservice exposes provider-agnostic `GRANT_FREE_SPINS` / `GET_DEMO_URL` patterns (`game.controller.ts`), which internally resolve the game's `gameProvider.prefix` and dispatch to the right adapter (`RevolverService` or `NuxgameService`). Promotions and Admin call the generic pattern once and never need to know which provider a game belongs to — so once NuxGame's `games`/`game_providers` rows are populated (via `POST /game/nuxgame-refresh`) and real keys/signature scheme are filled in, free spins on NuxGame games work through the exact same promotions flow with zero further changes there.
