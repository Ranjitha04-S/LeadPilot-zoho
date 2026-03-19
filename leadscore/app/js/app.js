// app/js/app.js - LeadPilot Button Widget (Fixed for Correct Lead Every Time)

let currentLeadId = null;

// Get lead ID when popup opens
ZOHO.embeddedApp.on("PageLoad", function (data) {
    if (data && data.EntityId && data.EntityId.length > 0) {
        currentLeadId = data.EntityId[0];
        console.log("Lead ID loaded:", currentLeadId);
    } else {
        console.error("No Lead ID received");
    }
});

ZOHO.embeddedApp.init();

// Calculate on button click
document.getElementById("calculate-btn").addEventListener("click", function () {
    calculateAndDisplay();
});

// Also auto-calculate on open for better UX
ZOHO.embeddedApp.on("PageLoad", function () {
    setTimeout(calculateAndDisplay, 500); // Small delay to ensure ID is ready
});

function calculateAndDisplay() {
    const output = document.getElementById("score-output");
    output.innerHTML = "<p class='loading'>Calculating score...</p>";

    // Safety check
    if (!currentLeadId) {
        output.innerHTML = "<p style='color:#dc2626;text-align:center;'>Error: Could not identify lead. Refresh and try again.</p>";
        return;
    }

    ZOHO.CRM.API.getRecord({ Entity: "Leads", RecordID: currentLeadId })
        .then(function (response) {
            if (!response.data || response.data.length === 0) {
                output.innerHTML = "<p style='color:#dc2626;text-align:center;'>No data found for this lead.</p>";
                return;
            }

            const lead = response.data[0];
            const scoreObj = calculateScore(lead);
            const score = scoreObj.total;

            const priority = score >= 80 ? { class: "hot", label: "🔥 Hot – Pursue Now" }
                : score >= 60 ? { class: "warm", label: "🙂 Warm – Nurture" }
                    : { class: "cold", label: "❄️ Cold – Monitor" };

            output.innerHTML = `
            <div class="score-display">
                <div class="score-big ${priority.class}">${score}</div>
                <div class="label ${priority.class}">${priority.label}</div>
                <div class="progress"><div class="fill ${priority.class}" style="width: ${score}%"></div></div>
            </div>
            <div class="breakdown">
                <h3>Why this score?</h3>
                ${scoreObj.breakdown.split("\n").map(line => {
                const parts = line.split(": ");
                const value = parts[1] || "";
                const isPositive = value.includes("+") && !value.includes("+0");
                return `<div class="factor">
                        <span>${parts[0]}</span>
                        <span class="${isPositive ? 'positive' : ''}">${value}</span>
                    </div>`;
            }).join("")}
            </div>
        `;
        })
        .catch(function (error) {
            console.error("API Error:", error);
            output.innerHTML = "<p style='color:#dc2626;text-align:center;'>Failed to load data. Try again.</p>";
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