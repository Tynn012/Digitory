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
3. Add your admin user after signing up in Supabase Auth:
	insert into admin_users (user_id) values ('<your-auth-user-id>');

## Payments
- Manual GCash is enabled by default.
- Switch to gateway mode later by setting VITE_PAYMENT_MODE=gateway.

## Email receipts + download links
This project sends download links through a Supabase Edge Function and an email provider.

1. Create a Resend account and verify your sender domain.
2. Set Supabase secrets:
	RESEND_API_KEY
	FROM_EMAIL
	SITE_URL (e.g. https://digitory.com)
	Note: SUPABASE_SERVICE_ROLE_KEY is provided automatically by Supabase for
	Edge Functions. Do not add it manually as a custom secret.
3. Deploy the functions:
	supabase functions deploy send-receipt
	supabase functions deploy get-download

## Build and preview
- Build for production: npm run build
- Preview the production build: npm run preview

## Deployment
1. Run npm run build and deploy the dist folder.
2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as environment variables on your host.
3. Configure a single-page app rewrite so all routes serve /index.html.
4. Set the production Site URL in Supabase Auth settings.
5. Verify admin login, checkout submission, and payment proof uploads on the live site.

## Notes
- Add your GCash QR image before launch.
- Update branding values from the admin dashboard to keep the hero content current.

## Documentation
- Student project report: `docs/PROJECT_DOCUMENTATION.md`
- Technical guide: `docs/TECHNICAL_DOCUMENTATION.md`
