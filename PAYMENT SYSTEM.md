ClassPoint Payment System – Full Description & Context
Overview

ClassPoint’s payment system is designed to support a clean, trustworthy, and scalable SaaS business model for Nigerian primary and secondary schools. The system must balance two very different financial realities:

ClassPoint is a SaaS company that must earn predictable subscription revenue, and

Schools must retain full ownership and control of their school fees, without ClassPoint acting as a middleman or escrow service.

This payment system is therefore not a fintech product, not a wallet, and not a school-fee aggregator. It is a billing and payment orchestration layer that enables subscriptions for ClassPoint and fee collection for schools — clearly separated, clearly understood, and legally safe.

Business Model Alignment
ClassPoint’s Revenue

ClassPoint earns money through school subscriptions, not through student or parent transactions.

Schools pay ClassPoint to use the platform.

Subscriptions are tied to the school entity, not individual users.

Billing cycles reflect how Nigerian schools think:

Termly billing is the default.

Monthly and annual billing are available.

Pricing scales gently with student count, but never blocks core operations abruptly.

This ensures:

Predictable revenue for ClassPoint.

Low friction for schools.

Clear accountability.

School Fees (Non-Negotiable Separation)

School fees belong to schools. Period.

Parents pay directly to the school’s bank account.

Each school connects its own Paystack account.

ClassPoint never:

Holds funds

Touches card details

Acts as a payment intermediary

Becomes liable for refunds or chargebacks

ClassPoint’s responsibility ends at:

Generating invoices

Redirecting parents to payment

Recording payment outcomes via webhooks

Displaying receipts and payment status

This separation is essential for:

Legal clarity

Trust with school owners

Reduced regulatory exposure

Simpler accounting

Platform Fee (Optional, Controlled, Transparent)

ClassPoint may optionally earn a platform fee from school fee transactions, but only under strict conditions:

Implemented using Paystack split payments, not manual deductions

Fully transparent to the school

Disabled by default

Configurable per school

Clearly shown during Paystack onboarding

This ensures:

No hidden charges

No operational risk

No fund custody issues

UX Philosophy

The payment experience must feel boringly simple.

For School Owners / Admins

They should always know:

What plan they’re on

What they’re paying ClassPoint

When the next renewal happens

How many students they currently have

Whether their Paystack integration is active

Payment-related settings must be:

Clearly labeled

Grouped logically

Accessible only to authorized roles

For Parents

Parents should never think:

“Am I paying ClassPoint or the school?”

The flow must be:

View invoice

Click “Pay Now”

Pay on Paystack

Receive confirmation

See receipt in ClassPoint

No extra steps. No jargon. No confusion.

For Teachers

Teachers should:

See payment status (paid / unpaid)

Never see pricing, plans, bank accounts, or fees logic

Never be involved in billing disputes

This preserves role clarity and avoids internal friction.

Technical Design Intent

The system must be built with:

Multi-tenancy as a first-class concept

Per-school configuration

Extensible provider architecture

Event-driven payment state updates

Strong audit trails

Key characteristics:

One ClassPoint subscription per school

One or more payment gateways per school (future-proof)

Idempotent webhook handling

Immutable payment records

Soft limits and warnings instead of hard blocks

What This System Is NOT

To avoid product drift and future pain, this system must explicitly not include:

Wallets or stored balances

Manual fund transfers

Internal school banking

Payroll processing

Student-to-student payments

Overly complex financial reporting

Anything that turns ClassPoint into a bank or fintech operator

If a feature makes ClassPoint touch money, it is out of scope.

Strategic Advantage

This payment design gives ClassPoint several long-term advantages:

Easier sales conversations with schools

Faster onboarding

Lower legal and compliance risk

Easier scaling across regions

Clear differentiation from bloated school ERPs

Cleaner financial reporting for ClassPoint itself

Most importantly, it reinforces trust — which is the single most important currency when selling software to schools.

Implementation Expectation

Any implementation based on this description and the accompanying prompt must result in:

A payment system that school owners understand in minutes

A billing system ClassPoint can manage confidently

A platform that scales without financial complexity

