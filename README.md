# Acadera Platform

A comprehensive school management system featuring multi-tenant architecture, integrated student/parent/teacher portals, and an automated fee collection system.

## 💳 Paystack Aggregator Configuration (Automated 1.5% Commission)

This platform uses an **Aggregator Payment Model** with Paystack. This means all school fee payments are securely routed through a single Master Developer Account, which automatically extracts a 1.5% commission before routing the remaining funds to the respective school's Mobile Money or Bank account.

### Security Architecture
For maximum security, actual bank accounts and Momo numbers are **never** stored in the application database or dashboard UI. They are handled completely securely by Paystack's servers. The Acadera code only handles the routing keys.

---

### Step 1: Master Account Setup (Developer/Super Admin)
1. Go to [Paystack.com](https://paystack.com) and log into your Master Account.
2. Navigate to **Settings** -> **Payouts**.
3. Add your Bank Account or Mobile Money (Momo) number.
   *(This tells Paystack: "Whenever my master account earns commission money, pay it out to this bank/Momo account.")*
4. Go to **Settings** -> **API Keys & Webhooks** and copy your **Public Key** (`pk_live_...` or `pk_test_...`).
5. In your project codebase, open the `.env` file and paste your key:
   ```env
   VITE_PAYSTACK_PUBLIC_KEY=your_actual_paystack_public_key_here
   ```

### Step 2: School Account Setup (Done for each new school)
1. Still on your Paystack Dashboard, go to the **Subaccounts** tab.
2. Click **New Subaccount**.
3. Enter the specific **School's Bank Account or Momo number**.
4. Set the percentage split so your Master Account receives the correct commission (e.g., 1.5%).
5. Paystack will generate a unique Subaccount Code for that school (e.g., `ACCT_xxxxxxx`).

### Step 3: Dashboard Integration
1. Log into the Acadera **Super Admin Dashboard**.
2. Locate the specific school in the grid.
3. In the **System Config** section of that school's card, paste the `ACCT_xxxxxxx` code into the **Paystack SubAcct** field.
4. The system will automatically save it.

---

### How Payments Flow In Real-Time
When a parent pays **GH₵ 100** via the Parent Portal:
1. Paystack sees the transaction originating from your `.env` Master API Key.
2. Paystack reads the `ACCT_xxxxxxx` code attached to the payment request from the database.
3. Paystack automatically sends **GH₵ 98.5** directly to the School's registered Momo account.
4. Paystack automatically leaves your 1.5% (**GH₵ 1.5**) in your Master Account.
5. Paystack then pays out that 1.5% directly to the Bank/Momo account you registered in Step 1.

---

## Technical Stack
- **Frontend**: React + TypeScript + Vite
- **Styling**: Vanilla CSS, Lucide Icons
- **Backend/Database**: Supabase
- **Payments**: Paystack

## Running Locally

```bash
# Install dependencies
npm install

# Copy environment template and fill in values
cp .env.example .env

# Start development server
npm run dev
```

---

## Deployment

### Web (Vercel — recommended)

1. Connect the GitHub repo to [Vercel](https://vercel.com).
2. Set **Environment Variables** (Production + Preview):
   - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
   - `VITE_PAYSTACK_PUBLIC_KEY` (master `pk_test_` / `pk_live_`)
   - Optional: `VITE_GEMINI_API_KEY`, `VITE_GROQ_API_KEY`, `VITE_HUGGINGFACE_API_KEY`, `VITE_VAPID_PUBLIC_KEY`
3. Build command: `npm run build` — output: `dist`
4. SPA routing is handled by `vercel.json` (all routes → `index.html`).

### Supabase

1. Link project: `npx supabase link --project-ref <ref>`
2. Apply migrations: `npx supabase db push`
3. Deploy edge functions: `npx supabase functions deploy`
4. Set **Edge Function secrets** (Dashboard → Edge Functions → Secrets):
   - `PAYSTACK_SECRET_KEY`
   - `ARKESEL_API_KEY` (SMS)
   - `VAPID_PRIVATE_KEY` (push)
   - `ALLOW_PAYMENT_SANDBOX=true` — **development only** (enables `sandbox_*` payment refs)

### Desktop & mobile (CI)

- Tag releases (`v*`) trigger `.github/workflows/build.yml` (Electron Mac/Win + Android debug APK).
- PRs and pushes to `main` run `.github/workflows/ci.yml` (lint + web build).

---

## Security notes

- **Never** put `SUPABASE_SERVICE_ROLE_KEY` in `.env` for the Vite app — use Edge Function secrets only.
- Rotate any API keys that were ever committed to git (check `.env.example` history).
- School **Paystack subaccount** codes (`ACCT_...`) are stored per school in Admin → Settings; the master `pk_*` key stays in platform env.
