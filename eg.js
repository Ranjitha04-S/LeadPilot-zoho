// Initialize Zoho SDK (same as before)
ZOHO.embeddedApp.on("PageLoad", function(data) {
    var request = {
        Entity: "Leads",
        sort_order: "desc",  // Optional: newest first
        sort_column: "Created_Time",
        per_page: 100,
        page: 1
    };
    ZOHO.CRM.API.getAllRecords(request)
    .then(function(response) {
        var leads = response.data;
        processLeads(leads);
    })
    .catch(function(error) {
        console.error("Error fetching leads:", error);
        document.body.innerHTML += "<p>Error loading leads. Check console.</p>";
    });
});

ZOHO.embeddedApp.init();

// Updated: Calculate score based on your actual fields
function calculateScore(lead) {
    // Budget (30%) - Picklist: Low/Medium/High
    var budgetValue = lead.Budget || "Low";
    var budgetScore = 0;
    if (budgetValue === "High") budgetScore = 100;
    else if (budgetValue === "Medium") budgetScore = 66;
    else if (budgetValue === "Low") budgetScore = 33;

    // Industry (20%) - Prioritize IT/Tech
    var industryValue = lead.Industry || "";
    var industryScore = 0;
    if (industryValue.includes("IT") || industryValue.includes("Software") || industryValue.includes("Tech")) {
        industryScore = 100;
    } else if (industryValue) {
        industryScore = 50;  // Medium for any other industry
    }

    // Engagement/Response proxy (25%) - Email Clicks + Website Visits
    var clicks = parseInt(lead.Email_Clicks || 0);
    var visits = parseInt(lead.Website_Visits || 0);
    var engagementScore = Math.min((clicks * 10 + visits * 5) * 2, 100);  // Scale: e.g., 5 clicks + 5 visits ≈ 75

    // Company Size (25%) - No of Employees
    var employees = parseInt(lead.No_of_Employees || 0);
    var sizeScore = 0;
    if (employees >= 500) sizeScore = 100;
    else if (employees >= 100) sizeScore = 66;
    else if (employees > 0) sizeScore = 33;

    // Weighted total
    var totalScore = Math.round(
        (0.3 * budgetScore) +
        (0.2 * industryScore) +
        (0.25 * engagementScore) +
        (0.25 * sizeScore)
    );

    return totalScore;
}

// getCategory and isToday remain the same
function getCategory(score) {
    if (score >= 80) return { class: "hot", emoji: "🔥", label: "Hot" };
    if (score >= 50) return { class: "warm", emoji: "🌤️", label: "Warm" };
    return { class: "cold", emoji: "❄️", label: "Cold" };
}

function isToday(createdTime) {
    if (!createdTime) return false;
    var today = new Date().toISOString().split('T')[0];
    return createdTime.startsWith(today);
}

// Updated processLeads - Use correct display fields
function processLeads(leads) {
    var tbody = document.getElementById("leads-tbody");
    var hotList = document.getElementById("hot-leads-list");
    hotList.innerHTML = "";  // Clear previous
    tbody.innerHTML = "";

    if (leads.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5'>No leads found.</td></tr>";
        return;
    }

    leads.forEach(function(lead) {
        var score = calculateScore(lead);
        var category = getCategory(score);

        // Display Name: Use Lead_Name if available, else Full_Name or Company
        var displayName = lead.Lead_Name || lead.Full_Name || lead.Company || "Unnamed Lead";

        // All Leads Table Row
        var row = document.createElement("tr");
        row.className = category.class;
        row.innerHTML = `
            <td>${displayName}</td>
            <td>${score}</td>
            <td>${category.emoji} ${category.label}</td>
            <td><a href="tel:${lead.Phone || ''}">Call</a></td>
            <td><a href="mailto:${lead.Email || ''}">Email</a></td>
        `;
        tbody.appendChild(row);

        // Today's Hot Leads
        if (category.class === "hot" && isToday(lead.Created_Time)) {
            var li = document.createElement("li");
            li.innerHTML = `
                <strong>${displayName}</strong> (Score: ${score} ${category.emoji})<br>
                Phone: <a href="tel:${lead.Phone || ''}">${lead.Phone || "N/A"}</a> | 
                Email: <a href="mailto:${lead.Email || ''}">${lead.Email || "N/A"}</a>
            `;
            hotList.appendChild(li);
        }
    });

    // Filter listener (same)
    document.getElementById("score-filter").addEventListener("change", function(e) {
        var filter = e.target.value;
        Array.from(tbody.rows).forEach(function(row) {
            row.style.display = (filter === "all" || row.className === filter) ? "" : "none";
        });
    });
}

