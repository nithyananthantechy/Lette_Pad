-- ============================================================
-- AI Letter Pad Platform — PostgreSQL Schema
-- Tamil Nadu Political & Government Officials Edition
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'member',
  -- roles: super_admin, party_admin, party_member, govt_official, govt_staff
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  otp_code VARCHAR(10),
  otp_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- POLITICAL PARTIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS parties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,              -- e.g. Dravida Munnetra Kazhagam
  name_ta VARCHAR(255),                        -- e.g. திராவிட முன்னேற்றக் கழகம்
  abbreviation VARCHAR(20) NOT NULL,           -- e.g. DMK
  category VARCHAR(50) NOT NULL,
  -- category: national_recognized, state_recognized, registered_unrecognized
  symbol_description VARCHAR(255),             -- e.g. Rising Sun
  headquarters VARCHAR(255),
  founded_year INTEGER,
  party_logo_url VARCHAR(500),
  primary_color VARCHAR(7),                    -- hex color e.g. #FF0000
  secondary_color VARCHAR(7),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- GOVERNMENT DEPARTMENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS government_departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_en VARCHAR(255) NOT NULL,
  name_ta VARCHAR(255),
  department_type VARCHAR(50) NOT NULL,
  -- type: state_cabinet, legislative, district, municipality
  district VARCHAR(100),
  logo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- LETTER PROFILES TABLE
-- (Each profile = one unique letterhead configuration)
-- ============================================================
CREATE TABLE IF NOT EXISTS letter_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  profile_type VARCHAR(50) NOT NULL,
  -- type: party_profile, govt_profile
  
  -- Party-related fields
  party_id UUID REFERENCES parties(id) ON DELETE SET NULL,
  party_role VARCHAR(100),
  -- e.g. President, General Secretary, District Secretary, Youth Wing Head
  
  -- Govt-related fields
  department_id UUID REFERENCES government_departments(id) ON DELETE SET NULL,
  designation_en VARCHAR(255),               -- e.g. Member of Legislative Assembly
  designation_ta VARCHAR(255),               -- e.g. சட்டமன்ற உறுப்பினர்
  constituency VARCHAR(255),                 -- e.g. Egmore, Coimbatore North
  
  -- Common fields
  profile_name_en VARCHAR(255) NOT NULL,
  profile_name_ta VARCHAR(255),
  address_en TEXT,
  address_ta TEXT,
  phone VARCHAR(15),
  email VARCHAR(255),
  website VARCHAR(255),
  
  -- Design customization
  layout_style VARCHAR(50) DEFAULT 'classic',
  -- styles: classic, modern, minimal, government
  logo_url VARCHAR(500),
  signature_url VARCHAR(500),
  
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- GENERATED LETTERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_letters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letter_profile_id UUID REFERENCES letter_profiles(id) ON DELETE SET NULL,
  generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  document_id VARCHAR(50) UNIQUE NOT NULL,   -- e.g. TN-DMK-2026-00001
  subject_en TEXT,
  subject_ta TEXT,
  body_en TEXT,
  body_ta TEXT,
  recipient_name VARCHAR(255),
  recipient_address TEXT,
  
  -- Security fields
  document_hash VARCHAR(64) NOT NULL,        -- SHA-256 hash of content
  qr_code_data TEXT,                         -- URL for QR verification
  
  -- Status
  status VARCHAR(30) DEFAULT 'draft',
  -- status: draft, finalized, revoked
  
  pdf_path VARCHAR(500),                     -- encrypted PDF storage path
  language VARCHAR(10) DEFAULT 'ta',         -- ta or en
  
  created_at TIMESTAMP DEFAULT NOW(),
  finalized_at TIMESTAMP,
  revoked_at TIMESTAMP,
  revoked_reason TEXT
);

