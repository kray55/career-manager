# Career Manager

Career Manager is a full-stack career workspace for organizing professional documents, contacts, job prospects, communications, research, visual assets, and related resources in one responsive application. The interface uses a polished glassmorphism design with grouped navigation for workspace, build, relationships, resources, and account workflows.

> **Repository:** [github.com/kray55/career-manager](https://github.com/kray55/career-manager)
>
> **Primary deployment:** [career-manager-iota.vercel.app](https://career-manager-iota.vercel.app)

## Contents

1. [Product capabilities](#product-capabilities)
2. [Technical specifications](#technical-specifications)
3. [Repository structure](#repository-structure)
4. [Local development](#local-development)
5. [Environment configuration](#environment-configuration)
6. [Database and Prisma](#database-and-prisma)
7. [User guide](#user-guide)
8. [Email Hub and attachments](#email-hub-and-attachments)
9. [Chat Pane and rooms](#chat-pane-and-rooms)
10. [Deployment guide](#deployment-guide)
11. [Security and operational guidance](#security-and-operational-guidance)
12. [Troubleshooting](#troubleshooting)
13. [Development workflow](#development-workflow)

## Product capabilities

| Workspace | Purpose |
|---|---|
| Dashboard | Central career command center with quick access to documents, resumes, contacts, email, resources, and account features. |
| Resume Manager | Create, edit, version, and organize resume documents and resume history. |
| CRM Contacts | Manage professional contacts through a relationship view and Kanban-style workflow. |
| Documents | Create editable documents, templates, long-form reports, publications, notes, and structured business materials. |
| Image Gallery | Store visual assets and insert them into documents without leaving the editor. Local image selection supports common web formats. |
| Email Hub | Send SMTP-backed messages, record communication history, and attach bounded local files. |
| Chat Pane | Real-time tenant chat with Private and Invite-only room support, backed by Socket.IO. |
| Store | Display configured products, open product details, manage a cart, and connect to configured checkout/payment services. |
| Affiliate Program | Create shareable affiliate links and track commission-related earnings. |
| Library and bookmarks | Organize useful career resources, research sources, and saved links. |

## Technical specifications

| Layer | Technology |
|---|---|
| Frontend | Next.js 12 Pages Router, React 18, TypeScript, Tailwind CSS 3 |
| UI | Responsive glassmorphism components, grouped top navigation, mobile-friendly layouts, Radix UI primitives, React Hot Toast |
| Rich documents | TipTap 3.28.0 extensions, long-form workspace components, templates, image insertion, and document metadata |
| Backend | Next.js API routes and server-side session handling |
| Authentication | NextAuth with Prisma adapter and tenant-aware user sessions |
| Database | PostgreSQL, Neon-compatible, accessed through Prisma 7 and `@prisma/adapter-pg` |
| Real-time communication | Socket.IO 4 server and client integration |
| Email | Nodemailer over authenticated SMTP |
| Payments | Stripe SDK and Stripe.js; payment behavior depends on configured products and keys |
| Object storage | S3-compatible storage and WebDAV-related integrations where configured |
| Monitoring | Sentry client, edge, and server configuration files |
| Hosting | Vercel Production deployment connected to the GitHub `master` branch |

The application uses tenant-aware records. User-facing APIs should obtain the tenant and user identity from the authenticated session rather than trusting arbitrary browser-supplied identifiers.

## Repository structure

```text
.
├── images/                  # Source-controlled design and project image assets
├── prisma/
│   ├── schema.prisma       # PostgreSQL data model
│   └── seed.ts              # Optional development seed data
├── public/                  # Public static assets
├── src/
│   ├── components/          # Client UI and workspace components
│   ├── lib/                 # Prisma, email, auth, and shared utilities
│   └── pages/
│       ├── api/             # Next.js API routes
│       └── *.tsx            # Pages Router screens
├── next.config.js
├── package.json
├── prisma.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

The root `images/` directory is intended for reviewed, source-controlled assets. Private user uploads should remain in the configured application storage or image gallery rather than being committed to Git.

## Local development

### Prerequisites

Install Node.js compatible with the project, npm, and a PostgreSQL database. A Neon development branch is recommended when working with the deployed data model. Never copy Production secrets into a shared development environment.

### Installation

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local` with development-only values, then generate the Prisma client and synchronize the local schema:

```bash
npm run db:generate
npm run db:push
```

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Generate Prisma client, synchronize the configured database schema, and build Next.js. |
| `npm run start` | Start the compiled production server. |
| `npm run lint` | Run the Next.js lint command. |
| `npm run db:generate` | Generate the Prisma client. |
| `npm run db:push` | Push the Prisma schema to the configured database. |
| `npm run db:migrate` | Create and apply a development Prisma migration. |
| `npm run db:seed` | Run the optional seed script. |
| `npm run db:studio` | Open Prisma Studio for the configured database. |

## Environment configuration

Use `.env.example` as the starting point. Variable names may evolve with enabled integrations; review the API routes and deployment settings before enabling a new feature.

| Variable group | Typical variables | Purpose |
|---|---|---|
| Database | `DATABASE_URL` | PostgreSQL connection string used by Prisma. |
| Authentication | `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, provider credentials where applicable | Session signing and callback configuration. |
| Setup | `SETUP_SECRET` | Protects the initial setup workflow. Use a strong unique value. |
| SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | Authenticated outbound email through the configured mail service. |
| Stripe | `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, webhook-related values | Store products, checkout, and payment workflows. |
| Storage | S3 or WebDAV variables used by the enabled storage routes | Image and document asset storage. |
| Monitoring | `SENTRY_DSN` and related Sentry settings | Error and performance monitoring. |

Do not commit `.env`, `.env.local`, credentials, SMTP passwords, database URLs, private signing keys, or payment secrets. Configure sensitive values in Vercel Project Settings under **Environment Variables** and select the correct environment, normally Production and Preview as appropriate.

## Database and Prisma

The database schema is defined in `prisma/schema.prisma`. It includes tenant-aware authentication records and career management models for documents, resumes, resume history, contacts, email logs, images, affiliate links, affiliate earnings, reports, chat messages, chat rooms, memberships, and room invitations.

The standard deployment build runs Prisma generation and schema synchronization before the Next.js build. Before adding or changing a model:

1. Update `prisma/schema.prisma` and its relations.
2. Run `npm run db:generate`.
3. Run `npm run db:push` against a safe development database.
4. Run TypeScript validation with `npx tsc --noEmit`.
5. Review tenant isolation and authorization in every affected API route.
6. Commit schema and application changes together when the deployment requires both.

Never run destructive database commands such as `prisma migrate reset` or `prisma db push --force-reset` against Production without an explicit backup and rollback plan.

## User guide

### First-time setup and login

Open the deployed application and use the setup page only when the deployment has been configured for initial setup. The setup secret is a server-side environment variable and should not be placed in source code. After setup, users sign in through the configured authentication flow. Administrators and standard users should use separate accounts with the least privileges needed for their work.

### Dashboard navigation

The top navigation groups features by intent. **Workspace** contains the dashboard and core work area. **Build** contains resumes, documents, templates, and the long-form report workspace. **Relationships** contains contacts, email, and chat. **Resources** contains bookmarks, the image gallery, store, and affiliate tools. **Account** contains profile and session controls.

On smaller screens, use the hamburger navigation rather than relying on desktop hover behavior. If a page does not appear in the visible navigation, use the dashboard shortcut cards or the route linked by the page itself.

### Resumes

Open Resume Manager to create a new resume or select an existing document. Use the editable document view to update contact details, professional summary, experience, achievements, and skills. Save deliberate milestones so that the resume history remains useful when tailoring applications for different roles.

### Contacts and CRM workflow

Create a contact with a name, email, organization, role, and relationship status. Use the Kanban view to move contacts through the configured stages, such as prospective, meeting, applied, and closed. Keep notes and follow-up information concise and avoid storing sensitive personal information that is not necessary for career management.

### Documents and long-form reports

Use the Templates page to start from a structured document type. For a research or business report, use the long-form workspace to define an outline, estimate page count, and organize sections such as an executive summary, background, SWOT analysis, findings, recommendations, resources, and appendices. Long documents may span approximately 50–100 pages; save regularly and use clear section headings.

The document editor supports visual context. Select **Add Image**, then choose an existing gallery asset or **Browse local files**. After selecting an image, insert it into the document and continue editing the surrounding text. Keep source files in the gallery or configured storage rather than committing private content to GitHub.

### Image Gallery

The Image Gallery is the central location for reusable visual assets. Upload an image, apply available client-side editing operations such as crop, rotation, or filters, then save the result to the gallery. In a document, use the same picker to insert the saved image without leaving the editor.

### Store and affiliate features

The Store displays products only after active products have been configured in the connected commerce/payment provider. When products exist, users can open product details, add items to the cart, and proceed to the configured checkout flow. The Affiliate Program allows a registered user to create a shareable affiliate link and review link activity and commission records. Actual earnings depend on the configured affiliate and payment workflow.

## Email Hub and attachments

The Email Hub sends outbound messages through the authenticated SMTP mailbox configured in Vercel. Each message is recorded in the communication history with its send result. A successful application response means that the SMTP transport accepted the message; the recipient’s inbox, spam filtering, quarantine, and mail-server policies still determine final visibility.

The attachment workflow supports a bounded set of local files. The deployed implementation limits messages to up to five attachments and 10 MB total, validates attachment metadata server-side, and uses the authenticated mailbox as the default sender identity.

For delivery troubleshooting:

1. Confirm `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, and `SMTP_PASS` are present in the Production environment.
2. Redeploy after changing Vercel environment variables.
3. Send a test message to a monitored address.
4. Check the Email Hub communication history.
5. Check Inbox, Spam/Junk, quarantine, and the recipient mail server logs.
6. Verify that the From address matches the authenticated SMTP mailbox or an allowed sender.

## Chat Pane and rooms

The Chat Pane provides real-time communication through Socket.IO. The current room release supports registered-user switching between **Private** and **Invite-only** rooms. Private rooms should be used for sensitive career, recruiter, mentor, or client conversations. Invite-only rooms are appropriate for a defined group meeting where access is granted through a room invitation.

Room invitations use an expiring token tied to a specific room. The intended guest workflow is to send the room link through the Email Hub, limit the guest to that room, and revoke or expire access when the meeting is complete. Public discoverable rooms are intentionally not the default because they require moderation, abuse reporting, rate limiting, retention policies, and stronger community safeguards.

When extending chat functionality, verify server-side session identity and room membership before accepting a Socket.IO connection. Do not rely solely on tenant, user, or room identifiers supplied by the browser.

## Deployment guide

The project is connected to Vercel and uses the GitHub `master` branch as the Production branch. A normal deployment is created by pushing a commit:

```bash
git add .
git commit -m "describe the change"
git push origin master
```

After pushing, open the Vercel project Deployment page and verify the new build. A successful deployment should reach **Ready** before functional testing begins. The active Production alias should never be deleted while cleaning up historical Error deployments.

For a Vercel configuration change:

1. Open the Career Manager project in Vercel.
2. Go to **Settings → Environment Variables**.
3. Add or update the variable in the correct environment.
4. Redeploy the relevant Production deployment.
5. Wait for **Ready**.
6. Test the affected live workflow.

Keep failed deployments for troubleshooting until their logs are no longer needed. If cleanup is required, delete only deployments explicitly marked **Error** or stale and verify that all **Ready** deployments and the current Production alias remain intact.

## Security and operational guidance

The application handles career documents, contact records, email addresses, uploaded images, and potentially sensitive communications. Use strong unique secrets, protect Production environment variables, enforce session-based authorization on APIs, validate uploads, limit email attachment size, and avoid exposing private storage URLs unnecessarily.

Operationally, keep development and Production databases separate, use least-privilege accounts, monitor Sentry and Vercel logs, and maintain a rollback path before schema changes. Do not place credentials or personal user data in README files, Git history, screenshots, or issue reports.

## Troubleshooting

| Symptom | Recommended action |
|---|---|
| `Can't reach database server` | Verify `DATABASE_URL`, the Neon branch status, allowed connections, and that the deployment environment contains the variable. |
| `The table public.Tenant does not exist` | Run the intended Prisma schema synchronization against the correct database, then redeploy. Confirm that the deployment is using the same database URL you initialized. |
| `SMTP not configured` | Add the required SMTP variables to the correct Vercel environment and redeploy. |
| Email is marked Sent but not visible | Check spam, quarantine, recipient rules, sender policy, and mail-server logs. Application acceptance is not the same as inbox placement. |
| Document image picker has no local control | Confirm the deployed build includes the latest document editor release and inspect the file input in the New Document workflow. |
| Store has no products | Configure active products in the connected commerce/payment provider before testing product modals, cart, or checkout. |
| Chat room access fails | Confirm the user is authenticated, belongs to the tenant, and has a valid membership or unexpired invitation for that room. |
| Vercel build fails during install | Review the build log for dependency conflicts, verify lockfile consistency, and run the same install/build checks locally. |

## Development workflow

Use small, focused commits and push only validated changes. Before pushing application or schema changes, run at least:

```bash
git diff --check
npx tsc --noEmit
DATABASE_URL='postgresql://user:pass@localhost:5432/career_manager' npx prisma generate
```

When a change affects Production data, email, payments, authentication, room access, or uploaded files, perform a live verification using a safe test account and test recipient. Record the result in the project task history rather than committing secrets or private data to the repository.

## License and project status

This repository is private application source code. Review team policy before redistributing code, screenshots, data, or design assets. The project is actively evolving; route names, integrations, and environment variables may change as additional Career Manager capabilities are completed.