// -----------------------------------------------------------------------
// 

// app/js/app.js - LeadPilot Home Page Dashboard (Final with Filter & Smart Tooltip)

ZOHO.embeddedApp.on("PageLoad", function (data) {
    const tbody = document.getElementById("leads-tbody");
    tbody.innerHTML = "<tr><td colspan='4' class='loading'>Loading leads...</td></tr>";

    var request = {
        Entity: "Leads",
        sort_order: "desc",
        sort_column: "Created_Time",
        per_page: 100,
        page: 1
    };

    ZOHO.CRM.API.getAllRecords(request)
        .then(function (response) {
            var leads = response.data || [];
            if (leads.length === 0) {
                tbody.innerHTML = "<tr><td colspan='4' class='loading'>No leads found.</td></tr>";
                return;
            }
            renderLeads(leads);
        })
        .catch(function (error) {
            console.error("Error fetching leads:", error);
            tbody.innerHTML = "<tr><td colspan='4' class='loading'>Error loading leads. Check console.</td></tr>";
        });
});

ZOHO.embeddedApp.init();

function renderLeads(leads) {
    const tbody = document.getElementById("leads-tbody");
    tbody.innerHTML = "";

    leads.forEach(function (lead) {
        const scoreObj = calculateScore(lead);
        const score = scoreObj.total;
        const priority = score >= 80 ? { class: "hot", emoji: "🔥", label: "Hot" }
            : score >= 60 ? { class: "warm", emoji: "🙂", label: "Warm" }
                : { class: "cold", emoji: "❄️", label: "Cold" };

        const displayName = lead.Lead_Name || lead.Full_Name || lead.Company || "Unnamed Lead";
        const company = lead.Company || "-";

        var row = document.createElement("tr");
        row.className = priority.class;
        row.innerHTML = `
            <td><a class="lead-name" data-id="${lead.id}">${displayName}</a></td>
            <td>${company}</td>
            <td class="score-cell">
                <div class="tooltip score" data-tooltip="${scoreObj.breakdown}">${score}/100</div>
            </td>
            <td><span class="priority">${priority.emoji} ${priority.label}</span></td>
        `;
        tbody.appendChild(row);

        // Auto flip tooltip if near right edge
        setTimeout(() => {
            const tooltip = row.querySelector('.tooltip');
            if (tooltip) {
                const rect = tooltip.getBoundingClientRect();
                if (rect.right > window.innerWidth - 50) {
                    tooltip.classList.add('flip');
                }
            }
        }, 100);

        // Auto flip tooltip only if score is near right edge of screen
        setTimeout(() => {
            const tooltip = row.querySelector('.tooltip');
            if (tooltip) {
                const rect = tooltip.getBoundingClientRect();
                if (rect.right + 380 > window.innerWidth) { // 380 = tooltip width + margin
                    tooltip.classList.add('flip');
                }
            }
        }, 100);
    });

    // Click to open lead detail
    document.querySelectorAll(".lead-name").forEach(function (link) {
        link.addEventListener("click", function (e) {
            e.preventDefault();
            const leadId = this.getAttribute("data-id");
            ZOHO.CRM.UI.Record.open({ Entity: "Leads", RecordID: leadId });
        });
    });

    // Filter by priority
    document.getElementById("priority-filter").addEventListener("change", function (e) {
        const filter = e.target.value;
        const rows = tbody.querySelectorAll("tr");

        rows.forEach(function (row) {
            if (filter === "all") {
                row.style.display = "";
            } else {
                row.style.display = row.classList.contains(filter) ? "" : "none";
            }
        });
    });
}