A product that feels professional, modern, and intentional

If a feature or design choice introduces confusion, opacity, or unnecessary financial responsibility, it should be rejected.



Payment System Prompt
You are a senior SaaS product architect and payment systems engineer designing the payment infrastructure for ClassPoint, a multi-tenant school management SaaS platform in Nigeria.

1️⃣ Product Context

ClassPoint is a subscription-based SaaS, not a payment aggregator.

ClassPoint serves primary and secondary schools in Nigeria.

Each school operates independently on its own subdomain (e.g. schoolname.classpoint.ng).

ClassPoint’s goal is simplicity, trust, and clarity, not feature overload.

Schools should never feel confused about who is paying whom.

2️⃣ Core Payment Philosophy (MANDATORY)

Follow these principles strictly:

ClassPoint earns money from schools, not from handling school fees.

School fees belong to the schools, not ClassPoint.

ClassPoint must never hold student fee funds (no escrow).

Payments must be transparent, auditable, and simple.

The system must work for non-technical Nigerian school admins.

3️⃣ Payment Models to Implement
A. ClassPoint Subscription (Primary Revenue)

Implement a school subscription system with:

Subscription Scope

Subscription is per school, not per student account.

Pricing model:

Base subscription tier

Optional per-student scaling (soft cap, not strict blocking)

Billing Cycle

Monthly

Termly (recommended default for Nigerian schools)

Annually (discounted)

Example Plans (editable)

Starter – small schools

Standard – most schools (default)

Enterprise – large schools / multi-branch

Each plan defines:

Max active students (soft limit with warnings)

Enabled modules (Attendance, Results, LMS, Finance, etc.)

Support level

B. School Fees Collection (IMPORTANT)

Implement school-owned payment gateways, not a central ClassPoint wallet.

Required Behavior

Each school connects its own Paystack account.

Payments made by parents go directly to the school’s bank account.

ClassPoint does NOT process or store card details.

ClassPoint’s Role

Generate fee invoices

Redirect parents to the school’s Paystack checkout

Record payment status via webhook

Display receipts inside ClassPoint

Platform Fee (Optional, Advanced)

Allow ClassPoint to configure a platform percentage fee (e.g. 1–3%)

Fee is deducted automatically by Paystack split, not manually

Feature must be optional per school

Default: OFF

4️⃣ Technical Requirements
Payment Providers

Primary: Paystack

Architecture must allow future providers (Flutterwave, Stripe)

Webhooks

Implement secure webhooks for:

Subscription payments

School fee payments

Failed / reversed payments

Data Models (High Level)

Design models for:

SchoolSubscription

SubscriptionPlan

PaymentTransaction

Invoice

PaymentGatewayConfig (per school)

WebhookEventLog (for auditing)

5️⃣ UX / UI Requirements (VERY IMPORTANT)
Admin (School Owner)

Clear “Billing & Subscription” page:

Current plan

Renewal date

Usage (students count)

Upgrade / downgrade buttons

Separate “School Fees Setup” page:

Connect Paystack

Test connection

Enable/disable online payments

View transaction history

Parent Experience

Simple invoice view

One “Pay Now” button

Redirect to Paystack

Automatic confirmation + receipt

Teacher Experience

Teachers see payment status only, never pricing or billing controls

6️⃣ Access Control & Safety

Only School Owner / Admin can:

Change subscription

Connect payment gateways

Teachers cannot see:

Subscription prices

Platform fees

Bank details

Parents cannot see:

Subscription info

Other parents’ payments

7️⃣ Non-Goals (DO NOT BUILD)

Explicitly avoid:

Wallet systems

Manual fund transfers

Holding school fees in ClassPoint accounts

Complex finance dashboards like ERP systems

Payroll processing (out of scope)

8️⃣ Deliverables Expected

Produce:

Payment system architecture diagram (conceptual)

Database schema (tables + key fields)

API endpoints (REST or GraphQL)

Webhook handling logic

Admin UX flow (step-by-step)

Error handling and edge cases

Security considerations

Clear assumptions

Design everything to be simple, scalable, Nigerian-friendly, and SaaS-correct.