# Museum of Fine Arts Houston (MFAH) Web App and Database

---

## Installation

In the command terminal, run:

```bash
npm init -y
npm install dotenv mssql
```

Make sure this is removed from [`package.json`](package.json) (unless tests are added).    
```json
"test": "echo \"Error: no test specified\" && exit 1"
```

---

## Environment Configuration

Create a file named `.env` in the root directory and add your database credentials. Make sure `.env` is added to your `.gitignore` file.

```env
DB_USER     = your_database_username
DB_PASSWORD = your_database_password
DB_SERVER   = cloud_server_address.database.windows.net
DB_NAME     = your_database_name
```

**Important:** Double check to make sure you added `.env` to `.gitignore` so that your environment variables aren't committed to GitHub. 


---

## Run

To run a local instance, run the following in the terminal:

```bash
node server.js
```

## Site Map

```
Sitemap
│
├── Home
│
├── Account
│   ├── Login
│   ├── Register
│   └── My Account
│       ├── Profile
│       ├── Ticket History
│       ├── Gift Shop Order History
│       └── Membership
│           ├── Membership Status
│           ├── Membership Levels & Prices
│           └── Purchase / Renew Membership
│
├── Art & Collections
│   ├── Artwork
│   │   ├── Artwork Search
│   │   └── Artwork Details
│   │       ├── Artist(s)
│   │       ├── Collection
│   │       ├── Style
│   │       └── Period
│   │
│   ├── Artists
│   │   ├── Artist Search
│   │   └── Artist Details
│   │       └── Artist's Artwork
│   │
│   ├── Collections
│   │   ├── Collection Overview
│   │   └── Collection Details
│   │       └── Collection Artwork
│   │
│   ├── Styles
│   │   ├── Style Overview
│   │   └── Style Details
│   │       └── Related Artwork
│   │
│   └── Periods
│       ├── Period Overview
│       └── Period Details
│           └── Related Artwork
│
├── Exhibitions
│   ├── Current Exhibitions
│   ├── Upcoming Exhibitions
│   ├── Past Exhibitions
│   └── Exhibition Details
│       ├── Description
│       ├── Dates
│       ├── Artwork
│       ├── Curators
│       └── Gallery / Location
│
├── Events
│   ├── Event Calendar
│   ├── Event Details
│   │   ├── Description
│   │   ├── Date & Time
│   │   ├── Location
│   │   ├── Event Type
│   │   └── Capacity / Availability
│   └── Event Registration
│
├── Tickets
│   ├── Ticket Types
│   ├── Purchase Tickets
│   └── Ticket Confirmation
│
├── Membership
│   ├── Membership Levels & Prices
│   ├── Membership Benefits
│   └── Purchase Membership
│
├── Gift Shop
│   ├── Products
│   │   ├── Product Search
│   │   └── Product Details
│   ├── Shopping Cart
│   ├── Checkout
│   └── Order Confirmation
│
├── About
│   ├── Museum Story
│   ├── Buildings & Galleries
│   └── Contact
│
└── Staff Portal
    │
    ├── Login
    │
    ├── Curator
    │   ├── Dashboard
    │   ├── Artwork Management
    │   │   ├── View Artwork
    │   │   ├── Add Artwork
    │   │   ├── Edit Artwork
    │   │   └── Remove Artwork
    │   │
    │   ├── Artist Management
    │   │   ├── View Artists
    │   │   ├── Add Artist
    │   │   └── Edit Artist
    │   │
    │   ├── Collection Management
    │   │   ├── View Collections
    │   │   ├── Add Collection
    │   │   ├── Edit Collection
    │   │   └── Remove Collection
    │   │
    │   ├── Exhibition Management
    │   │   ├── View Exhibitions
    │   │   ├── Create Exhibition
    │   │   ├── Edit Exhibition
    │   │   ├── Manage Exhibition Artwork
    │   │   ├── Assign Curators
    │   │   ├── Assign Galleries
    │   │   └── Exhibition Statistics
    │   │
    │   └── Gallery / Location
    │       ├── Buildings
    │       ├── Floors
    │       └── Galleries
    │
    ├── Gift Shop Manager
    │   ├── Dashboard
    │   ├── Product Management
    │   │   ├── View Products
    │   │   ├── Add Product
    │   │   ├── Edit Product
    │   │   ├── Remove Product
    │   │   └── Update Pricing
    │   │
    │   ├── Inventory
    │   │   ├── Inventory Levels
    │   │   └── Update Inventory
    │   │
    │   ├── Sales
    │   │   ├── Record Sales
    │   │   ├── Sales History
    │   │   └── Sales Reports
    │   │
    │   └── Visitor Purchases
    │
    └── Museum Director
        ├── Dashboard
        │
        ├── Membership Management
        │   ├── View Memberships
        │   ├── Add Membership
        │   ├── Edit Membership
        │   └── Remove Membership
        │
        ├── Event Management
        │   ├── View Events
        │   ├── Create Event
        │   ├── Edit Event
        │   ├── Remove Event
        │   └── Event Registrations
        │
        ├── Personnel Management
        │   ├── View Personnel
        │   ├── Add Personnel
        │   ├── Edit Personnel
        │   ├── Remove Personnel
        │   ├── Positions
        │   └── Work Assignments
        │
        ├── Museum Operations
        │   ├── Buildings
        │   ├── Floors
        │   └── Galleries
        │
        ├── Reports
        │   ├── Ticket Sales
        │   ├── Membership Sales
        │   ├── Gift Shop Sales
        │   ├── Exhibition Statistics
        │   └── Financial Summary
        │
        └── Access Control
            ├── Staff Permissions
            └── Department Access
```