// 6-Factor Owner Scoring (Real-World)
function calculateScore(lead) {
    let score = 0;
    let breakdown = [];

    // 1. Company Fit (40 points)
    const employees = parseInt(lead.No_of_Employees || 0);
    const revenue = parseFloat((lead.Annual_Revenue || "0").toString().replace(/[^0-9.-]+/g, "")) || 0;
    const industry = (lead.Industry || "").trim();

    const highIndustries = ["ASP (Application Service Provider)", "Management ISV", "Non-management ISV", "MSP (Management Service Provider)", "Systems Integrator"];
    const medIndustries = ["Data/Telecom OEM", "Network Equipment (Enterprise)", "Optical Networking", "Storage Equipment", "Wireless Industry", "Service Provider"];
    const lowIndustries = ["Large Enterprise", "Small/Medium Enterprise", "ERP (Enterprise Resource Planning)"];

    let industryPoints = 0;
    if (highIndustries.includes(industry)) industryPoints = 10;
    else if (medIndustries.includes(industry)) industryPoints = 6;
    else if (lowIndustries.includes(industry)) industryPoints = 3;

    if (employees >= 500 && revenue >= 5000000) {
        score += 40 + industryPoints;
        breakdown.push(`Company Fit: +40 (Enterprise)\nIndustry Bonus: +${industryPoints}`);
    } else if (employees >= 200 && revenue >= 2000000) {
        score += 30 + industryPoints;
        breakdown.push(`Company Fit: +30 (Mid-Market)\nIndustry Bonus: +${industryPoints}`);
    } else if (employees >= 50) {
        score += 15 + industryPoints;
        breakdown.push(`Company Fit: +15 (Growing)\nIndustry Bonus: +${industryPoints}`);
    } else {
        breakdown.push(`Company Fit: +0 (Small)\nIndustry Bonus: +${industryPoints}`);
    }

    // 2. Buying Signal (25 points)
    const budget = (lead.Budget || "").trim();
    const engagement = (parseInt(lead.Email_Clicks || 0) + parseInt(lead.Website_Visits || 0));
    if (budget === "High" && engagement >= 10) {
        score += 25;
        breakdown.push("Buying Signal: +25 (Strong Intent)");
    } else if ((budget === "High" || budget === "Medium") && engagement >= 5) {
        score += 15;
        breakdown.push("Buying Signal: +15 (Good Intent)");
    } else {
        breakdown.push("Buying Signal: +0");
    }

    // 3. Decision Maker (15 points) - FIXED: Added trim(), expanded regex for CFO and full titles
    const title = (lead.Title || "").toLowerCase().trim();  // Trim spaces
    if (/ceo|cto|cio|cfo|chief|director|vp|head/i.test(title)) {
        score += 15;
        breakdown.push("Decision Maker: +15 (C-Level)");
    } else if (/manager|lead|senior/i.test(title)) {
        score += 8;
        breakdown.push("Decision Maker: +8 (Manager)");
    } else {
        breakdown.push("Decision Maker: +0");
    }

    // 4. Timing (10 points)
    const status = lead.Lead_Status || "";
    if (["Contacted", "Pre-Qualified"].includes(status)) {
        score += 10;
        breakdown.push("Timing: +10 (Active Now)");
    } else if (["Attempted to Contact", "Contact in Future"].includes(status)) {
        score += 5;
        breakdown.push("Timing: +5 (Soon)");
    } else {
        breakdown.push("Timing: +0");
    }

    // 5. Trust & Source (6 points)
    const source = lead.Lead_Source || "";
    if (["Employee Referral", "External Referral", "Partner", "Referral"].includes(source)) {
        score += 6;
        breakdown.push("Trust/Source: +6 (Referral)");
    } else if (!["Advertisement", "Cold Call", "Social Media"].includes(source)) {
        score += 3;
        breakdown.push("Trust/Source: +3 (Inbound)");
    } else {
        breakdown.push("Trust/Source: +0");
    }

    // 6. Geographic Fit (4 points)
    const country = (lead.Country || "").trim();
    if (["UAE", "USA", "United States"].includes(country)) {
        score += 4;
        breakdown.push("Geography: +4 (Prime)");
    } else if (country === "India") {
        score += 3;
        breakdown.push("Geography: +3 (Growing)");
    } else {
        breakdown.push("Geography: +0");
    }

    return {
        total: Math.min(Math.round(score), 100),
        breakdown: breakdown.join("\n")
    };
}

// ------------------------------------------------------------------------------------------