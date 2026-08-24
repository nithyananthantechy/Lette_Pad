# 🏛️ AI Letter Pad Platform
## தமிழ்நாடு அரசியல் & அரசு அலுவலர் மடல் தளம்

An AI-powered letter pad / letterhead generation platform for Tamil Nadu political parties and government officials.

---

## 🚀 Features

- **AI Letter Drafting** — Generate formal letters in Tamil & English using Google Gemini AI
- **Live Letterhead Preview** — Real-time preview of your branded letterhead
- **QR Code Verification** — Every letter gets a unique QR code and Document ID
- **Audit Trail** — Every action is logged with IP, timestamp, and user (7-year retention)
- **Email OTP MFA** — Secure two-step login via email OTP
- **Tamil-first UI** — Full Tamil UI with English toggle
- **PDF Export** — Professional A4 PDF with letterhead, content, and QR code
- **Letter Revocation** — Instantly revoke any letter; QR verification will show "Revoked"
- **10 Pre-loaded Parties** — DMK, AIADMK, TVK, PMK, VCK, NTK, DMDK, MDMK, BJP, INC demo data

---

## 📁 Project Structure

```
letter_pad_project/
├── backend/              # Node.js + Express API
│   ├── server.js
│   ├── config/db.js      # PostgreSQL
│   ├── routes/           # auth, parties, profiles, letters, audit, verify
│   ├── services/         # AI (Gemini), PDF, QR, OTP, Audit
│   ├── middleware/        # JWT auth, RBAC
│   └── .env.example
├── frontend/             # React + Vite + Tailwind
│   └── src/
│       ├── pages/        # Landing, Login, Register, Dashboard, LetterDesigner, Profiles, Letters, AuditLog, Verify
│       ├── components/   # Navbar
│       ├── i18n/         # Tamil (ta) + English (en) translations
│       ├── context/      # Auth context
│       └── lib/          # Axios API client
└── database/
    └── schema.sql        # Full PostgreSQL schema + demo data
```

---

## ⚡ Quick Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Database Setup

```sql
-- Create database
CREATE DATABASE letterpad_db;

-- Run schema
psql -U postgres -d letterpad_db -f database/schema.sql
```

### 2. Backend Setup

```bash
cd backend

# Copy environment file
cp .env.example .env

# Edit .env with your values:
# - DB_PASSWORD=your_postgres_password
# - GEMINI_API_KEY=your_gemini_api_key
# - EMAIL_USER=your@gmail.com
# - EMAIL_PASS=your_gmail_app_password
# - JWT_SECRET=random_32_char_string

npm install
npm run dev
```

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Visit: **http://localhost:3000**

---

## 🔐 Security Features

| Feature | Implementation |
|---|---|
| Authentication | JWT (15min access + 7d refresh) |
| MFA | Email OTP (6-digit, 10min expiry) |
| Password | bcrypt (12 salt rounds) |
| Document Integrity | SHA-256 hash per letter |
| QR Verification | Public URL, no auth needed |
| Audit Logs | Every action logged, 7-year retention |
| Rate Limiting | 200 req/15min global, 20 req/15min auth |
| CORS | Frontend URL only |

---

## 🌐 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/verify-email | Verify email OTP |
| POST | /api/auth/login | Login (sends OTP) |
| POST | /api/auth/login/verify-otp | Complete login |
| GET  | /api/parties | List all parties |
| GET  | /api/profiles | My letter profiles |
| POST | /api/profiles | Create profile |
| POST | /api/letters/ai/generate | AI letter generation |
| POST | /api/letters | Save draft |
| POST | /api/letters/:id/export-pdf | Export PDF |
| POST | /api/letters/:id/revoke | Revoke letter |
| GET  | /api/verify/:documentId | **Public** — Verify document |
| GET  | /api/audit | My audit logs |

---

## 🏛️ Supported Tamil Nadu Parties

| Party | Tamil | Category |
|---|---|---|
| DMK | திராவிட முன்னேற்றக் கழகம் | State Recognized |
| AIADMK | அனைத்திந்திய அண்ணா திமுக | State Recognized |
| TVK | தமிழக வெற்றி கழகம் | Registered |
| PMK | பட்டாளி மக்கள் கட்சி | State Recognized |
| VCK | விடுதலைச் சிறுத்தைகள் கட்சி | State Recognized |
| NTK | நாம் தமிழர் கட்சி | State Recognized |
| DMDK | தேசிய முற்போக்கு திராவிட கழகம் | State Recognized |
| MDMK | மறுமலர்ச்சி திமுக | State Recognized |
| BJP | பாரதிய ஜனதா கட்சி | National |
| INC | இந்திய தேசிய காங்கிரஸ் | National |

---

## 📋 Compliance

- ✅ Digital Personal Data Protection (DPDP) Act 2023
- ✅ India-only data storage recommended
- ✅ 7-year audit log retention
- ✅ SHA-256 document integrity
- ✅ No AI training on client data

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| AI | Google Gemini 1.5 Flash |
| PDF | Puppeteer |
| Auth | JWT + bcrypt + Email OTP |
| QR | qrcode npm package |
| i18n | i18next (Tamil + English) |

---

## 📞 Support

For questions about integration with Tamil Nadu government systems:
- Apply for **TNeGA (Tamil Nadu e-Governance Agency)** empanelment
- Submit proposal to Tamil Nadu IT Department
