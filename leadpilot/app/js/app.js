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

    // 3. Decision Maker (15 points) - FIXED: Trim spaces, expanded regex for CFO, Chief, full titles like "Chief Financial Officer"
    // const title = (lead.Title || "").toLowerCase().trim();  // Trim extra spaces
    // if (/ceo|cto|cio|cfo|chief|director|vp|head/i.test(title)) {
    //     score += 15;
    //     breakdown.push("Decision Maker: +15 (C-Level)");
    // } else if (/manager|lead|senior/i.test(title)) {
    //     score += 8;
    //     breakdown.push("Decision Maker: +8 (Manager)");
    // } else {
    //     breakdown.push("Decision Maker: +0");
    // }

    // 3. Decision Maker (15 points) – Picklist based
    const leadRole = (lead.Lead_Role || "").trim();

    if (leadRole.startsWith("Decision Maker")) {
        score += 15;
        breakdown.push("Decision Maker: +15 (Decision Maker)");
    }
    else if (leadRole.startsWith("Influencer")) {
        score += 8;
        breakdown.push("Decision Maker: +8 (Influencer)");
    }
    else {
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