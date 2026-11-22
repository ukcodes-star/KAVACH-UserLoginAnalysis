# Sentinel SOC — Login Security & Behavioral Anomaly Detection Frontend

An enterprise-grade Security Operations Center (SOC) dashboard and identity threat intelligence frontend built with **React**, **Vite**, **Tailwind CSS**, **Axios**, **Recharts**, **Lucide React**, **Winston JS**, and **xAI Grok-2 AI Copilot**.

---

## 🚀 Key Features

### 1. Real-Time Security Operations Center (SOC) Dashboard
- **Executive Threat Metrics**: Monitored user count, priority accounts on watchlist (Risk Score ≥ 60/100), failed login rate with dynamic threshold warning, and critical/high anomaly tallies.
- **7-Day Authentication Trajectory (Recharts)**: Interactive Area Chart with dual-tone gradient fill tracking successful vs anomalous failed sessions over time.
- **Anomaly Severity Matrix (Recharts)**: Donut chart displaying proportion of Critical, High, Medium, and Low severity events.
- **Priority Threat Accounts & Critical Anomalies**: Live watchlist with one-click **"Grok Inspect"** deep-dive analysis.

### 2. Behavioral Risk Radar & Threat Scoring
- Continuous heuristic threat calculation (Failed logins, Off-hour logins, New IPs, New Devices, Brute-force sequences, Inactive account exploitation).
- Interactive account risk lookup with visual risk meters (Safe 0-39, Elevated 40-59, Critical 60-100).
- **Grok AI Behavioral Profiler**: Comprehensive identity risk evaluation, MITRE ATT&CK mapping, and custom containment playbooks.

### 3. Anomaly Intelligence & Forensics
- Paginated table of all detected anomalies with severity badges, threat classification, target accounts, and timestamps.
- Multi-dimensional filtering by severity (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`) and anomaly type (`BRUTE_FORCE`, `INACTIVE_USER_LOGIN`, `NEW_IP`, `NEW_DEVICE`, `UNUSUAL_LOGIN_TIME`, `FAILED_LOGIN`).
- Detailed forensic modal with instant xAI Grok threat breakdown.

### 4. Ingested Authentication Telemetry & Simulator
- Full audit log of all authentication requests, IP addresses, client fingerprints, and estimated geolocations.
- **Real-Time Traffic Simulator**: Allows SOC administrators to emit custom login events (e.g., simulating 5 quick failures to trigger the brute-force rule) and watch heuristics fire live.

### 5. Identity & Access Management (IAM)
- Directory user management table with account activation/locking controls (to test inactive login interception).
- User provisioning modal with client-side form validation.
- Audit trail tracking unauthorized access attempts and permission denials.

### 6. xAI Grok-2 Threat Intelligence Copilot
- **Live vs Simulated Mode**: Operates seamlessly in intelligent simulation mode, and instantly switches to live neural inference when `GROK_API_KEY` is provided in `.env`.
- **Executive Briefing Generator**: Summarizes current organizational threat exposure and provides top 3 administrative directives.
- **Grok CyberCop Chat Terminal**: Conversational SOC assistant answering questions on threat vectors, containment strategies, and MITRE tactics.

### 7. Winston JS Client Telemetry Console
- Real-time logging of all HTTP requests, responses, latency, and system events via `winston`.
- Interactive SOC Telemetry Drawer accessible via the navigation bar.
- Level filters (`ALL`, `ERROR`, `WARN`, `INFO`, `HTTP`, `DEBUG`), copy to clipboard, and JSON download capability.

---

## 📁 Project Structure

```
login-analysis-frontend/
├── src/
│   ├── api/
│   │   ├── client.js          # Axios client with Winston request/response interceptors & auto-JWT
│   │   └── index.js           # API services (auth, dashboard, anomalies, risk, logs, users, grok AI)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.jsx     # Header with brand, Grok status pill, Winston console trigger, user info
│   │   │   ├── Sidebar.jsx    # SOC operations navigation
│   │   │   └── index.js
│   │   └── ui/                # Reusable UI component library (Barrel exported)
│   │       ├── Button.jsx     # Primary, secondary, danger, grok, ghost, outline
│   │       ├── Card.jsx       # Glassmorphism panels with hover glows
│   │       ├── Badge.jsx      # Severities, statuses, roles, and AI tags
│   │       ├── Input.jsx      # Styled inputs with icons & password toggles
│   │       ├── Select.jsx     # Styled dropdowns
│   │       ├── Modal.jsx      # Accessible dialog with blur backdrop
│   │       ├── StatCard.jsx   # KPI metric card with trends & cyber glows
│   │       ├── Table.jsx      # Sortable tables with loading skeletons & empty states
│   │       ├── Skeleton.jsx   # Shimmer effect placeholders
│   │       ├── Alert.jsx      # System notification banners
│   │       ├── Tabs.jsx       # Category and filter switches
│   │       ├── Pagination.jsx # Page controls
│   │       ├── GrokAiBadge.jsx# Animated AI engine status indicator
│   │       ├── WinstonConsole.jsx # Live telemetry drawer
│   │       └── index.js       # Barrel export of all UI components
│   ├── context/
│   │   └── AuthContext.jsx    # JWT auth state, session storage, unauthorized event handler
│   ├── pages/
│   │   ├── LoginPage.jsx      # Sign in & registration with security hints
│   │   ├── DashboardPage.jsx  # SOC executive dashboard & Recharts data viz
│   │   ├── AnomaliesPage.jsx  # Paginated anomaly table, filters, Grok inspect
│   │   ├── RiskPage.jsx       # Behavioral risk radar & user risk scanner
│   │   ├── LoginLogsPage.jsx  # Telemetry log & traffic simulator
│   │   ├── UsersPage.jsx      # IAM directory management & user locking
│   │   ├── AuditPage.jsx      # Immutable authorization audit log
│   │   ├── GrokAiPage.jsx     # Grok CyberCop interactive chat & briefing
│   │   └── index.js           # Barrel export of all pages
│   ├── utils/
│   │   └── logger.js          # Winston JS frontend logger & in-memory ring-buffer
│   ├── App.jsx                # Root layout & route switcher
│   ├── index.css              # Cyber-dark theme & Tailwind directives
│   └── main.jsx
├── tailwind.config.js         # SOC color palette (cyan, violet, rose, amber, emerald)
└── vite.config.js             # Node polyfills, @ alias, and /api proxy to Spring Boot
```

---

## 🛠️ How to Run

### Frontend
```bash
cd login-analysis-frontend
npm install
npm run dev
```
Runs at: **`http://localhost:5173`**

### Backend
```bash
cd login-analysis-backend
.\mvnw.cmd spring-boot:run
```
Runs at: **`http://localhost:8080`**

### Adding your Grok (xAI) API Key
In `login-analysis-backend/.env`:
```properties
GROK_API_KEY=xai-your-api-key-here
GROK_BASE_URL=https://api.x.ai/v1
GROK_MODEL=grok-2-latest
```
Restart the backend, and Grok AI will automatically activate live neural inference!
