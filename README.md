# Rohn-business-plan

Private quotation planning for ROHN Timing System. A separate clean A4 quotation preview omits all internal budget data. The seven example services, sample prices, R&D allocation and original terms come from the supplied HTML report; example data is never inserted into the database automatically.

## Setup

1. Supabase project `Rohn-business-plan` already exists in Singapore: `aogbdhzuzrjwlisjkwuf`.
2. The migration `supabase/migrations/20260924000000_initial.sql` has been applied already. The schema uses email/password Auth and owner scoped RLS. Create your own account via the app; email confirmation depends on project Auth settings.
3. `config.js` has the project URL and **publishable** key. The key is public by design. Never use a service role/secret key in the browser.
4. Deploy this directory as a static Vercel site (Framework: Other; no build step) and configure Supabase Auth Site URL to the deployed URL.

With the provided configuration, the sign-in screen opens and writes are stored in Supabase. Quotes, clients, items, and internal allocations are separate tables. Every user sees only their records. The print view is assembled from approved fields only; confidential values are absent from its DOM.

This is a quotation planning tool; no invoicing, payment collection, or automatic VAT decision is provided. Set tax percent and seller registration details to fit your actual business before sending a document. Browser print offers Save as PDF.
