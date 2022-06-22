Burn is a simple app to tell you when your business will run out of money.

Features we're working on:

- [ ] Figure out how to use session with static render or choose different approach for loading the initial reports
- [ ] Move adjustments to the DB
- [ ] Fix the RLS rules in supabase for security
- [ ] Delete related adjustments on report delete
- [ ] Disconnect a bank account
- [ ] Organizations
- [ ] Multi-tenancy
- [ ] Repeatable adjustments
- [ ] Multiplies adjustments
- [ ] Overlaid models
- [ ] Transaction categorization

## Get Started

### Stack

- Next.js
- Supabase
- Vanilla CSS Modules
- Vercel

### Environment variables

Add the following to you `.env.local` file.

```
PLAID_CLIENT_ID = PLAID_CLIENT_ID
# Sandbox
PLAID_SECRET = PLAID_SANDBOX_SECRET
PLAID_ENV = sandbox
# Development
# PLAID_SECRET = PLAID_DEVELOPMENT_SECRET
# PLAID_ENV = development
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Dependencies

`npm install`

### Run the app

`npm run dev`

## How it works

_01 — Plaid Authorization_
The user authenticates with Plaid

_02 — Generate Monthly History_
We pull in the balance and transactions for the last `3 months` from all of the accounts they authorize.

We itemize all of the transactions and then calculate what the balance would have been for those three months. There's a _gotcha_ here, in that, the account balance you get from plaid is the current available balance. So we also pull this months transactions so we can back off from that to get the previous month.

_03 — Generate Monthly Projections_
Now that there's a history, we take the work net gain/loss from the previous three months and use that as a worst case scenario for the following `n` Months. We substract from the last historical month's balance and show the cash flow trajectory for the bank account.

Monthly projections are always calculated on the fly and are recalculated whenever adjustments are added.

_04 — Create the Report_
If no report exists, we create one automatically. They can create as many as their subscription allows. We store these reports in `sessionsStorage` and the DB. The DB overwrites the sessions storage if there's an authenticated connection.

_05 - Add Adjustments_
The user can then add positive and negative adjustments (renveue and expenses). They add them to each individual month. The adjustments are also assigned a report id. When a report is selected, the adjustments are filtered based on that id, and the projections are recalculated.

Adjustments can also be disabled. Disabled adjsutments remain stored, but their amounts don't impact the monthly balance.

## Storing data & user accounts

- Burn can be used without logging in
- If the user isn't logged in, everything is saved to `sessionStorage`
- If they restart their browser, everything is erased
- Once the create an account, everything is stored in the DB
- They can create 4 reports a month
- Subscribing gives them unlimited reports
