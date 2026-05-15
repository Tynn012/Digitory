# DIGITORY SYSTEM DOCUMENTATION

## Title
**Digitory: A Web-Based Digital Marketplace System**

Prepared by: **4th Year Computer Science Students**  
Course/Section: **BS Computer Science - 4th Year**  
Instructor: **[Instructor Name]**  
Date: **May 13, 2026**

## Abstract
Digitory is a web-based digital marketplace system designed to support the publication, management, purchase, and controlled distribution of downloadable digital products. The system provides a customer-facing storefront and an administrator-facing dashboard that manages products, orders, branding, and fulfillment actions. Core functions include product browsing, checkout submission, payment verification workflow, email receipt handling, and token-based download access.

The implementation prioritizes usability, responsive design, and modular architecture. The result is a maintainable platform that demonstrates how modern web technologies can be integrated into a coherent end-to-end system for digital commerce.

## 1. Introduction
Digital products require a different operational model than physical goods. Instead of shipping logistics, system priorities include secure access control, reliable payment handling, and immediate fulfillment after verification. Digitory was developed to address this model through a practical web platform that balances user experience and administrative control.

The system is intended to be understandable for non-technical users while still maintaining structure suitable for production-oriented development.

## 2. System Background
The growth of downloadable content has increased demand for lightweight marketplace systems that are fast to deploy and easy to maintain. Many available solutions are either too complex for small teams or too limited for real operational use.

Digitory addresses this gap by combining:
- A straightforward storefront for discovery and checkout
- A role-protected admin panel for operational tasks
- A backend service layer for data, authentication, and serverless workflows

## 3. Objectives
### General Objective
To implement a functional, reliable, and user-friendly digital marketplace system.

### Specific Objectives
- To provide responsive customer pages for product discovery and purchase.
- To implement secure role-based admin access.
- To support order lifecycle management from submission to fulfillment.
- To provide controlled download access using tokenized links.
- To ensure maintainability through modular frontend and backend integration.

## 4. Scope and Limitations
### Scope
- Public storefront with product catalog and product details
- Checkout flow with payment reference submission
- Admin dashboard for products, orders, and branding
- Email-based receipt and download link distribution
- Deployment-ready web architecture

### Limitations
- Automatic payment verification via gateway webhook is not yet enabled by default.
- Advanced customer account features (history, profile, self-service tickets) are not yet implemented.
- Full analytics and business intelligence modules are planned for future iterations.

## 5. System Features
- User-friendly and mobile-responsive interface
- Product catalog with category-based browsing
- Product detail pages with pricing and descriptions
- Checkout form with buyer details and payment reference
- Admin role-based access control
- Order status management and fulfillment controls
- Email receipt workflow linked to downloadable content
- Configurable branding module for interface customization

## 6. System Architecture Overview
Digitory follows a web application architecture with integrated managed backend services.

- Frontend layer: React + Vite application for UI and routing
- Service layer: Supabase client and application libraries
- Data layer: PostgreSQL tables for products, orders, branding, and admin users
- Serverless layer: Edge functions for email dispatch and download validation
- Hosting layer: Vercel for frontend delivery

This structure separates presentation, business logic, and data operations to simplify maintenance and future expansion.

## 7. Technology Stack
- HTML
- CSS
- JavaScript
- React
- Vite
- Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- Vercel (deployment and hosting)

## 8. Methodology
The system was developed using an iterative process:
1. Requirement identification and page-level planning
2. UI layout and responsive design implementation
3. Feature development and service integration
4. Validation through functional and layout testing
5. Refinement and documentation updates

This approach allowed continuous improvement while preserving a working baseline throughout development.

## 9. Validation Summary
- Functional validation for core user and admin flows
- Layout validation for desktop and mobile responsiveness
- Build validation for production packaging
- Integration validation for frontend-backend communication

Observed outcome: core marketplace flow operates as expected in current configuration.

## 10. Discussion
Digitory demonstrates that a small development team can produce a complete digital commerce workflow using modern managed services. The system balances simplicity and control by combining a clean customer interface with operational admin tooling.

Key strengths include modular code organization, clear route separation, and secure role-based operations. The current architecture also supports progressive enhancement, particularly for automated payment verification and analytics features.

## 11. Conclusion
Digitory successfully implements a web-based digital marketplace system with essential commerce and administrative capabilities. The platform supports end-to-end workflow from product publication to controlled digital fulfillment.

From a systems perspective, the implementation demonstrates effective integration of frontend application design, backend services, and cloud deployment into a coherent and maintainable solution.

## 12. Recommended Future Work
- Integrate gateway webhook events for automated payment confirmation
- Add expiring or signed download links for stronger security controls
- Add customer order lookup and download history
- Add operational dashboards and sales analytics
- Add broader automated testing coverage
