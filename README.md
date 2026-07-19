# OperatorOS

OperatorOS is a workspace operator management and booking SaaS built for the **Stylework AI Product Builder assignment**.

It connects three sides of the workspace ecosystem:

- **Customers** discover workspaces, check availability, and book in real time.
- **Operator Admins** manage assigned locations, products, inventory, and booking fulfilment.
- **Super Admins** onboard operators, review and publish supply, and oversee platform activity and financials.

## Product Links

[Live Product](https://operator-os-stylework.vercel.app/) ·
[5-Minute Product Demo](https://www.loom.com/share/c0492ad6ef144da8913b4ec8bb9b7d5b) ·
[OperatorOS - Product Case Study and Product Requirements Document.docx](https://github.com/user-attachments/files/30170068/OperatorOS.-.Product.Case.Study.and.Product.Requirements.Document.docx)


---

## Problem Statement

> Space operators run their inventory, invoicing, and bookings through Excel sheets and disconnected workflows. The goal is to give them software that makes running and growing their business effortless while providing customers with real-time information.

The challenge is larger than replacing spreadsheets.

Workspace supply, pricing, availability, customer bookings, and fulfilment need to operate through one shared system connecting Stylework, workspace operators, and customers.

OperatorOS was designed to provide that operating layer.

---

## Product Overview

OperatorOS supports the complete workspace lifecycle:

```text
Stylework creates an operator
        ↓
Operator receives secure access
        ↓
Operator configures its location and inventory
        ↓
Operator submits the location for review
        ↓
Stylework approves and publishes the location
        ↓
Customer discovers and books the workspace
        ↓
Operator fulfils the confirmed booking
        ↓
Stylework monitors bookings and financials
```

---

## Core Users

### Super Admin

Super Admins represent the Stylework platform team.

They can:

- Create operator organisations
- Provision Operator Admin credentials
- Assign initial workspace locations
- Monitor location setup progress
- Review submitted locations
- Approve, publish, or request changes
- View operators, customers, and bookings
- Monitor platform fees, operator earnings, and refunds

### Operator Admin

Operator Admins manage only their assigned organisation and locations.

They can:

- Complete workspace profiles
- Add amenities, operating hours, and policies
- Upload location images
- Create workspace products
- Configure pricing, capacity, and availability
- Manage individual inventory units
- Preview customer-facing listings
- Submit locations for review
- View and fulfil customer bookings
- Check in customers
- Complete, cancel, or mark bookings as no-shows

### Customer

Customers can:

- Create an account
- Browse published workspace locations
- Search by city
- Filter by workspace category
- View location details and amenities
- Check current availability
- Review server-calculated pricing
- Complete simulated checkout
- Receive instant booking confirmation
- Access booking history and notifications
- Cancel eligible bookings

---

## Workspace Categories

OperatorOS supports four workspace product models.

| Category | Customer Selects | Inventory Model | Pricing Model |
|---|---|---|---|
| Day Pass | Date and quantity | Shared daily capacity | Per person per day |
| Meeting Room | Date and time range | Complete room | Per hour |
| Dedicated Desk | Start date, tenure, and desk | Individual desk units | Per month |
| Private Cabin | Team size, start date, and tenure | Complete cabin | Per month |

Each category uses its own availability and booking flow instead of relying on one generic booking form.

---

## Key Features

### Operator Provisioning

- Guided operator company creation
- Primary administrator provisioning
- Unique Operator ID generation
- Temporary password onboarding
- Initial location assignment
- Role-based access control

### Location Management

- Location overview and address
- Amenities and facilities
- Operating hours
- House rules
- Cancellation policies
- Location image management
- Completion readiness tracking
- Customer-facing preview

### Product and Inventory Management

- Day Pass products
- Meeting Rooms
- Dedicated Desks
- Private Cabins
- Pricing and capacity configuration
- Individual inventory unit management
- Product activation and deactivation
- Availability schedules

### Review and Publishing

- Operator submission workflow
- Super Admin review queue
- Listing completeness checks
- Approve and publish
- Request changes
- Marketplace visibility controls

### Customer Marketplace

- Public workspace discovery
- City search
- Category filtering
- Published location pages
- Workspace images and amenities
- Product-specific booking inputs
- Availability checking
- Customer account menu and logout

### Booking Engine

- Server-side request validation
- Database-calculated pricing
- Ten-minute temporary booking holds
- Active-hold availability protection
- Atomic final confirmation
- Booking status history
- Simulated successful and failed payments
- Cancellation and refund simulation

### Operator Fulfilment

- Booking directory
- Customer and booking details
- Check-in
- Completion
- No-show recording
- Operator cancellation
- Earnings visibility
- Booking status timelines

### Platform Oversight

- Operator directory
- Location directory
- Customer directory
- Booking oversight
- Payment status breakdown
- Operator earnings
- Platform fee calculations
- Refund visibility

---

## Product Decisions

### Category-Specific Booking Models

A Day Pass, Meeting Room, Dedicated Desk, and Private Cabin do not share the same availability or inventory requirements.

OperatorOS therefore uses one product system with category-specific configuration and booking behaviour.

### Temporary Booking Holds

When a customer proceeds to checkout, OperatorOS creates a temporary ten-minute hold.

This protects the selected inventory while the customer completes the simulated payment flow.

### Server-Controlled Pricing

The browser does not determine the trusted booking price.

Pricing is calculated and validated by the server before the booking is confirmed.

### Marketplace Quality Control

Operators manage their workspace supply, but they cannot publish locations directly.

Stylework reviews and approves each submitted location before it becomes visible to customers.

### AI After Reliable Operational Data

The MVP deliberately prioritises inventory accuracy, booking reliability, and operational workflows before introducing AI.

Once dependable data exists, future opportunities include demand forecasting, pricing recommendations, utilisation insights, and automated operator alerts.

---

## MVP Status

### Phase 1 — Foundation

- Supabase authentication
- Strict user roles
- Super Admin bootstrap
- Operator provisioning
- Operator ID login
- Initial location assignment
- Role-specific dashboards

### Phase 2 — Operator Management

- Location profiles
- Amenities and operating hours
- Policies and media
- Workspace products
- Inventory units
- Availability schedules
- Completion tracking
- Review, approval, and publishing

### Phase 3 — Marketplace and Booking

- Public workspace marketplace
- Customer signup and login
- Live availability
- Atomic ten-minute holds
- Server-side pricing
- Simulated payments
- Booking confirmation
- Customer booking history
- Notifications
- Operator fulfilment
- Cancellation and refund simulation
- Super Admin booking and financial oversight

The complete MVP is deployed on Vercel and connected to Supabase.

---

## Technology Stack

### Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- shadcn/ui with Base UI
- React Hook Form
- Zod
- Lucide React

### Backend and Infrastructure

- Next.js Route Handlers
- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- PostgreSQL functions
- Row-Level Security
- Vercel

---

## High-Level Architecture

```text
Next.js App Router
        │
        ├── Public Marketplace
        ├── Customer Experience
        ├── Operator Portal
        └── Super Admin Portal
                │
                ▼
Next.js Server Components and Route Handlers
                │
                ▼
Supabase
├── Authentication
├── PostgreSQL
├── Storage
├── Row-Level Security
└── Booking Functions
```

---

## Booking Reliability

The booking flow is designed to reduce inventory conflicts.

```text
Customer enters booking requirements
        ↓
Server validates product and availability
        ↓
Server calculates pricing
        ↓
Temporary hold is created
        ↓
Customer completes simulated payment
        ↓
Availability is checked again
        ↓
Booking is atomically confirmed
```

The final confirmation uses database-level protection to reduce the risk of two customers confirming the same inventory.

---

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/the-PrafulDesai/OperatorOS.git
cd OperatorOS
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file using the environment variables documented in the phase setup guides.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000

SUPER_ADMIN_NAME=
SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=

DEMO_CUSTOMER_NAME=
DEMO_CUSTOMER_EMAIL=
DEMO_CUSTOMER_PASSWORD=
DEMO_CUSTOMER_PHONE=
```

Never expose `SUPABASE_SECRET_KEY` through a `NEXT_PUBLIC_` variable.

### 4. Apply Database Migrations

Apply the SQL migrations in timestamp order from:

```text
supabase/migrations/
```

Follow the setup documentation:

- [Phase 1 Setup](docs/PHASE_1_SETUP.md)
- [Phase 2 Setup](docs/PHASE_2_SETUP.md)
- [Phase 3 Setup](docs/PHASE_3_SETUP.md)

### 5. Bootstrap Demo Users

```bash
npm run bootstrap:superadmin
npm run bootstrap:demo-customer
```

### 6. Start the Application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Validation

Run the following before deployment:

```bash
npm run lint
npm run build
```

The project should complete both commands without errors.

---

## Deployment

OperatorOS is deployed using:

- **Vercel** for the Next.js application
- **Supabase** for authentication, PostgreSQL, and storage

Deployment instructions are available in the [Deployment Guide](docs/DEPLOYMENT.md).

The current production application is available at:

[https://operator-os-stylework.vercel.app/](https://operator-os-stylework.vercel.app/)

---

## Demo Walkthrough

The complete product journey is covered in the five-minute demo:

[Watch the OperatorOS Product Demo](https://www.loom.com/share/c0492ad6ef144da8913b4ec8bb9b7d5b)

The repository also includes a written walkthrough:

[Demo Walkthrough](docs/DEMO_WALKTHROUGH.md)

---

## Documentation

- [Product Case Study and PRD](docs/OperatorOS_Product_Case_Study_and_PRD.pdf)
- [Phase 1 Setup](docs/PHASE_1_SETUP.md)
- [Phase 2 Setup](docs/PHASE_2_SETUP.md)
- [Phase 3 Setup](docs/PHASE_3_SETUP.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Five-Minute Demo Walkthrough](docs/DEMO_WALKTHROUGH.md)

---

## MVP Limitations

The current version intentionally uses:

- Simulated payments and refunds
- Demo tax and operator commission calculations
- In-app notifications instead of external email or WhatsApp delivery
- Manual Stylework review and publishing
- Static operator commercial assumptions
- No production invoicing or settlement integration

The displayed 18% tax and operator commission breakdown are prototype calculations and should not be treated as final tax, accounting, or commercial agreement logic.

---

## Future Roadmap

### Pilot Readiness

- Real payment gateway integration
- Email and WhatsApp notifications
- Operator settlement workflows
- Configurable cancellation policies
- Availability exceptions and holidays
- Invoices and receipts
- Pilot analytics

### Marketplace Growth

- Corporate booking accounts
- Operator performance benchmarks
- Utilisation analytics
- Accounting integrations
- Multi-location operator management
- Reviews and ratings
- Map-based discovery

### Intelligence Layer

- Demand forecasting
- Pricing recommendations
- Inventory optimisation
- Automated operator alerts
- Booking risk detection
- Workspace recommendations

---

## Author

**Praful Desai**

Technical Product Manager | Product Builder | Team Lead

[LinkedIn](https://www.linkedin.com/in/the-praful-desai/) ·
[GitHub](https://github.com/the-PrafulDesai)

---

## Disclaimer

OperatorOS was created as a functional MVP for the Stylework AI Product Builder assignment.

Payments, refunds, tax calculations, and operator commission calculations are simulated for demonstration purposes and are not intended for production financial use.
