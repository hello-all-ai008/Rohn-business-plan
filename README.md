# Rohn-business-plan

Private quotation planning for ROHN Timing System. A separate clean A4 quotation preview omits all internal budget data. The seven example services, sample prices, R&D allocation and original terms come from the supplied HTML report; example data is never inserted into the database automatically.

## Setup

1. Supabase project `Rohn-business-plan` already exists in Singapore: `aogbdhzuzrjwlisjkwuf`.
2. Apply the migrations in order. The last migration creates `rohn_accounts` and `rohn_sessions`; the three initial accounts have already been provisioned in the connected project. The app has no self-signup UI.
3. `config.js` has the project URL and **publishable** key. The key is public by design. Never use a service role/secret key in the browser.
4. Deploy the `rohn-username-login` Edge Function with `verify_jwt = false` (it verifies its own opaque sessions). Deploy this directory as a static Vercel site (Framework: Other; no build step).

With the provided configuration, the sign-in screen opens and writes are stored in Supabase. Quotes, clients, items, internal allocations, accounts, and sessions are separate tables. Every user sees only their records. The browser calls an Edge Function, which validates sessions and scopes every database request to the verified account. Direct access to these tables is revoked for anonymous and authenticated browser keys. Passwords are bcrypt hashes; opaque session tokens are stored as SHA-256 hashes. Accounts must be provisioned by an administrator. Profile edits permit changing a user's own username and password; password changes revoke all existing sessions. The print view is assembled from approved fields only; confidential values are absent from its DOM.

This is a quotation planning tool; no invoicing, payment collection, or automatic VAT decision is provided. Set tax percent and seller registration details to fit your actual business before sending a document. Browser print offers Save as PDF.

## Authentication

Three initial usernames: `UN_HEAD` (admin), `GONG-Dev` and `TIW-Dev` (developers). Their passwords are generated separately and never committed. Usernames are matched without case sensitivity. Authentication uses `rohn_accounts` and `rohn_sessions`, not Supabase Auth. The role is stored for future permission controls; all three accounts currently have the same quotation permissions.

Initial passwords and profile password changes use eight decimal digits. Five failed sign-in attempts for the same username lock further attempts for 15 minutes. Do not commit passwords or distribute them in repository files.
