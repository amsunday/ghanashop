# 🚀 WhatsApp Storefront SaaS

A premium, high-converting, glassmorphic WhatsApp storefront and merchant dashboard built with **Next.js**, **Tailwind CSS**, and **Supabase**. Tailored for modern social commerce with instant WhatsApp checkout deep links, automated Mobile Money (MoMo) invoicing, live order tracking, and tenant-isolated feedback loops.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_GITHUB_USERNAME%2FYOUR_REPO_NAME&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

---

## ✨ Features

- **🛍️ Glassmorphic Customer Storefront**: Responsive, high-fidelity customer storefront with instant category filtering, interactive cart drawers, and strict delivery landmark validation.
- **💬 WhatsApp Deep Link Checkout**: No expensive APIs required. Orders are converted to formatted, markdown-compatible WhatsApp messages ready for instant customer-to-merchant direct communication.
- **📊 Realtime Merchant Dashboard**: Live order feeds, instant status toggles (Pending, Paid, Completed, Cancelled), and dynamic feedback streams.
- **💳 Mobile Money (MoMo) Invoice Generator**: Direct rendering of merchant MoMo details (MTN, Telecel, AT) with interactive customer copy-paste utilities.
- **🔒 Multi-Tenant Security**: Row-Level Security (RLS) policies on Supabase guarantee strict data isolation per shop owner.
- **⚡ Supercharged Tech Stack**: Next.js (App Router/Pages), Tailwind CSS, TypeScript, and Supabase.

---

## ⚡ Quick Start: Deploy to Vercel

Ready to deploy your storefront to production in under 5 minutes? Click the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_GITHUB_USERNAME%2FYOUR_REPO_NAME&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY)

### 📋 Prerequisites & Environment Variables

When deploying to Vercel, you will be prompted to configure the following environment variables:

| Environment Variable | Description |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project API URL (`https://your-project.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase Project Anonymous API Key |

---

## 🛠️ Step-by-Step Vercel Deployment Guide

### Option 1: Vercel Dashboard (Recommended)

1. **Push your code** to your own GitHub repository.
2. Go to the [Vercel Dashboard](https://vercel.com/) and click **Add New > Project**.
3. Import your GitHub repository.
4. Expand the **Environment Variables** section and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**. Vercel will automatically build and serve your app.

### Option 2: Vercel CLI (Command Line)

To deploy instantly from your command line:

```bash
# 1. Install the Vercel CLI globally (if not already installed)
npm install -g vercel

# 2. Login to your Vercel account
vercel login

# 3. Trigger the deployment wizard
vercel
```

Follow the prompts to link your project and add the environment variables when requested.

---

## 🗄️ Supabase Database Setup

Before your storefront goes live, run the migration script in your Supabase SQL editor:

1. Copy the contents of the database migration file:
   [20260528_init_whatsapp_storefront.sql](file:///c:/Users/Adams24/Documents/newshop/supabase/migrations/20260528_init_whatsapp_storefront.sql)
2. Go to your **Supabase Dashboard** -> **SQL Editor**.
3. Create a new query, paste the SQL, and click **Run**.
4. This will set up the `shops`, `categories`, `products`, `orders`, `order_items`, and `feedbacks` tables along with all necessary triggers and RLS policies.

---

## ⚙️ Local Development

To run the development server locally:

```bash
# 1. Clone your repository
git clone <your-repo-url>

# 2. Install dependencies
npm install

# 3. Configure local environment variables
cp .env.local.example .env.local
# Fill in your Supabase credentials in .env.local

# 4. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

---

## 📄 License

MIT
