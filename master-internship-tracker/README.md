# Master Internship Tracker

## Product Requirements Document (PRD)

### Company Categorization Matrix

| Tier | Definition | Target Companies | Display Priority |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Big Tech & Global Top MNCs | Google, Microsoft, Amazon, Meta, Apple | High visibility, global/PAN-India focus. |
| **Tier 2** | Mid-Level MNCs & Unicorns | Oracle, Cisco, Adobe, Razorpay, Cred | Standard listing, filterable by role. |
| **Tier 3** | State/Regional Tech (Maharashtra) | IT parks in Pune, Mumbai, and Nashik | Geofenced. Highlights local commute and hybrid options. |

### Core Features
- **Direct Application Links**: The database must scrape the absolute URL of the final career portal, not just the aggregator link, to skip intermediaries.
- **The HR Network Portal**: A dedicated section that parses the job posting for recruiter names or email addresses, linking directly to their LinkedIn profiles or Naukri contact pages.
- **24/7 Ghost Automation**: The system requires no manual data entry. Cloud functions trigger the scrapers to update Supabase continuously.

## System Architecture & Workflow

### 1. The Database Layer (Supabase)
Two primary tables:
- `internships` (tier, company, role, direct_link, location, posted_time)
- `hr_contacts` (foreign key to internship, HR name, LinkedIn URL)

### 2. The 24/7 Scraper (Python Backend Engine)
Python scripts utilizing `beautifulsoup4`, `selenium`, and `supabase-py` running on GitHub Actions cron jobs (`*/5 * * * *`) for automated updating and pruning.

### 3. The Visual Layer (Google Stitch & React)
Frontend dashboard built matching the Stitch UI design, filtering by tiers and featuring job cards with HR connection links.
