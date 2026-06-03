# BrandVox AI — Production-Grade SaaS AI Video Generation Platform

BrandVox AI is a premium SaaS AI video generation platform where users register, utilize multi-model generators (WAN 2.2 and Seedance Fast/Quality), manage creation libraries, purchase credit packages, and review site diagnostics on active admin channels.

---

## Technical Stack & Architecture

- **Frontend**: React + Vite + Tailwind CSS (v3) + React Router v6 + Lucide Icons + Recharts
- **Backend**: Node.js + Express + Helmet Security
- **Database**: PostgreSQL (via Supabase) with Row Level Security (RLS) policies
- **Payment Gateway**: Manual UPI Payment Workflow (INR, manual admin verification)
- **AI Engine**: fal.ai client subscription endpoints (WAN 2.2 and Seedance 2.0)
- **Package Manager**: Yarn

---

## Project Structure

```text
brandvox-ai/
├── client/                          # React frontend
│   ├── src/
│   │   ├── components/              # ui/ (Button, Modals, progress), layout/, shared/ (VideoCard, ModelCard)
│   │   ├── pages/                   # User views + Admin views
│   │   ├── hooks/                   # useAuth, useGeneration, useCredits, useModels
│   │   └── context/                 # AuthContext (Supabase Auth link)
├── server/                          # Express backend
│   ├── middleware/                  # jwt authorization & rate limiting
│   ├── routes/                      # auth, generations, credits, and admin routers
│   ├── services/                    # falService, creditService, notificationService
└── .env                             # Root environment variables
```

---

## Seeding Environment Configurations (`.env`)

Create a `.env` in the project root:

```ini
# Supabase Configurations
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# fal.ai Configurations (AI video models)
FAL_KEY=your_fal_ai_key

# Manual UPI Payment Configurations
UPI_ID=brandvox@upi

# Server Configurations
PORT=5000
CLIENT_URL=http://localhost:5173

# Frontend Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=http://localhost:5000/api
```

---

## 1. Database Setup Instructions (Supabase)

1. Open your project on the [Supabase Console](https://supabase.com).
2. Go to **SQL Editor** in the left sidebar.
3. Open a new query tab and copy the entire contents of [schema.sql](file:///C:/Users/LOQ/.gemini/antigravity/scratch/brandvox-ai/schema.sql) into the editor.
4. Execute the SQL command query. This will:
   - Create all tables (`profiles`, `generations`, `transactions`, `models`, `notifications`).
   - Enable Row-Level Security (RLS) on all profiles, securing user-specific lookups.
   - Seed default AI video models in INR (WAN 2.2 at ₹15/s, Seedance Fast at ₹45/s, Seedance Quality at ₹60/s).
   - Set up signup database triggers that automatically credit new profiles with ₹50.00 welcome grants and push logs.

---

## 2. Booting Client & Server locally

### Step 1: Install Dependencies
Open your shell terminal in the project root (`C:\Users\LOQ\.gemini\antigravity\scratch\brandvox-ai`) and run:
```bash
yarn install-all
```
This will install all required dependencies inside the `client/` and `server/` packages concurrently.

### Step 2: Initialize Root dev package
Install `concurrently` in the root folder so we can launch both frontend and backend synchronously:
```bash
yarn install
```

### Step 3: Run Platform in Dev Mode
Run the following script command inside the root folder to boot both the React Vite frontend and Node backend:
```bash
yarn dev
```

The services will initialize:
- **Express Server**: running on `http://localhost:5000`
- **React Client**: running on `http://localhost:5173`

---

## 3. Creating Admin Accounts

To access the administrative panel `/admin`, log in or sign up an account at `/auth`, and execute this SQL query inside the Supabase SQL editor:
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'your-admin-email@email.com';
```

---

## Dynamic Visual Watermark for Free Accounts

A premium diagonal semi-transparent visual overlay is automatically rendered on video players and details views for users who have only utilized free signup credits and never purchased standard UPI credits package cards, guaranteeing video protection on free balances while instantly unlocking upon payment.