-- ============================================================
-- AUDIT LOGS TABLE (Tamper-evident)
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  -- actions: LOGIN, LOGOUT, CREATE_PROFILE, GENERATE_LETTER,
  --          EXPORT_PDF, REVOKE_LETTER, CHANGE_PASSWORD, etc.
  resource_type VARCHAR(50),                 -- letter, profile, party, user
  resource_id UUID,
  ip_address VARCHAR(45),
  user_agent TEXT,
  details JSONB,                             -- additional context
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- TEAM ACCESS TABLE
-- (Party admin grants access to secretaries/PAs)
-- ============================================================
CREATE TABLE IF NOT EXISTS team_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  letter_profile_id UUID REFERENCES letter_profiles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  access_level VARCHAR(30) DEFAULT 'draft_only',
  -- levels: draft_only, finalize, admin
  granted_by UUID REFERENCES users(id),
  granted_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- EMAIL OTP TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS email_otps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  otp_code VARCHAR(10) NOT NULL,
  purpose VARCHAR(50) NOT NULL,
  -- purposes: email_verification, login_mfa, password_reset
  is_used BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_letter_profiles_user ON letter_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_letter_profiles_party ON letter_profiles(party_id);
CREATE INDEX IF NOT EXISTS idx_generated_letters_profile ON generated_letters(letter_profile_id);
CREATE INDEX IF NOT EXISTS idx_generated_letters_doc_id ON generated_letters(document_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);

-- ============================================================
-- DEMO DATA: Tamil Nadu Political Parties
-- ============================================================
INSERT INTO parties (name_en, name_ta, abbreviation, category, symbol_description, headquarters, founded_year, primary_color, secondary_color) VALUES
('Dravida Munnetra Kazhagam', 'திராவிட முன்னேற்றக் கழகம்', 'DMK', 'state_recognized', 'Rising Sun', 'Chennai', 1949, '#FF0000', '#000000'),
('All India Anna Dravida Munnetra Kazhagam', 'அனைத்திந்திய அண்ணா திராவிட முன்னேற்றக் கழகம்', 'AIADMK', 'state_recognized', 'Two Leaves', 'Chennai', 1972, '#008000', '#FFFFFF'),
('Tamilaga Vettri Kazhagam', 'தமிழக வெற்றி கழகம்', 'TVK', 'registered_unrecognized', 'Ship', 'Chennai', 2024, '#FFD700', '#000000'),
('Pattali Makkal Katchi', 'பட்டாளி மக்கள் கட்சி', 'PMK', 'state_recognized', 'Mango', 'Chennai', 1989, '#FF8C00', '#FFFFFF'),
('Viduthalai Chiruthaigal Katchi', 'விடுதலைச் சிறுத்தைகள் கட்சி', 'VCK', 'state_recognized', 'Pot', 'Chennai', 1999, '#0000FF', '#FFFFFF'),
('Naam Tamilar Katchi', 'நாம் தமிழர் கட்சி', 'NTK', 'state_recognized', 'Farmer with Plough', 'Chennai', 2009, '#FF4500', '#000000'),
('Desiya Murpokku Dravida Kazhagam', 'தேசிய முற்போக்கு திராவிட கழகம்', 'DMDK', 'state_recognized', 'Nagara Drum', 'Chennai', 2005, '#800080', '#FFFFFF'),
('Marumalarchi Dravida Munnetra Kazhagam', 'மறுமலர்ச்சி திராவிட முன்னேற்றக் கழகம்', 'MDMK', 'state_recognized', 'Crane', 'Chennai', 1994, '#006400', '#FFD700'),
('Bharatiya Janata Party', 'பாரதிய ஜனதா கட்சி', 'BJP', 'national_recognized', 'Lotus', 'New Delhi', 1980, '#FF6600', '#FFFFFF'),
('Indian National Congress', 'இந்திய தேசிய காங்கிரஸ்', 'INC', 'national_recognized', 'Hand', 'New Delhi', 1885, '#00BFFF', '#FFFFFF')
ON CONFLICT DO NOTHING;
