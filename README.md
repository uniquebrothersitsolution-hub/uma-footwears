# UMA FOOTWEARS - Cloud Retail POS & Inventory Management System

A modern, high-performance Point-of-Sale (POS) and Inventory Management System tailored for retail footwear businesses. Built with React 18, Vite, TypeScript, Tailwind CSS, Supabase PostgreSQL, and ready for instant deployment on Vercel.

---

## ✨ Features

- **Billing POS**: Rapid barcode/search-based footwear checkout with auto-calculated discounts, size/color variations, and real-time inventory deduction.
- **Split Payment**: Support for Cash, UPI, Card, and Split (Cash + UPI) payments on a single invoice.
- **Thermal Receipt Printing**: Formatted 80mm thermal and A4/A5 receipt printing with store branding and tagline: *"where every steps matters"*.
- **Admin Inventory Control**: Live stock tracking, low-stock alerts, and wholesale cost margins.
- **Role-Based Security**: Separate PIN/password authentication for Staff and Admin with Row Level Security protecting wholesale pricing.
- **Sales Analytics & Excel Reports**: Automated calculation of Net Profit (Discounted Selling Price - Wholesale Cost) with day, month, and year-wise `.xlsx` ledger export.
- **Supabase Cloud Sync & Offline Resilience**: Instant multi-device synchronization via Supabase PostgreSQL with local cache fallback for zero-downtime offline billing.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional for Cloud Mode)
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Add your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*(If omitted, the app automatically runs in Local Storage offline mode).*

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🗄️ Database Setup (Supabase)

1. Create a free project at [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor**.
3. Copy and run the entire SQL script from [`supabase_schema.sql`](./supabase_schema.sql).

---

## 🌐 Deploy to Vercel

1. Import this repository into [Vercel](https://vercel.com/new).
2. Add the environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. Deploy!
