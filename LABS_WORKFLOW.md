# 🎓 Labs Workflow - Complete User Journey

> **How Labs Work in Auron: From Discovery to Completion**

## 📋 Table of Contents
1. [User Journey Overview](#user-journey-overview)
2. [Detailed Workflow Steps](#detailed-workflow-steps)
3. [Lab Architecture](#lab-architecture)
4. [Error Handling](#error-handling)
5. [Best Practices](#best-practices)

---

## 🚀 User Journey Overview

### The Complete Lab Experience

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER STARTS HERE                              │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
          ┌────────────────────────┐
          │  1. Browse Labs        │
          │  Filter & Search       │
          │  View Difficulty       │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │  2. Select Lab         │
          │  View Description      │
          │  See Prerequisites     │
          │  Check Learning Goals  │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │  3. Start Lab Instance │
          │  Docker Container      │
          │  Environment Setup     │
          │  ~10-30 seconds        │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │  4. Access Lab         │
          │  Get Access URL        │
          │  View Port Mappings    │
          │  See Expiration Time   │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │  5. Work on Exercises  │
          │  Read Instructions     │
          │  Exploit Vulnerabilities│
          │  Request AI Hints      │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │  6. Submit Solutions   │
          │  Enter Flag/Answer     │
          │  Get Instant Feedback  │
          │  Earn Points & Badges  │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │  7. Track Progress     │
          │  View Completion %     │
          │  Check Leaderboard     │
          │  Unlock Achievements   │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │  8. Generate Report    │
          │  Scan for Vulns        │
          │  Create PDF Report     │
          │  Download Results      │
          └───────────┬────────────┘
                      │
                      ▼
          ┌────────────────────────┐
          │  9. Stop Lab          │
          │  Save Progress        │
          │  Release Resources    │
          │  Complete!            │
          └────────────────────────┘
```

---

## 📖 Detailed Workflow Steps

### Step 1: Browse Labs (LabsPage)

**Location:** `/labs` (LabsPage.tsx)

#### What User Sees:
```
┌─────────────────────────────────────────────────────────────┐
│  🛡️ Cybersecurity Labs                                      │
│                                                              │
│  📊 [20 Total Labs] [5 Completed] [20 Showing]             │
│                                                              │
│  🔍 Search: [____________]  Category: [All ▼] Difficulty: [All ▼]
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ 🌐 SQL Inj.. │  │ 🔓 XSS Att.. │  │ 🔐 CSRF Pr.. │     │
│  │              │  │              │  │              │     │
│  │ BEGINNER     │  │ INTERMEDIATE │  │ ADVANCED     │     │
│  │ 30 min       │  │ 45 min       │  │ 60 min       │     │
│  │ 100 points   │  │ 150 points   │  │ 200 points   │     │
│  │              │  │              │  │              │     │
│  │ ■■■■■░░░ 50% │  │ ░░░░░░░░  0% │  │ ■■■■■■■■ 100%│     │
│  │ [Continue]   │  │ [Start Lab]  │  │ [Review]     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

#### User Actions:
1. **Search** - Type keywords (e.g., "SQL", "XSS", "Buffer Overflow")
2. **Filter by Category** - Web Security, Network Security, Cryptography, etc.
3. **Filter by Difficulty** - Beginner, Intermediate, Advanced, Expert
4. **View Progress** - Green progress bars show completion percentage
5. **Click Lab Card** - Navigate to lab detail page

#### API Calls:
```javascript
// On page load
GET /api/labs
Response: [
  {
    id: "lab-123",
    name: "SQL Injection Basics",
    description: "Learn SQL injection...",
    category: "web_security",
    difficulty: "beginner",
    estimatedTime: 30,
    points: 100,
    tags: ["sql", "injection", "owasp"],
    exercises: [...],
    prerequisites: [],
    learningObjectives: [...]
  },
  ...
]

// Also fetches user progress
GET /api/progress
Response: [
  {
    labId: "lab-123",
    exerciseId: "ex-1",
    status: "completed",
    score: 100
  },
  ...
]
```

#### Data Flow:
```
User Loads Page → Redux dispatch(fetchLabs()) → API GET /api/labs
                                               → API GET /api/progress
                ← Labs + Progress Data ← Redux Store ← Response

User Filters → Local state updates → Filtered labs displayed
User Searches → Local filter → Matching labs shown
User Clicks Card → React Router → Navigate to /labs/:id
```

---

### Step 2: View Lab Detail (LabDetailPage)

**Location:** `/labs/:id` (LabEnvironment.tsx)

#### What User Sees:
```
┌────────────────────────────────────────────────────────────────┐
│  🔙 Back to Labs                                                │
│                                                                 │
│  🌐 SQL Injection Basics                    [BEGINNER] [100 pts]│
│  Practice fundamental SQL injection techniques in DVWA          │
│                                                                 │
│  Progress: ■■■■░░░░  2/4 exercises completed                  │
│                                                                 │
│  ┌─────────────────────────────────┬───────────────────────┐   │
│  │  Overview  │  Exercises  │      │  Instance Controls    │   │
│  ├─────────────────────────────────┤                       │   │
│  │                                 │  Status: Not Started   │   │
│  │  Learning Objectives:           │  [▶ Start Lab]        │   │
│  │  • Understand SQL injection     │                       │   │
│  │  • Learn UNION-based attacks    │                       │   │
│  │  • Practice blind SQLi          │                       │   │
│  │                                 │                       │   │
│  │  Prerequisites:                 │                       │   │
│  │  • Basic SQL knowledge          │                       │   │
│  │  • HTTP fundamentals            │                       │   │
│  └─────────────────────────────────┴───────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
```

#### User Actions:
1. **Switch Tabs** - Overview / Exercises
2. **Read Learning Objectives** - What they'll learn
3. **Check Prerequisites** - Required knowledge
4. **Click "Start Lab"** - Provision lab instance

#### API Calls:
```javascript
// On page load
GET /api/labs/:id
Response: {
  id: "lab-123",
  name: "SQL Injection Basics",
  description: "...",
  exercises: [
    {
      id: "ex-1",
      title: "Basic SQL Injection",
      description: "...",
      instructions: "...",
      hints: [...],
      points: 25,
      order: 1
    },
    ...
  ],
  containerConfig: {
    image: "vulnerables/web-dvwa",
    ports: [{container: 80, host: 8080}]
  }
}
```

---

### Step 3: Start Lab Instance

**Location:** Same page, Instance Controls component

#### What Happens Behind the Scenes:

```
User Clicks "Start Lab"
    │
    ▼
Frontend → POST /api/labs/:id/start
    │
    ▼
Backend LabService.startLab()
    │
    ├─→ Check user's active instances (max 3)
    │
    ├─→ Create database record (status: 'starting')
    │
    ├─→ Docker API → docker.createContainer({
    │       image: 'vulnerables/web-dvwa',
    │       name: 'lab-123-user-456-abc123',
    │       ports: {80: 8080},
    │       labels: {'auron.lab': 'lab-123'},
    │       environment: {...},
    │       restart: 'unless-stopped'
    │   })
    │
    ├─→ container.start()
    │
    ├─→ Wait for health check (retry 10 times, 2s interval)
    │
    ├─→ Update database (status: 'running')
    │
    ├─→ Set expiration (default: 1 hour from now)
    │
    └─→ Return instance data

Response → {
  id: "inst-abc123",
  labId: "lab-123",
  containerId: "docker-xyz789",
  status: "running",
  accessUrl: "http://localhost:8080",
  ports: [{container: 80, host: 8080}],
  expiresAt: "2025-11-14T15:30:00Z"
}
    │
    ▼
Frontend updates Redux store
    │
    ▼
UI shows "Running" status + access URL
```

#### Typical Timing:
- Database record creation: ~50ms
- Docker container creation: ~2-5 seconds
- Container startup: ~5-15 seconds
- Health check: ~2-10 seconds
- **Total:** ~10-30 seconds

#### User Sees:
```
┌─────────────────────────────┐
│  Instance Controls          │
│                             │
│  Status: [⏳ Starting...]   │
│                             │
│  Loading... 🔄              │
└─────────────────────────────┘
        ↓ (10-30 seconds)
┌─────────────────────────────┐
│  Instance Status            │
│  [✓ Running]                │
│                             │
│  ⏱ 59m remaining            │
│                             │
│  Access URL:                │
│  http://localhost:8080 🔗   │
│                             │
│  Port Mappings:             │
│  80 → 8080                  │
│  3306 → 33060              │
│                             │
│  [■ Stop] [↻ Reset] [🗑️]   │
└─────────────────────────────┘
```

#### Error Handling During Start:
```
Error: Port 8080 already in use
└→ Backend: Check for conflicting containers
   └→ Stop old instance or assign new port
      └→ Retry creation
         └→ Success or show error to user

Error: Docker daemon not responding
└→ Backend: Catch exception
   └→ Update instance status: 'error'
      └→ Return error message
         └→ Frontend shows: "Failed to start lab. Please try again."

Error: Container health check timeout
└→ Backend: Retry health check 10 times
   └→ If still failing:
      └→ Stop container
         └→ Delete instance record
            └→ Return error: "Lab failed to start. Contact support."
```

---

### Step 4: Access Lab Environment

#### User Opens Lab:
1. **Click Access URL** - Opens DVWA in new tab
2. **Login to DVWA** - Uses credentials from instructions
3. **Navigate Lab UI** - Starts working on vulnerabilities

#### Multiple Lab Types:

**Local Docker Labs** (DVWA, Juice Shop, Metasploitable):
```
User → http://localhost:8080 → Docker Container on host
No authentication needed (direct access)
```

**Cloud Labs** (Vultr-based):
```
User → https://lab-abc123.auron.dev → Vultr VM (unique URL)
SSH: ssh student@vm-ip -p 22
Authenticated via platform credentials
```

---

### Step 5: Work on Exercises

**Location:** Exercises Tab

#### What User Sees:
```
┌──────────────────────────────────────────────────────────────┐
│  Exercises (4)                                                │
│                                                               │
│  ┌─▼ 1. Basic SQL Injection ✓ [25 pts]───────────────────┐  │
│  │                                                          │  │
│  │  Description: Learn to bypass authentication using SQL  │  │
│  │  injection in the login form.                           │  │
│  │                                                          │  │
│  │  Instructions:                                           │  │
│  │  1. Navigate to http://localhost:8080/login.php        │  │
│  │  2. Try username: admin' OR '1'='1'-- and any password │  │
│  │  3. Observe the SQL query behavior                      │  │
│  │  4. Find the flag in the admin dashboard               │  │
│  │                                                          │  │
│  │  💡 Hints Available (3)  [💡 Request Hint] (-5 points) │  │
│  │                                                          │  │
│  │  Your Solution:                                          │  │
│  │  ┌────────────────────────────────────────────────┐    │  │
│  │  │ flag{sql_injection_basic_bypass_success}      │    │  │
│  │  └────────────────────────────────────────────────┘    │  │
│  │                                                          │  │
│  │  [✓ Exercise Completed! Great work!]                   │  │
│  └──────────────────────────────────────────────────────────┘
│                                                               │
│  ┌─▶ 2. UNION-based SQL Injection ░ [25 pts]───────────┐   │
│  │  Click to expand...                                    │   │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

#### User Workflow:
1. **Expand Exercise** - Click accordion to reveal details
2. **Read Instructions** - Understand the task
3. **Attempt Exploitation** - Work in lab environment
4. **Request Hint** (optional) - Get AI-powered hint
5. **Enter Solution** - Type flag or answer
6. **Submit** - Click submit button

#### API Calls:

**Request AI Hint:**
```javascript
// User clicks "Request Hint"
POST /api/ai/hint
Body: {
  labId: "lab-123",
  exerciseId: "ex-1",
  context: "User is stuck on SQL injection bypass"
}

Backend → LiquidMetalService.generateHint()
        → Claude API with prompt:
           "User is working on SQL injection exercise.
            They need a hint without revealing the answer.
            Progressive difficulty based on attempts.
            Context: [exercise description]"

Response: {
  hint: "Think about how SQL handles string concatenation.
         What happens if you close the username string early
         with a single quote? Try commenting out the rest of
         the query with --",
  cost: 5,  // Points deducted
  confidence: 0.85
}

Frontend shows hint in dialog
User progress updated: hintsUsed++
```

**Submit Solution:**
```javascript
// User enters flag and clicks Submit
POST /api/labs/:labId/exercises/:exerciseId/submit
Body: {
  solution: "flag{sql_injection_basic_bypass_success}"
}

Backend → ProgressService.submitSolution()
        → Validate against expected answer
        → If correct:
            - Update progress (status: 'completed')
            - Award points (100 - hintsUsed * 5)
            - Check for badge eligibility
            - Create audit log

Response: {
  correct: true,
  points: 95,  // 100 - 5 (1 hint used)
  message: "Correct! You've completed this exercise.",
  badgesEarned: ["SQL Apprentice"]
}

Frontend:
  - Shows success alert
  - Updates exercise checkmark (✓)
  - Updates progress bar
  - Shows badge notification if earned
  - Moves to next exercise (auto-expand)
```

---

### Step 6: Request AI Hints (Optional)

#### Hint System Architecture:

```
User Clicks "Request Hint"
    │
    ▼
Frontend: Check hints remaining (max 3 per exercise)
    │
    ├─→ If no hints left: Show "No more hints available"
    │
    └─→ If hints available:
        │
        ▼
    POST /api/ai/hint
        │
        ▼
    Backend: LiquidMetalService.generateHint()
        │
        ├─→ Build context:
        │   - Exercise description
        │   - User's previous attempts
        │   - Hints already given
        │   - User's skill level
        │
        ├─→ Call Claude API:
        │   {
        │     model: "claude-3-sonnet-20240229",
        │     messages: [{
        │       role: "user",
        │       content: "Provide a progressive hint for:
        │                [exercise details]
        │                Previous hints: [...]
        │                User attempts: [...]
        │                Don't reveal the flag directly."
        │     }],
        │     max_tokens: 500,
        │     temperature: 0.7
        │   }
        │
        ├─→ Parse Claude response
        │
        ├─→ Save to database (AIConversation table)
        │
        ├─→ Update user progress (hintsUsed++)
        │
        └─→ Deduct points (5 per hint)

    Response → {
      hint: "Progressive hint text...",
      cost: 5,
      hintsRemaining: 2
    }
        │
        ▼
    Frontend: Show hint in dialog
        │
        ├─→ Display hint text
        ├─→ Show cost deducted
        ├─→ Update hints counter
        └─→ Log hint interaction
```

#### Hint Progression Example:

**Hint 1 (Subtle):**
```
"Think about how SQL queries handle user input. What happens
when special characters are included in the username field?"
Cost: 5 points
```

**Hint 2 (More Specific):**
```
"SQL uses single quotes (') to define strings. If you close the
username string early, you can inject your own SQL code. Try
ending the string with ' and adding a comment symbol (--) to
ignore the rest of the query."
Cost: 5 points
```

**Hint 3 (Very Specific):**
```
"Try this payload in the username field: admin' OR '1'='1'--
This closes the username string, adds a condition that's always
true, and comments out the password check. Use any password."
Cost: 5 points
```

---

### Step 7: Track Progress

#### Progress Calculation:

```javascript
// Lab Progress = (Completed Exercises / Total Exercises) * 100

Lab: SQL Injection Basics
Total Exercises: 4
Completed: 2
Progress: 50%

Exercise Breakdown:
1. ✓ Basic SQL Injection (completed) - 25 pts
2. ✓ UNION-based SQLi (completed) - 25 pts
3. ░ Blind SQL Injection (pending) - 25 pts
4. ░ Error-based SQLi (pending) - 25 pts

User Stats:
- Total Points: 190 (95 + 95)
- Hints Used: 2
- Time Spent: 45 minutes
- Attempts: 3 per exercise
```

#### Progress Updates:

```
Real-time Updates via WebSocket:

User A completes exercise
    │
    ▼
Backend → socket.emit('progress:update', {
  userId: 'user-123',
  labId: 'lab-123',
  exerciseId: 'ex-1',
  status: 'completed',
  points: 95
})
    │
    ▼
All connected clients receive update
    │
    ├─→ User A: Update local progress display
    ├─→ User B: See leaderboard change
    └─→ Instructor: See class progress update
```

#### Leaderboard:

```
┌────────────────────────────────────────────┐
│  🏆 Leaderboard - This Week                │
│                                            │
│  1. 👑 alice_the_hacker  ···  1,250 pts   │
│  2. 🥈 bob_security      ···  1,150 pts   │
│  3. 🥉 charlie_cyber     ···    980 pts   │
│  4.    you_username      ···    950 pts   │← You
│  5.    dave_defender     ···    890 pts   │
└────────────────────────────────────────────┘

Filter: [This Week ▼] [All Users ▼]
```

---

### Step 8: Generate Reports

**Location:** Reports page or lab detail page

#### Vulnerability Scan Report:

```
User Clicks "Run Scan"
    │
    ▼
Frontend → POST /api/scans
    Body: {
      targetUrl: "http://localhost:8080",
      scanType: "comprehensive"
    }
    │
    ▼
Backend → VulnerabilityScanService.executeScan()
    │
    ├─→ Initialize ZAP session
    │
    ├─→ Spider scan (URL discovery):
    │   ├─→ Start spider: POST /JSON/spider/action/scan
    │   ├─→ Monitor progress: GET /JSON/spider/view/status/:scanId
    │   │   (Polls every 2 seconds until 100%)
    │   └─→ Get results: GET /JSON/spider/view/results/:scanId
    │
    ├─→ Active scan (vulnerability detection):
    │   ├─→ Start scan: POST /JSON/ascan/action/scan
    │   ├─→ Monitor progress: GET /JSON/ascan/view/status/:scanId
    │   │   (Polls every 5 seconds until 100%)
    │   └─→ Get alerts: GET /JSON/core/view/alerts/?baseurl=...
    │
    ├─→ Parse and categorize findings:
    │   {
    │     critical: 3,
    │     high: 7,
    │     medium: 12,
    │     low: 8,
    │     info: 5
    │   }
    │
    ├─→ Save to database (Scan model)
    │
    └─→ Return scan ID

Response → {
  scanId: "scan-abc123",
  status: "completed",
  findings: [...],
  totalVulnerabilities: 35
}
```

#### PDF Report Generation:

```
User Clicks "Generate Report"
    │
    ▼
Frontend → POST /api/reports
    Body: {
      reportType: "vulnerability_scan",
      scanId: "scan-abc123",
      format: "pdf",
      title: "DVWA Security Assessment"
    }
    │
    ▼
Backend → ReportService.generateReport()
    │
    ├─→ Fetch scan data from database
    │
    ├─→ Render HTML template with data:
    │   <html>
    │     <style>/* Professional CSS */</style>
    │     <body>
    │       <header>Report Header</header>
    │       <section class="executive-summary">...</section>
    │       <section class="findings">
    │         <!-- Critical findings in red -->
    │         <!-- High findings in orange -->
    │         <!-- etc. -->
    │       </section>
    │       <section class="recommendations">...</section>
    │     </body>
    │   </html>
    │
    ├─→ Puppeteer PDF generation:
    │   browser = await puppeteer.launch({
    │     headless: true,
    │     args: ['--no-sandbox']
    │   })
    │   page = await browser.newPage()
    │   await page.setContent(html, {waitUntil: 'networkidle0'})
    │   pdfBuffer = await page.pdf({
    │     format: 'A4',
    │     margin: {top: 20, right: 20, bottom: 20, left: 20},
    │     printBackground: true
    │   })
    │   await browser.close()
    │
    ├─→ Save PDF to disk: ./storage/reports/report-abc123.pdf
    │
    ├─→ Update database record:
    │   {
    │     filePath: './storage/reports/report-abc123.pdf',
    │     fileSize: 524288,  // bytes
    │     generatedAt: '2025-11-14T12:00:00Z',
    │     status: 'completed'
    │   }
    │
    └─→ Return report metadata

Response → {
  reportId: "report-xyz789",
  fileName: "dvwa-security-assessment-20251114.pdf",
  fileSize: 524288,
  downloadUrl: "/api/reports/report-xyz789/download"
}
```

#### Download Report:

```
User Clicks "Download"
    │
    ▼
Frontend → GET /api/reports/:id/download
    │
    ▼
Backend → ReportService.downloadReport()
    │
    ├─→ Check user authorization
    │
    ├─→ Read file from disk: fs.createReadStream(filePath)
    │
    ├─→ Set headers:
    │   Content-Type: application/pdf
    │   Content-Disposition: attachment; filename="report.pdf"
    │   Content-Length: 524288
    │
    └─→ Stream file to response

Browser → Saves file to Downloads folder
```

---

### Step 9: Stop Lab & Save Progress

#### Stopping a Lab:

```
User Clicks "Stop"
    │
    ▼
Frontend shows confirmation dialog
    │
    ├─→ "Are you sure? Progress will be saved."
    │   [Cancel] [Stop Lab]
    │
    └─→ User confirms
        │
        ▼
    POST /api/labs/instances/:instanceId/stop
        │
        ▼
    Backend → LabService.stopInstance()
        │
        ├─→ Find instance in database
        │
        ├─→ Docker: Stop container
        │   docker.getContainer(containerId).stop()
        │
        ├─→ Update database:
        │   status: 'stopped'
        │   stoppedAt: now()
        │
        ├─→ Preserve progress data (not deleted)
        │
        └─→ Release port mapping

    Response → {
      success: true,
      message: "Lab stopped successfully"
    }
        │
        ▼
    Frontend updates UI:
      - Status: "Stopped"
      - Remove access URL
      - Show "Start Lab" button again
```

#### Auto-Stop on Expiration:

```
Background Job (runs every 5 minutes):
    │
    ├─→ Find expired instances:
    │   SELECT * FROM lab_instances
    │   WHERE status='running'
    │   AND expiresAt < NOW()
    │
    ├─→ For each expired instance:
    │   ├─→ Stop Docker container
    │   ├─→ Update status to 'expired'
    │   ├─→ Send notification to user
    │   └─→ Log event
    │
    └─→ Cleanup old stopped instances (>7 days)
```

---

## 🏗️ Lab Architecture

### Components Interaction Diagram:

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  LabsPage   │  │LabDetailPage│  │ LabInstance │        │
│  │  (List)     │  │  (Overview) │  │  Controls   │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │                 │                 │                │
│         └─────────┬───────┴─────────┬───────┘                │
│                   │                 │                        │
│             ┌─────▼─────────────────▼─────┐                 │
│             │    Redux Store (Labs)        │                 │
│             │  - labs[]                    │                 │
│             │  - currentLab                │                 │
│             │  - currentInstance           │                 │
│             └─────────┬────────────────────┘                 │
│                       │                                      │
└───────────────────────┼──────────────────────────────────────┘
                        │ HTTP/WebSocket
                        │
┌───────────────────────▼──────────────────────────────────────┐
│                      BACKEND API                              │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │LabController │  │LabService    │  │DockerService │     │
│  │  (Routes)    │→ │  (Business)  │→ │  (Container) │     │
│  └──────────────┘  └──────────────┘  └──────┬───────┘     │
│                                              │              │
│  ┌──────────────┐  ┌──────────────┐        │              │
│  │Progress      │  │AI Service    │        │              │
│  │Service       │  │(LiquidMetal) │        │              │
│  └──────────────┘  └──────────────┘        │              │
│                                              │              │
└──────────────────────────────────────────────┼──────────────┘
                                               │
                          ┌────────────────────┴────────────┐
                          │                                 │
                ┌─────────▼────────┐            ┌──────────▼─────────┐
                │  PostgreSQL      │            │  Docker Engine     │
                │  - labs          │            │  - dvwa            │
                │  - lab_instances │            │  - juiceshop       │
                │  - progress      │            │  - metasploitable  │
                └──────────────────┘            └────────────────────┘
```

### State Management Flow:

```
ACTION: fetchLabs()
    ↓
REDUX THUNK: async request
    ↓
API: GET /api/labs
    ↓
REDUCER: labs/fetchLabs/fulfilled
    ↓
STATE: {
  labs: [...],
  isLoading: false,
  error: null
}
    ↓
COMPONENT: Re-renders with labs data
```

---

## ⚠️ Error Handling

### Frontend Error Handling:

```javascript
// Example: Starting a lab with error handling

const handleStartLab = async () => {
  setIsLoading(true);
  try {
    // Dispatch async action
    await dispatch(startLab(labId)).unwrap();

    // Success
    toast.success('Lab started successfully!');

  } catch (error) {
    // Error handling based on type
    if (error.response?.status === 429) {
      toast.error('Too many instances running. Stop an existing lab first.');
    } else if (error.response?.status === 503) {
      toast.error('Docker service unavailable. Please contact support.');
    } else if (error.message?.includes('port')) {
      toast.error('Port conflict detected. Please try again.');
    } else {
      toast.error('Failed to start lab. Please try again later.');
    }

    // Log for debugging
    console.error('Lab start error:', error);

  } finally {
    setIsLoading(false);
  }
};
```

### Backend Error Handling:

```javascript
// Example: Lab service error handling

async startLab(labId, userId) {
  try {
    // 1. Validation
    const lab = await this.labRepository.findById(labId);
    if (!lab) {
      throw new NotFoundError('Lab not found');
    }

    if (!lab.isActive) {
      throw new ValidationError('Lab is not active');
    }

    // 2. Check limits
    const activeInstances = await this.getActiveInstances(userId);
    if (activeInstances.length >= 3) {
      throw new ResourceLimitError('Maximum 3 active instances allowed');
    }

    // 3. Try to start container
    const instance = await this.dockerService.createContainer({
      image: lab.containerConfig.image,
      ports: lab.containerConfig.ports
    });

    // 4. Wait for health check
    await this.waitForHealthCheck(instance.containerId, {
      retries: 10,
      interval: 2000,
      timeout: 30000
    });

    return instance;

  } catch (error) {
    // Cleanup on error
    if (instance?.containerId) {
      await this.dockerService.removeContainer(instance.containerId);
    }

    // Log error
    logger.error('Failed to start lab', {
      labId,
      userId,
      error: error.message,
      stack: error.stack
    });

    // Re-throw with user-friendly message
    if (error instanceof ResourceLimitError) {
      throw error;  // Keep original message
    } else if (error.message.includes('port')) {
      throw new ConflictError('Port already in use. Please try again.');
    } else if (error.message.includes('timeout')) {
      throw new TimeoutError('Lab failed to start within timeout period.');
    } else {
      throw new InternalServerError('Failed to start lab. Please contact support.');
    }
  }
}
```

### Common Error Scenarios:

#### 1. Port Conflict
```
Error: "Port 8080 is already allocated"

Backend Handling:
  1. Check for existing instances using port
  2. If instance is old (>1 hour), force stop it
  3. Assign new random port from pool (8081-8099)
  4. Retry container creation
  5. If still fails, return error to user

User Experience:
  "Lab is starting on an alternate port. Please wait..."
  → Success: Shows new port in access URL
  → Failure: "All ports in use. Please stop an existing lab."
```

#### 2. Docker Daemon Unavailable
```
Error: "Cannot connect to Docker daemon"

Backend Handling:
  1. Catch connection error
  2. Log critical error
  3. Return 503 Service Unavailable

User Experience:
  "Lab infrastructure temporarily unavailable.
   Our team has been notified. Please try again in a few minutes."
```

#### 3. Container Health Check Timeout
```
Error: "Container failed health check after 30 seconds"

Backend Handling:
  1. Stop the container
  2. Inspect container logs for errors
  3. Delete container and instance record
  4. Increment retry counter
  5. If < 3 retries, automatically retry
  6. If >= 3 retries, mark lab as unavailable

User Experience:
  First 2 attempts: "Retrying lab startup..."
  After 3 attempts: "Lab failed to start. This has been reported."
```

#### 4. AI Hint Service Down
```
Error: "LiquidMetal API returned 500 error"

Backend Handling:
  1. Catch API error
  2. Return fallback hint from database (pre-written hints)
  3. Log incident for monitoring

User Experience:
  User still gets hint (from fallback system)
  No visible error - seamless fallback
```

#### 5. Scan Timeout
```
Error: "ZAP scan exceeded 5 minute timeout"

Backend Handling:
  1. Cancel ZAP scan
  2. Retrieve partial results
  3. Mark scan as "partial"
  4. Return what was found

User Experience:
  "Scan completed with partial results (timeout).
   Found: 12 vulnerabilities
   Consider running a targeted scan for better coverage."
```

---

## 💡 Best Practices

### For Students:

1. **Start Small** - Begin with beginner labs before advanced ones
2. **Read Instructions Carefully** - Don't skip the overview
3. **Use Hints Wisely** - Try solving on your own first
4. **Save Progress** - Lab expires after 1 hour, plan accordingly
5. **Generate Reports** - Create PDF reports for your portfolio
6. **Track Progress** - Check leaderboard for motivation
7. **Learn from Mistakes** - Review hints and solutions after completion

### For Instructors:

1. **Pre-Test Labs** - Test all labs before workshop
2. **Monitor Progress** - Use admin dashboard to track students
3. **Demonstrate Attacks** - Run attack scripts live
4. **Show SIEM Alerts** - Open Wazuh dashboard for visibility
5. **Encourage Collaboration** - Use collaboration features
6. **Set Clear Expectations** - Explain scoring and hints system
7. **Provide Context** - Explain why vulnerabilities matter

### For Administrators:

1. **Resource Monitoring** - Check Docker stats regularly
2. **Cleanup Old Instances** - Run cleanup jobs weekly
3. **Backup Progress Data** - Daily PostgreSQL backups
4. **Monitor Errors** - Check backend logs for issues
5. **Update Containers** - Keep vulnerable app images updated
6. **Security Hardening** - Never expose lab services to internet
7. **API Key Rotation** - Rotate Vultr/AI keys quarterly

---

## 📊 Success Metrics

### What to Track:

```
Student Metrics:
- Labs completed (count & percentage)
- Average time per lab
- Hints used per exercise
- Score/points earned
- Badges/achievements unlocked
- Leaderboard ranking
- Reports generated

Platform Metrics:
- Total active users
- Concurrent lab instances
- Average lab startup time
- API response times
- Error rate (< 1%)
- Resource utilization
- System uptime (> 99.9%)
```

---

## 🎯 Summary

The Auron labs workflow provides:

✅ **Seamless User Experience** - From discovery to completion
✅ **Real-time Feedback** - Instant validation and hints
✅ **Comprehensive Tracking** - Progress, points, badges
✅ **Professional Reports** - PDF generation with Puppeteer
✅ **AI-Powered Learning** - Adaptive hints via Claude
✅ **SIEM Visibility** - Real-time attack detection
✅ **Robust Error Handling** - Graceful failures and recovery
✅ **Scalable Architecture** - Docker + Cloud (Vultr) support

**Result**: A production-ready cybersecurity training platform that makes learning practical, engaging, and effective!

---

**Questions? Check:**
- 📘 [Deployment Guide](DEPLOYMENT_COMPLETE.md)
- 🔑 [API Keys Guide](API_KEYS_GUIDE.md)
- 📚 [Implementation Guide](IMPLEMENTATION_GUIDE.md)
- 🏥 [Current Status](CURRENT_STATUS.md)
