VendorBridge

A modern procurement and vendor management platform designed to simplify purchasing operations, improve supplier collaboration, and provide complete visibility across the procurement lifecycle.

---

Overview

VendorBridge is a web-based procurement management solution that helps organizations manage vendors, purchase requests, inventory, purchase orders, and payments through a centralized system.

Traditional procurement processes often rely on spreadsheets, emails, and manual approvals, leading to delays, poor visibility, and data inconsistencies. VendorBridge addresses these challenges by providing a structured workflow that enables procurement teams to manage suppliers, track purchases, monitor inventory, and analyze procurement performance from a single platform.

The platform was developed as part of the Odoo Hackathon with a focus on scalability, maintainability, strong database design, and real-world business requirements.

---

Problem Statement

Organizations frequently face challenges such as:

- Manual vendor management
- Lack of procurement transparency
- Delayed purchase approvals
- Poor inventory visibility
- Inefficient supplier communication
- Difficulty tracking procurement performance

These issues often result in increased operational costs and reduced procurement efficiency.

---

Solution

VendorBridge provides a centralized procurement ecosystem that enables businesses to:

- Manage vendor information and performance
- Create and track purchase requests
- Process purchase orders efficiently
- Monitor inventory levels in real time
- Track invoices and payments
- Generate procurement insights and reports

The platform streamlines procurement workflows while maintaining data integrity and accountability across departments.

---

Core Modules

User & Role Management

- Secure authentication and authorization
- Role-based access control
- Department-wise user management

Vendor Management

- Vendor onboarding
- Supplier database management
- Vendor performance tracking
- Vendor categorization

Procurement Management

- Purchase requisition workflow
- Approval management
- Purchase order generation
- Procurement tracking

Inventory Management

- Product catalog management
- Stock monitoring
- Inventory updates
- Low-stock alerts

Payment Management

- Invoice tracking
- Payment status management
- Financial transaction records

Analytics & Reporting

- Procurement insights
- Vendor performance analysis
- Inventory reports
- Business dashboards

---

Technology Stack

Frontend

- React.js
- React Router
- Axios
- Bootstrap / Tailwind CSS

Backend

- Node.js
- Express.js
- REST API Architecture
- JWT Authentication

Database

- MySQL

Development Tools

- Git & GitHub
- Postman
- Visual Studio Code

---

System Architecture

Client Application (React.js)

↓

REST API Layer

↓

Node.js + Express.js Backend

↓

MySQL Database

---

Key Highlights

- Modular architecture
- Scalable database design
- Secure authentication system
- Real-time procurement tracking
- Responsive user interface
- Industry-oriented workflow implementation

---

Installation

Clone Repository

git clone https://github.com/your-username/VendorBridge.git
cd VendorBridge

Install Dependencies

npm install

Configure Environment Variables

Create a ".env" file:

PORT=5000

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=vendorbridge

JWT_SECRET=your_secret_key

Start Backend

npm run server

Start Frontend

npm run client

Run Complete Application

npm run dev

---

Future Scope

- AI-based vendor recommendations
- Automated approval workflows
- Email notification system
- Multi-warehouse support
- Advanced procurement analytics
- Mobile application support

---

Team

Developed for the Odoo Hackathon as a practical procurement and vendor management solution focused on solving real-world business challenges.

---

License

This project is licensed under the MIT License.
