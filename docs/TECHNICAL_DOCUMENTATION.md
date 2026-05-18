# TECHNICAL DOCUMENTATION
## Digitory System Guide (Student-Friendly Version)

## 1. System Overview
Digitory is a digital marketplace web application where users can browse products, place an order, and receive downloadable files after payment verification. It has two major sides:
- Public website for customers
- Admin dashboard for product/order management

The system is designed to be simple for users and manageable for student developers.

## 2. Tech Stack and How It Works
### Frontend (User Interface)
- **React**: Builds the pages as reusable components.
- **Vite**: Fast development and build tool used to run and package the app.
- **CSS**: Custom styling for layout, responsiveness, and visual design.
- **React Router**: Handles page navigation (Home, Products, Checkout, Admin, etc.).

How it works:
- The browser loads the React app.
- React Router decides which page component to show based on the URL.
- Components call helper functions in `src/lib` to read/write data from Supabase.

### Backend Services
- **Supabase**: Provides backend tools without building a custom server from scratch.
  - Database (PostgreSQL)
  - Authentication (admin login)
  - Storage (proof uploads)
  - API access (for authenticated admin actions)

- **Vercel API Routes**: Serverless functions for email and download validation.

How it works:
- Frontend sends requests to Supabase tables/functions.
- Supabase enforces security rules (RLS policies).
- Data returns to frontend and updates UI.

### Hosting and Deployment
- **Vercel** hosts the frontend app.
- `vercel.json` handles SPA rewrites so refresh works on all routes.
- Supabase hosts database/auth separately.

Integration summary:
- Vercel serves the website.
- Website connects to Supabase using environment variables.
- Supabase stores data and handles secure server-side actions.

## 3. Core Modules and Responsibilities
### A. Public Pages
- Home: brand intro + featured products
- Products: product list/filter/search
- Product Detail: single product info
- Checkout: customer submits payment details
- Download page: receives token link and shows file access

### B. Admin Pages
- Admin Login: sign in through Supabase Auth
- Dashboard: quick stats
- Products: add/edit/delete products
- Orders: verify payment, unlock download, send receipt
- Branding: update website branding text/colors

### C. Shared Logic (`src/lib`)
- `supabaseClient.js`: creates Supabase client connection
- `supabaseClient.js`: Supabase client + admin allowlist helper
- `products.js`: product CRUD operations
- `orders.js`: order creation/update and download token flow
- `receipts.js`: calls Vercel API to send receipt email
- `paymentMode.js`: switch between manual and gateway mode

## 3.1 Suggested Project Structure (Simplified)
- `src/pages`: customer and admin pages
- `src/components`: reusable UI components
- `src/lib`: business logic and service connectors
- `src/data`: static seed/category data
- `supabase/schema.sql`: tables, policies, and seed setup
- `api`: serverless logic for email/download operations

Why this structure works:
- It separates UI, logic, and backend resources clearly.
- It makes maintenance easier for student teams.
- It allows future features to be added without major rewrites.

## 3.2 Request and Data Lifecycle
Example: Customer places an order
1. User submits checkout form in frontend.
2. Frontend validates fields and calls order creation logic.
3. Order data is written to Supabase `orders` table.
4. Admin opens dashboard and reviews order.
5. Admin marks order as paid and sends receipt.
6. Vercel API route sends email with tokenized download route.
7. Customer opens link and the API validates token state.

This flow ensures customer actions and admin verification stay organized.

## 4. Database Design (High-Level)
Main tables:
- `products`: digital items being sold
- `orders`: customer purchase records and status
- `branding`: editable brand content/colors

Security:
- Row Level Security (RLS) policies are enabled.
- Public users can browse products and create orders.
- Only authenticated admin users (allowlisted in the UI) can manage products, orders, and branding.

## 5. Email and Download Integration
Current flow (manual verification):
1. Customer places an order.
2. Admin reviews and marks order as paid.
3. System sends receipt email with download link.
4. Customer opens tokenized download route.

Vercel API routes involved:
- `/api/send-receipt`: sends receipt email through SMTP.
- `/api/get-download`: validates token and returns download info.

Required server environment variables:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_SECURE`
- `MAIL_FROM`
- `SITE_URL`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 6. Payment Mode Integration
The app supports a mode switch via environment variable:
- `VITE_PAYMENT_MODE=manual` (current)
- `VITE_PAYMENT_MODE=gateway` (for future automatic gateway flow)

This allows incremental development: use manual process now, integrate real payment gateway later.

## 7. Environment and Configuration
Frontend env values:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_PAYMENT_MODE`
- `VITE_ADMIN_EMAILS`

Where to place them:
- In local `.env`
- In Vercel project environment settings

## 7.1 Deployment Workflow (Practical)
1. Develop and test locally.
2. Build frontend for production.
3. Push code to repository.
4. Deploy frontend in Vercel.
5. Apply/verify Supabase schema.
6. Configure environment variables and secrets in Vercel.
7. Run live smoke tests (checkout -> admin verify -> email -> download).

## 7.2 Hosting Responsibilities
- Vercel: serves static frontend and route rewrites.
- Supabase: stores data and handles auth.
- Vercel: runs server-side API routes that send emails via SMTP.

This separation keeps secrets out of frontend code and improves security.

## 8. Definitions of Technical Terms
- **Frontend**: The part users see and interact with in the browser.
- **Backend**: The server-side part handling data and business logic.
- **API**: A bridge that lets software systems communicate.
- **Database**: Structured storage for app data.
- **PostgreSQL**: The database engine used by Supabase.
- **Authentication**: Login process that verifies user identity.
- **RLS (Row Level Security)**: Rules that control which rows a user can access.
- **Serverless Function**: Lightweight server-side function run on demand (Vercel API routes).
- **Token**: Unique string used to verify access (ex: download link).
- **SPA (Single Page Application)**: Website that updates pages without full reloads.
- **Deployment**: Process of publishing the app online.
- **Environment Variable**: Config value stored outside source code.

## 9. How the Full Integration Works End-to-End
1. User opens website hosted on Vercel.
2. React app loads and calls Supabase.
3. Product data comes from Supabase database.
4. User submits checkout details.
5. Admin verifies payment in dashboard.
6. Vercel API sends email with download link.
7. Download token is validated before file access is shown.

This setup separates concerns clearly:
- Frontend handles user experience.
- Supabase handles secure data/services.
- Vercel handles fast web hosting.

## 10. Future Improvements
- Full payment gateway webhook for automatic verification
- Expiring/signed download links for stronger security
- Customer order tracking by email
- Activity logs and analytics dashboard
- More robust QA test scripts and automated checks

## 11. Basic Troubleshooting Guide
- Problem: Admin cannot access dashboard.
  - Confirm the admin email is in VITE_ADMIN_EMAILS.
  - Ensure Supabase Auth MFA (TOTP) is enabled.

- Problem: Email not sending.
  - Confirm SMTP credentials and `SITE_URL` are set.
  - Check the SMTP provider for delivery errors.

- Problem: Download link fails.
  - Verify `download_token` exists for the order.
  - Confirm order is unlocked/paid and `download_url` is set.

- Problem: Refresh causes 404 on deployed site.
  - Confirm SPA rewrite config is present in `vercel.json`.

## 12. Team Collaboration Practices Used
- Feature-by-feature development with review.
- Regular testing after each major update.
- Documentation updates alongside implementation changes.
- Deployment checks before final validation.

## 13. Student Reflection Angle (Optional for Report)
This project helped students practice real-world software development: planning features, managing versions, solving integration issues, designing for mobile users, and deploying a complete product online.
