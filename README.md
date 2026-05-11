# Digitory

Digitory is a premium digital marketplace and admin dashboard for selling templates, planners, and downloadable productivity assets.

## Features
- Modern public storefront with featured products and categories
- Product detail pages with gallery previews and instant download messaging
- Checkout flow with GCash instructions and proof upload
- Supabase-backed admin dashboard for products, orders, and branding
- Mobile-friendly layout with bright, minimal styling

## Tech stack
- React + Vite
- React Router
- Supabase (database, auth, storage)

## Getting started
1. Install dependencies:
	npm install
2. Create a .env file using .env.example and add your Supabase credentials.
3. Run the dev server:
	npm run dev

## Supabase setup
1. Run the SQL in supabase/schema.sql to create tables and policies.
2. Create a public storage bucket named order-proofs if you want to store payment proof uploads.

## Build and preview
- Build for production: npm run build
- Preview the production build: npm run preview

## Notes
- Replace the placeholder GCash QR image with your real QR asset before launch.
- Update branding values from the admin dashboard to keep the hero content current.
