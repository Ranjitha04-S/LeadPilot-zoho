# 🚀 LeadPilot — Smart Lead Scoring for Zoho CRM

> A lead scoring solution built natively inside Zoho CRM using Widgets — no backend, no external servers.

![Zoho CRM](https://img.shields.io/badge/Zoho-CRM%20Widget-E42527?style=flat&logo=zoho)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=flat&logo=javascript)
![Hackathon](https://img.shields.io/badge/Zoho-Developer%20Hackathon-blue?style=flat)

---

## 🎥 Demo

> 📽️ [Watch Demo Video] (https://drive.google.com/file/d/1wObWGCT_fhuqVoX5MaTmN-YtwQrrKNb4/view?usp=sharing)

---

## 💡 Problem Statement

Sales teams in Zoho CRM handle a large number of leads daily. Without a prioritization system, they spend equal time on every lead — missing high-potential opportunities while wasting effort on low-value ones.

**LeadPilot solves this by automatically scoring and categorizing every lead as Hot, Warm, or Cold.**

---

## ✨ Features

- 📊 **Home Page Dashboard** — Auto-evaluates recent leads with scores, priority badges, and filter options
- 🔍 **Score Breakdown Tooltip** — Hover to see how each score was calculated
- 🏷️ **Priority Categories** — Hot (pursue now), Warm (nurture), Cold (follow up later)
- 📋 **In-Record Popup Widget** — Scoring button inside individual lead pages with detailed factor breakdown
- ⚡ **Real-Time Recalculation** — Score updates instantly when lead data changes
- 🔄 **Dashboard Sync** — Updated scores reflect across both dashboard and individual lead views

---

## 🧮 Six-Factor Scoring System

LeadPilot evaluates each lead using 6 core factors. The final score is capped at **100**.

| Factor | What It Measures |
|---|---|
| 🏢 **Company Fit** | Employees, revenue & industry relevance |
| 📣 **Buying Signals** | Engagement and intent indicators |
| 👔 **Decision-Maker Access** | Lead role and authority level |
| ⏱️ **Timing** | Budget availability and urgency |
| 🤝 **Trust Source** | Lead source credibility |
| 🌍 **Geography** | Location-based market relevance |

> **Note:** Industry Bonus is shown separately in the UI for transparency, but it is a sub-component of Company Fit — not a standalone factor.

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Platform | Zoho CRM |
| Widget Type | Zoho CRM Widgets (Home Page + In-Record) |
| SDK | Zoho JavaScript SDK (`ZOHO.CRM`) |
| Languages | HTML, CSS, JavaScript |
| Backend | None — runs entirely inside Zoho CRM |

---

## 🏗 Why Zoho CRM Widgets?

LeadPilot runs **completely inside Zoho CRM** and interacts directly with the Leads module. Zoho CRM Widgets allow fetching live lead data using the Zoho JS SDK and displaying results within the CRM interface — making it ideal for:

- Building a lead scoring dashboard as a Home Page Widget
- Adding an in-record scoring button as a Lead Detail Widget
- Zero dependency on external servers or custom functions

---

## 📁 Project Structure

```
LeadPilot-zoho/
├── home-widget/
│   ├── index.html         # Dashboard UI
│   ├── app.js             # Scoring logic + SDK calls
│   └── style.css          # Dashboard styles
├── lead-widget/
│   ├── index.html         # Popup score card UI
│   ├── app.js             # Per-lead scoring logic
│   └── style.css          # Widget styles
└── plugin-manifest.json   # Zoho widget config
```

---

## 🚀 How to Run

1. Clone this repo
2. Open [Zoho CRM Developer Console](https://marketplace.zoho.com/developer)
3. Create a new Widget project
4. Upload the widget files
5. Deploy to your Zoho CRM sandbox
6. Open CRM → Leads module to see LeadPilot in action

---

## 🏆 Built For

**Zoho Developer Community Hackathon**
Submitted under the CRM Widgets category.

---

## 👩‍💻 Author

**Ranjitha S** — [@Ranjitha04-S](https://github.com/Ranjitha04-S)
