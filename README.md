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
3. Add your admin email to VITE_ADMIN_EMAILS (comma-separated) for allowlisted access.
4. Enable MFA (TOTP) in Supabase Auth settings for admin sign-in.

## Payments
- Manual GCash is enabled by default.
- Switch to gateway mode later by setting VITE_PAYMENT_MODE=gateway.

## Email receipts + download links
This project sends receipt emails through a Vercel API route using SMTP.

1. Choose an SMTP provider (e.g. Gmail SMTP, Mailgun, SendGrid SMTP).
2. Set Vercel environment variables for the API route:
	SMTP_HOST
	SMTP_PORT
	SMTP_USER
	SMTP_PASS
	SMTP_SECURE (true/false)
	MAIL_FROM
	SITE_URL (e.g. https://digitory.com)
	SUPABASE_URL
	SUPABASE_SERVICE_ROLE_KEY
3. Set frontend environment variables for the app:
	VITE_SUPABASE_URL
	VITE_SUPABASE_ANON_KEY
	VITE_ADMIN_EMAILS (comma-separated allowlist)
4. Deploy to Vercel. The API route lives in /api/send-receipt.

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
