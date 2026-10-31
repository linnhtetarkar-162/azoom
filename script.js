// ---------- data (simulated database) ----------
const STATUSES = ["Reserved", "Rented", "Returned", "Inspected", "Paid"];
const NEXT_STEP = {
    Reserved: "Confirm car collected at office",
    Rented: "Mark car as returned at car park",
    Returned: "Save inspection result",
    Inspected: "Record final payment"
};
const DEPOSIT_RATE = 0.3;   // 30% deposit paid by credit card when booking

// The 3 AZoom locations. Each one is both an office (collect the car) and a car park (return the car).
// Put the 3 photos / maps in the Body/Locations folder with these file names.
const LOCATIONS = [
    { name: "AZoom Woodlands", image: "Body/Locations/Woodlands.png" },
    { name: "AZoom Orchard", image: "Body/Locations/Orchard.png" },
    { name: "AZoom Jurong West", image: "Body/Locations/Jurong_West.png" }
];

const OFFICES = LOCATIONS.map(l => l.name);
const CAR_PARKS = LOCATIONS.map(l => l.name);

// picture for a location; the dashed box with text shows until the image file is added
// the file extension in LOCATIONS is ignored: .jpg, .jpeg, .png and .webp are tried in turn
const IMAGE_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

function locationImage(name) {
    const loc = LOCATIONS.find(l => l.name === name);
    if (!loc) return `<div class="location_box"><span>Location image</span></div>`;
    const base = loc.image.replace(/\.\w+$/, "");   // path without the extension
    return `<div class="location_box"><span>${loc.name} (add ${base}.jpg or .png)</span><img src="${base}.${IMAGE_EXTENSIONS[0]}" alt="${loc.name}" data-base="${base}" data-try="0" onerror="nextImageExtension(this)" /></div>`;
}

// called when an image fails to load: try the next extension, or give up and show the dashed box
function nextImageExtension(img) {
    const n = Number(img.dataset.try) + 1;
    if (n < IMAGE_EXTENSIONS.length) {
        img.dataset.try = n;
        img.src = img.dataset.base + "." + IMAGE_EXTENSIONS[n];
    } else {
        img.remove();
    }
}

// cancellation policy: full deposit refund if cancelled this many days (or more) before pick-up,
// otherwise only part of the deposit is refunded
const FREE_CANCEL_DAYS = 2;
const LATE_CANCEL_REFUND = 0.5;

const defaultInvoices = [
    { id: "INV-1001", customer: "a.tan@gmail.com", car: "Mercedes Benz GLC250", rate: 250, days: 3, from: "20 Oct 2026", to: "23 Oct 2026", card: "4242", damage: 0, note: "No damage found.", status: "Paid" },
    { id: "INV-1002", customer: "jun.lim@gmail.com", car: "Nissan Qashqai", rate: 110, days: 2, from: "24 Oct 2026", to: "26 Oct 2026", card: "1881", damage: 180, note: "Scratch on rear bumper.", status: "Inspected" },
    { id: "INV-1003", customer: "priya.s@gmail.com", car: "Mazda CX-5", rate: 125, days: 4, from: "25 Oct 2026", to: "29 Oct 2026", card: "0005", damage: 0, note: "", status: "Returned" },
    { id: "INV-1004", customer: "wei.ng@gmail.com", car: "Volvo XC-60", rate: 230, days: 3, from: "28 Oct 2026", to: "31 Oct 2026", card: "7777", damage: 0, note: "", status: "Rented" },
    { id: "INV-1005", customer: "sara.k@gmail.com", car: "Kia Niro", rate: 105, days: 5, from: "1 Nov 2026", to: "6 Nov 2026", card: "3156", contract: { name: "Sara K", date: "29 Oct 2026" }, damage: 0, note: "", status: "Reserved" },
    { id: "INV-1006", customer: "daniel.c@gmail.com", car: "BMW X3", rate: 260, days: 2, from: "22 Oct 2026", to: "24 Oct 2026", card: "9012", damage: 320, note: "Cracked side mirror.", status: "Paid", emailedOn: "25 Oct 2026" },

    // hard-coded damaged cars (always shown in the admin "Damaged cars" list)
    { id: "INV-0901", customer: "li.mei@gmail.com", car: "Toyota Yaris Cross", rate: 95, days: 3, from: "26 Oct 2026", to: "29 Oct 2026", fromISO: "2026-10-26", office: OFFICES[0], park: CAR_PARKS[1], card: "2468", contract: { name: "Li Mei", date: "25 Oct 2026" }, damage: 260, note: "Dented front left door and broken tail light.", status: "Inspected" },
    { id: "INV-0902", customer: "ben.ong@gmail.com", car: "Skoda Kodiaq", rate: 160, days: 2, from: "24 Oct 2026", to: "26 Oct 2026", fromISO: "2026-10-24", office: OFFICES[1], park: CAR_PARKS[0], card: "1357", contract: { name: "Ben Ong", date: "23 Oct 2026" }, damage: 450, note: "Cracked windscreen from a stone chip.", status: "Inspected", emailedOn: "27 Oct 2026" },
    { id: "INV-0903", customer: "nur.aisyah@gmail.com", car: "Hyundai Kona", rate: 100, days: 2, from: "20 Oct 2026", to: "22 Oct 2026", fromISO: "2026-10-20", office: OFFICES[2], park: CAR_PARKS[2], card: "8642", contract: { name: "Nur Aisyah", date: "19 Oct 2026" }, damage: 120, note: "Stain on rear seat upholstery.", status: "Paid", emailedOn: "23 Oct 2026" },

    // hard-coded bookings waiting for collection (shown in the admin "Cars to collect" list)
    { id: "INV-0904", customer: "marcus.l@gmail.com", car: "Mazda CX-9", rate: 170, days: 3, from: "31 Oct 2026", to: "3 Nov 2026", fromISO: "2026-10-31", office: OFFICES[1], card: "5566", contract: { name: "Marcus Lee", date: "29 Oct 2026" }, damage: 0, note: "", status: "Reserved" },
    { id: "INV-0905", customer: "rachel.t@gmail.com", car: "Mercedes Benz GLB180", rate: 210, days: 2, from: "31 Oct 2026", to: "2 Nov 2026", fromISO: "2026-10-31", office: OFFICES[2], card: "9911", contract: { name: "Rachel Tan", date: "29 Oct 2026" }, damage: 0, note: "", status: "Reserved" }
];

// load saved invoices, then make sure every hard-coded invoice above is always present
// (so the damaged cars show up even if the browser already has older saved data)
let invoices = JSON.parse(localStorage.getItem("azoomInvoices")) || [];
defaultInvoices.forEach(d => {
    const saved = invoices.find(i => i.id === d.id);
    if (!saved) invoices.push(JSON.parse(JSON.stringify(d)));
    else {   // update older saved copies of the hard-coded invoices
        if (d.contract && !saved.contract) saved.contract = d.contract;
        if (d.office) saved.office = d.office;
        if (d.park) saved.park = d.park;
    }
});
saveInvoices();
let pendingCar = null;   // car the customer clicked "Reserve" on before logging in

// car list is read from the Our Fleet section of the page (name, category, daily rate, image)
// and a Reserve button is added to every car card
const CARS = [];
document.querySelectorAll(".Fleet_type_container").forEach(group => {
    const category = group.querySelector("h2").textContent.trim();
    group.querySelectorAll(".Fleet").forEach(card => {
        CARS.push({
            name: card.querySelector("h3").textContent.trim(),
            category: category,
            rate: parseInt(card.querySelector("p").textContent.replace(/\D/g, ""), 10),
            img: card.querySelector("img").getAttribute("src")
        });
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "small_btn reserve_btn";
        btn.textContent = "Reserve";
        btn.dataset.car = CARS.length - 1;
        card.appendChild(btn);
    });
});

// ---------- elements ----------
const modal = document.getElementById("authModal");
const authLink = document.getElementById("authLink");
const authLabel = document.getElementById("authLabel");
const loginForm = document.getElementById("loginForm");
const authMsg = document.getElementById("authMsg");
const adminPanel = document.getElementById("adminPanel");
const invoiceModal = document.getElementById("invoiceModal");
const invoiceBody = document.getElementById("invoiceBody");
const statusFilter = document.getElementById("statusFilter");
const emailModal = document.getElementById("emailModal");
const emailBody = document.getElementById("emailBody");
const myBookings = document.getElementById("myBookings");
const bookingsLink = document.getElementById("bookingsLink");
const bookingList = document.getElementById("bookingList");
const bookingModal = document.getElementById("bookingModal");
const bookingBody = document.getElementById("bookingBody");

// ---------- login ----------
function getCurrentUser() { return localStorage.getItem("azoomCurrentUser"); }
function isAdmin() { return getCurrentUser() === ADMIN_USER; }

function showError(text) {
    authMsg.textContent = text;
    authMsg.className = "auth_msg error";
}

function openModal(msg) {
    authMsg.textContent = typeof msg === "string" ? msg : "";
    authMsg.className = "auth_msg";
    modal.classList.add("open");
}
function closeModal() { modal.classList.remove("open"); }

// shows the admin panel, the customer's bookings or the normal site depending on who is logged in
function updatePage() {
    const user = getCurrentUser();
    const customer = user && !isAdmin();
    authLabel.textContent = user ? "Hi, " + user.split("@")[0] + " (Logout)" : "Login";
    adminPanel.hidden = !isAdmin();
    document.querySelector("main").hidden = isAdmin();
    document.querySelector("footer").hidden = isAdmin();
    myBookings.hidden = !customer;
    bookingsLink.hidden = !customer;
    if (isAdmin()) renderAdmin();
    if (customer) renderCustomer();
    window.scrollTo(0, 0);
}

// ---------- invoices ----------
function money(n) { return "S$" + n.toLocaleString("en-SG"); }

function bill(i) {
    const rental = i.rate * i.days;
    const deposit = Math.round(rental * DEPOSIT_RATE);   // 30% deposit paid when booking
    if (i.status === "Cancelled") {   // only the part of the deposit AZoom keeps is charged
        return { rental, deposit, total: deposit - (i.refund || 0), balance: 0 };
    }
    const total = rental + i.damage;
    const balance = i.status === "Paid" ? 0 : total - deposit;
    return { rental, deposit, total, balance };
}

function saveInvoices() { localStorage.setItem("azoomInvoices", JSON.stringify(invoices)); }

function renderAdmin() {
    let outstanding = 0, collected = 0;
    invoices.forEach(i => {
        const b = bill(i);
        outstanding += b.balance;
        collected += (i.status === "Paid" || i.status === "Cancelled") ? b.total : b.deposit;
    });
    const waiting = invoices.filter(i => i.status === "Returned").length;

    document.getElementById("adminStats").innerHTML =
        `<div class="stat"><span>Total invoices</span><strong>${invoices.length}</strong></div>
         <div class="stat"><span>Awaiting collection</span><strong>${invoices.filter(i => i.status === "Reserved").length}</strong></div>
         <div class="stat"><span>Awaiting inspection</span><strong>${waiting}</strong></div>
         <div class="stat"><span>Damaged cars</span><strong>${invoices.filter(i => i.damage > 0 && i.status !== "Cancelled").length}</strong></div>
         <div class="stat"><span>Collected</span><strong>${money(collected)}</strong></div>
         <div class="stat"><span>Outstanding</span><strong>${money(outstanding)}</strong></div>`;

    // cars waiting to be collected at the office
    const toCollect = invoices.filter(i => i.status === "Reserved");
    document.getElementById("collectRows").innerHTML = toCollect.length
        ? toCollect.map(i => `<tr>
                <td>${i.id}</td>
                <td>${i.customer}</td>
                <td>${i.car}</td>
                <td>${i.from}</td>
                <td>${i.office || "-"}</td>
                <td>${contractSigned(i) ? "Signed" : "Not signed"}</td>
                <td><button class="small_btn" data-id="${i.id}">${contractSigned(i) ? "Hand over car" : "Review"}</button></td>
            </tr>`).join("")
        : `<tr><td colspan="7" class="empty_row">No cars waiting for collection.</td></tr>`;

    // cars with damage found at inspection
    const damaged = invoices.filter(i => i.damage > 0 && i.status !== "Cancelled");
    document.getElementById("damageRows").innerHTML = damaged.length
        ? damaged.map(i => `<tr>
                <td>${i.id}</td>
                <td>${i.customer}</td>
                <td>${i.car}</td>
                <td>${i.note || "Damage found."}</td>
                <td>${money(i.damage)}</td>
                <td><span class="badge ${i.status}">${i.status}</span></td>
                <td>${i.emailedOn ? "Emailed " + i.emailedOn : "Not emailed"}</td>
                <td>${i.emailedOn
                    ? `<button class="small_btn" disabled>Email sent</button>`
                    : `<button class="small_btn" data-email="${i.id}">Email customer</button>`} <button class="small_btn" data-id="${i.id}">Review</button></td>
            </tr>`).join("")
        : `<tr><td colspan="8" class="empty_row">No damaged cars.</td></tr>`;

    const chosen = statusFilter.value;
    document.getElementById("invoiceRows").innerHTML = invoices
        .filter(i => chosen === "All" || i.status === chosen)
        .map(i => {
            const b = bill(i);
            return `<tr>
                <td>${i.id}</td>
                <td>${i.customer}</td>
                <td>${i.car}</td>
                <td>${i.from} - ${i.to}</td>
                <td>${money(b.total)}</td>
                <td>${money(b.balance)}</td>
                <td><span class="badge ${i.status}">${i.status}</span></td>
                <td><button class="small_btn" data-id="${i.id}">Review</button></td>
            </tr>`;
        }).join("");
}

function openInvoice(id) {
    const i = invoices.find(x => x.id === id);
    const b = bill(i);
    const stage = STATUSES.indexOf(i.status);
    const canInspect = i.status === "Returned";
    const cancelled = i.status === "Cancelled";
    const needsContract = i.status === "Reserved" && !contractSigned(i);   // car cannot be handed over yet

    const details = `<p>${i.customer}<br>${i.car} (${money(i.rate)}/day)<br>${i.from} - ${i.to} (${i.days} days)<br>Card on file: **** ${i.card}${i.office ? "<br>Pick-up: " + i.office : ""}${i.park ? "<br>Returned at: " + i.park : ""}</p>`;

    if (cancelled) {
        invoiceBody.innerHTML = `
            <h2>${i.id}</h2>
            ${details}
            <div class="steps"><span class="step cancelled">Cancelled</span></div>
            <div class="bill_line"><span>Deposit paid (30%)</span><span>${money(b.deposit)}</span></div>
            <div class="bill_line"><span>Refunded to customer</span><span>- ${money(i.refund || 0)}</span></div>
            <div class="bill_line total"><span>Kept by AZoom</span><span>${money(b.total)}</span></div>
            <p class="invoice_note">Booking cancelled by customer on ${i.cancelledOn || "-"}.</p>`;
        invoiceModal.classList.add("open");
        return;
    }

    invoiceBody.innerHTML = `
        <h2>${i.id}</h2>
        ${details}
        <div class="steps">${STATUSES.map((s, n) => `<span class="step ${n <= stage ? "done" : ""}">${s}</span>`).join("")}</div>
        <p class="invoice_note">Rental contract: ${contractSigned(i) ? "Signed" + (i.contract ? " by " + i.contract.name + " on " + i.contract.date : "") : "Not signed yet"}</p>

        <div class="bill_line"><span>Rental (${i.days} x ${money(i.rate)})</span><span>${money(b.rental)}</span></div>
        <div class="bill_line"><span>Damage charges</span><span>${money(i.damage)}</span></div>
        <div class="bill_line"><span>Total bill</span><span>${money(b.total)}</span></div>
        <div class="bill_line"><span>Deposit paid by credit card (30%)</span><span>- ${money(b.deposit)}</span></div>
        <div class="bill_line total"><span>Balance due</span><span>${money(b.balance)}</span></div>

        ${canInspect ? `
            <label for="damageInput">Damage charge found (S$)</label>
            <input type="number" id="damageInput" min="0" value="${i.damage}" />
            <label for="noteInput">Inspection note</label>
            <input type="text" id="noteInput" placeholder="e.g. No damage found" value="${i.note}" />`
            : `<p class="invoice_note">${i.note ? "Inspection note: " + i.note : "Not inspected yet."}</p>`}

        ${i.damage > 0 ? (i.emailedOn
            ? `<p class="invoice_note">Damage email already sent on ${i.emailedOn}.</p>`
            : `<button type="button" class="small_btn" data-email="${i.id}">Email customer about damage</button>`) : ""}
        ${needsContract
            ? `<p class="invoice_note">The customer must sign the rental contract before the car can be handed over.</p>`
            : NEXT_STEP[i.status] ? `<button class="auth_submit" id="advanceBtn" data-id="${i.id}">${NEXT_STEP[i.status]}</button>` : ""}`;

    invoiceModal.classList.add("open");
}

function advanceInvoice(id) {
    const i = invoices.find(x => x.id === id);
    if (!NEXT_STEP[i.status] || (i.status === "Reserved" && !contractSigned(i))) return;
    if (i.status === "Returned") {
        i.damage = Math.max(0, Number(document.getElementById("damageInput").value) || 0);
        i.note = document.getElementById("noteInput").value.trim() || (i.damage ? "Damage found." : "No damage found.");
    }
    i.status = STATUSES[STATUSES.indexOf(i.status) + 1];
    saveInvoices();
    renderAdmin();
    openInvoice(id);
}

// ---------- admin: email the customer about damage ----------
function emailDraft(i) {
    const b = bill(i);
    const name = i.customer.split("@")[0];
    return {
        subject: "AZOOM damage charge for " + i.id + " (" + i.car + ")",
        body: "Dear " + name + ",\n\n"
            + "Thank you for renting the " + i.car + " (" + i.from + " - " + i.to + ").\n\n"
            + "During our inspection after the car was returned, we found damage: " + (i.note || "damage to the vehicle") + "\n\n"
            + "Damage charge: " + money(i.damage) + "\n"
            + "Total bill: " + money(b.total) + "\n"
            + (i.status === "Paid"
                ? "Your final bill, including this charge, has been paid in full.\n"
                : "Balance due after your deposit: " + money(b.balance) + "\n")
            + "\nPlease log in to AZOOM and open My Bookings to see your final bill"
            + (i.status === "Paid" ? "." : " and pay it.") + "\n\n"
            + "If you have any questions, reply to this email.\n\n"
            + "Regards,\nAZOOM Car Rental"
    };
}

function openEmail(id) {
    const i = invoices.find(x => x.id === id);
    if (i.emailedOn) return;   // the damage email can only be sent once
    const draft = emailDraft(i);
    emailBody.innerHTML = `
        <h2>Email customer</h2>
        <label for="emailTo">To</label>
        <input type="text" id="emailTo" readonly />
        <label for="emailSubject">Subject</label>
        <input type="text" id="emailSubject" />
        <label for="emailText">Message</label>
        <textarea id="emailText"></textarea>
        <div class="email_actions">
            <button type="button" class="auth_submit" id="sendEmail" data-id="${i.id}">Send email</button>
        </div>`;
    document.getElementById("emailTo").value = i.customer;   // set by script so special characters stay safe
    document.getElementById("emailSubject").value = draft.subject;
    document.getElementById("emailText").value = draft.body;
    emailModal.classList.add("open");
}

function sendEmail(id) {
    const i = invoices.find(x => x.id === id);
    if (i.emailedOn) return;   // already sent, ignore a second click
    i.emailedOn = formatDate(new Date());   // email sending is simulated (no backend)
    saveInvoices();
    renderAdmin();
    emailBody.innerHTML = `
        <div class="success_box">
            <i class="fa-solid fa-envelope-circle-check"></i>
            <h2>Email sent</h2>
            <p>Damage notice for ${i.id} was sent to<br><strong>${i.customer}</strong></p>
            <button type="button" class="auth_submit" id="emailDone">Done</button>
        </div>`;
}

// ---------- customer: helpers ----------
const val = id => document.getElementById(id).value;

function getMyInvoices() { return invoices.filter(i => i.customer === getCurrentUser()); }

function nextInvoiceId() {
    const numbers = invoices.map(i => parseInt(i.id.replace(/\D/g, ""), 10));
    return "INV-" + (Math.max(1000, ...numbers) + 1);
}

function formatDate(d) { return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }); }

function toInputDate(d) {   // Date -> "yyyy-mm-dd" for <input type="date">
    return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }

function rentalDays(from, to) {
    return Math.round((new Date(to + "T00:00") - new Date(from + "T00:00")) / 86400000);
}

function validExpiry(text) {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(text)) return false;
    const month = Number(text.slice(0, 2)), year = 2000 + Number(text.slice(3));
    return new Date(year, month, 1) > new Date();   // card valid until the end of its expiry month
}

// a contract counts as signed if the customer signed it, or the car was already handed over (sample data)
function contractSigned(i) { return !!i.contract || STATUSES.indexOf(i.status) >= STATUSES.indexOf("Rented"); }

function pickupDate(i) { return i.fromISO ? new Date(i.fromISO + "T00:00") : new Date(i.from); }

// deposit refund if the customer drops the booking now
function cancelRefund(i) {
    const deposit = bill(i).deposit;
    const daysLeft = (pickupDate(i) - new Date()) / 86400000;
    return daysLeft >= FREE_CANCEL_DAYS ? deposit : Math.round(deposit * LATE_CANCEL_REFUND);
}

function openBookingModal() { bookingModal.classList.add("open"); }
function closeBookingModal() { bookingModal.classList.remove("open"); }

// ---------- customer: 1. reserve a car with a credit card ----------
function openReserve(carIndex) {
    if (!getCurrentUser()) {
        pendingCar = carIndex;   // continue the reservation right after login
        openModal("Please log in to reserve a car.");
        return;
    }

    const start = addDays(new Date(), 1);
    bookingBody.innerHTML = `
        <h2>Reserve a car</h2>
        <form id="reserveForm" novalidate>
            <label for="resCar">Car</label>
            <select id="resCar">
                ${CARS.map((c, n) => `<option value="${n}" ${n === carIndex ? "selected" : ""}>${c.name} (${c.category}) - ${money(c.rate)}/day</option>`).join("")}
            </select>

            <div class="form_row">
                <div>
                    <label for="resFrom">Pick-up date</label>
                    <input type="date" id="resFrom" min="${toInputDate(new Date())}" value="${toInputDate(start)}" />
                </div>
                <div>
                    <label for="resTo">Return date</label>
                    <input type="date" id="resTo" min="${toInputDate(start)}" value="${toInputDate(addDays(start, 2))}" />
                </div>
            </div>

            <label for="resOffice">Pick-up location</label>
            <select id="resOffice">${OFFICES.map(o => `<option>${o}</option>`).join("")}</select>
            <div id="officeImg">${locationImage(OFFICES[0])}</div>

            <div class="summary_box" id="resSummary"></div>

            <h3>Rental contract (sign before you pay)</h3>
            <div id="resContract"></div>
            <label class="check_label"><input type="checkbox" id="contractAgree" /> I have read and agree to the terms above.</label>
            <label for="contractName">Type your full name to sign the contract</label>
            <input type="text" id="contractName" autocomplete="name" />

            <h3>Credit card (30% deposit)</h3>
            <label for="cardName">Name on card</label>
            <input type="text" id="cardName" autocomplete="cc-name" />
            <label for="cardNumber">Card number</label>
            <input type="text" id="cardNumber" inputmode="numeric" placeholder="1234 5678 9012 3456" maxlength="19" autocomplete="cc-number" />
            <div class="form_row">
                <div>
                    <label for="cardExpiry">Expiry (MM/YY)</label>
                    <input type="text" id="cardExpiry" placeholder="MM/YY" maxlength="5" autocomplete="cc-exp" />
                </div>
                <div>
                    <label for="cardCvv">CVV</label>
                    <input type="password" id="cardCvv" inputmode="numeric" maxlength="3" autocomplete="cc-csc" />
                </div>
            </div>

            <p class="form_error" id="resError"></p>
            <button type="submit" class="auth_submit">Pay deposit &amp; reserve</button>
        </form>`;

    updateReserveSummary();
    openBookingModal();
}

// live price summary while the customer picks car and dates
function updateReserveSummary() {
    const car = CARS[Number(val("resCar"))];
    const days = val("resFrom") && val("resTo") ? rentalDays(val("resFrom"), val("resTo")) : 0;
    const box = document.getElementById("resSummary");
    const contractBox = document.getElementById("resContract");

    if (days < 1) {
        box.innerHTML = `<p class="invoice_note">Return date must be after the pick-up date.</p>`;
        contractBox.innerHTML = `<p class="invoice_note">Choose valid dates to see your rental contract.</p>`;
        return;
    }
    const rental = car.rate * days;

    // the contract updates with the chosen car, dates and office
    contractBox.innerHTML = contractTerms({
        id: nextInvoiceId(), customer: getCurrentUser(), car: car.name, rate: car.rate, days: days,
        from: formatDate(new Date(val("resFrom") + "T00:00")), to: formatDate(new Date(val("resTo") + "T00:00")),
        office: val("resOffice"), card: "", damage: 0, status: "Reserved"
    });
    box.innerHTML = `
        <div class="bill_line"><span>Rental (${days} x ${money(car.rate)})</span><span>${money(rental)}</span></div>
        <div class="bill_line total"><span>Deposit due now (30%)</span><span>${money(Math.round(rental * DEPOSIT_RATE))}</span></div>
        <p class="invoice_note">Balance of ${money(rental - Math.round(rental * DEPOSIT_RATE))} (plus any damage charges) is paid after your car is inspected.</p>`;
}

function submitReserve() {
    const car = CARS[Number(val("resCar"))];
    const from = val("resFrom"), to = val("resTo");
    const days = from && to ? rentalDays(from, to) : 0;
    const name = val("cardName").trim();
    const number = val("cardNumber").replace(/\s/g, "");
    const today = new Date(toInputDate(new Date()) + "T00:00");

    let error = "";
    if (!from || !to || days < 1) error = "Return date must be after the pick-up date.";
    else if (new Date(from + "T00:00") < today) error = "Pick-up date cannot be in the past.";
    else if (!document.getElementById("contractAgree").checked || val("contractName").trim().length < 2) error = "Please read the rental contract, tick the box and type your full name to sign it before reserving.";
    else if (name.length < 2) error = "Please enter the name on your card.";
    else if (!/^\d{16}$/.test(number)) error = "Card number must be 16 digits.";
    else if (!validExpiry(val("cardExpiry").trim())) error = "Enter a valid expiry date as MM/YY.";
    else if (!/^\d{3}$/.test(val("cardCvv"))) error = "CVV must be 3 digits.";

    if (error) {
        document.getElementById("resError").textContent = error;
        return;
    }

    const invoice = {
        id: nextInvoiceId(),
        customer: getCurrentUser(),
        car: car.name,
        rate: car.rate,
        days: days,
        from: formatDate(new Date(from + "T00:00")),
        to: formatDate(new Date(to + "T00:00")),
        fromISO: from,
        office: val("resOffice"),
        contract: { name: val("contractName").trim(), date: formatDate(new Date()) },   // signed before the booking is made
        card: number.slice(-4),
        damage: 0,
        note: "",
        status: "Reserved"
    };
    invoices.push(invoice);
    saveInvoices();
    renderCustomer();

    const b = bill(invoice);
    bookingBody.innerHTML = `
        <div class="success_box">
            <i class="fa-solid fa-circle-check"></i>
            <h2>Reservation confirmed</h2>
            <p>Reservation ID: <strong>${invoice.id}</strong></p>
            <p>${invoice.car}<br>${invoice.from} - ${invoice.to} (${invoice.days} days)</p>
            <div class="bill_line"><span>Deposit charged to card **** ${invoice.card}</span><span>${money(b.deposit)}</span></div>
            <p>Collect your car at<br><strong>${invoice.office}</strong><br>on your pick-up date. Please bring your driving licence and show your reservation ID to our staff.</p>
            <p>Your rental contract is signed. You can view it, or cancel the booking, in My Bookings.</p>
            <button type="button" class="auth_submit" id="viewBookingsBtn">View my bookings</button>
        </div>`;
}

// ---------- customer: My Bookings panel ----------
function bookingCard(i) {
    const b = bill(i);
    const stage = STATUSES.indexOf(i.status);
    const inspected = stage >= STATUSES.indexOf("Inspected");
    let msg = "", action = "";

    const where = i.office ? i.office : "the AZoom Car Rental office";
    const cancelled = i.status === "Cancelled";

    if (cancelled) {
        msg = `Booking cancelled${i.cancelledOn ? " on " + i.cancelledOn : ""}. ${money(i.refund || 0)} of your deposit was refunded to card **** ${i.card}.`;
    } else if (i.status === "Reserved") {
        msg = `Your ${money(b.deposit)} deposit is paid and your rental contract is signed. Collect your car at ${where} on ${i.from}. Our staff will confirm the handover.`;
        if (i.contract) action += `<button type="button" class="small_btn" data-action="contract" data-id="${i.id}">View contract</button> `;
        action += `<button type="button" class="small_btn danger_btn" data-action="cancel" data-id="${i.id}">Cancel booking</button>`;
    } else if (i.status === "Rented") {
        msg = `Enjoy your trip! Please return the car at one of our designated car parks by ${i.to}.`;
        action = `<button type="button" class="small_btn" data-action="return" data-id="${i.id}">Return car</button>`;
        if (i.contract) action += ` <button type="button" class="small_btn" data-action="contract" data-id="${i.id}">View contract</button>`;
    } else if (i.status === "Returned") {
        msg = `Car returned${i.park ? " at " + i.park : ""}. Our staff are inspecting it for damage. Your final bill will appear here once done.`;
    } else if (i.status === "Inspected") {
        msg = `Inspection complete: ${i.note || "No damage found."} Please pay your final bill.`;
        action = `<button type="button" class="small_btn" data-action="pay" data-id="${i.id}">Pay final bill (${money(b.balance)})</button>`;
    } else {
        msg = "Paid in full. Thank you for renting with AZOOM!";
    }

    return `
        <article class="booking_card">
            <div class="booking_head">
                <h3>${i.car}</h3>
                <span class="badge ${i.status}">${i.status}</span>
            </div>
            <p class="booking_meta">${i.id} | ${i.from} - ${i.to} (${i.days} days)</p>
            <div class="steps">${cancelled ? `<span class="step cancelled">Cancelled</span>` : STATUSES.map((s, n) => `<span class="step ${n <= stage ? "done" : ""}">${s}</span>`).join("")}</div>
            ${i.office ? `<p class="booking_meta">Pick-up: ${i.office}</p>` : ""}

            ${cancelled ? `
            <div class="bill_line"><span>Deposit paid (30%)</span><span>${money(b.deposit)}</span></div>
            <div class="bill_line total"><span>Refunded</span><span>${money(i.refund || 0)}</span></div>` : `
            <div class="bill_line"><span>Rental (${i.days} x ${money(i.rate)})</span><span>${money(b.rental)}</span></div>
            ${inspected ? `<div class="bill_line"><span>Damage charges</span><span>${money(i.damage)}</span></div>` : ""}
            <div class="bill_line"><span>Deposit paid (30%)</span><span>- ${money(b.deposit)}</span></div>
            <div class="bill_line total"><span>${inspected ? "Balance due" : "Balance (before any damage)"}</span><span>${money(b.balance)}</span></div>`}

            <p class="booking_msg">${msg}</p>
            ${action}
        </article>`;
}

function renderCustomer() {
    const mine = getMyInvoices();
    bookingList.innerHTML = mine.length
        ? mine.slice().reverse().map(bookingCard).join("")
        : `<p class="empty_msg">You have no bookings yet. Choose a car from <a href="#Our_Fleet">Our Fleet</a> to reserve one.</p>`;
}

// ---------- customer: rental contract (signed in the reservation form, before the booking is made) ----------
function contractTerms(i) {
    const b = bill(i);
    return `
        <div class="contract_box">
            <h3>AZOOM Car Rental Agreement</h3>
            <p><strong>Contract no.:</strong> ${i.id}<br>
               <strong>Renter:</strong> ${i.customer}<br>
               <strong>Car:</strong> ${i.car}<br>
               <strong>Rental period:</strong> ${i.from} - ${i.to} (${i.days} days)<br>
               <strong>Collection point:</strong> ${i.office || "AZoom Car Rental office"}</p>
            <ol>
                <li><strong>Charges.</strong> The daily rate is ${money(i.rate)}. A 30% deposit (${money(b.deposit)}) is charged to ${i.card ? "the card ending " + i.card : "your credit card"} when you reserve. The remaining rental and any damage charges are paid in the final bill after inspection.</li>
                <li><strong>Driver.</strong> The renter must hold a valid driving licence and is the only person allowed to drive the car. Sub-letting is not allowed.</li>
                <li><strong>Return.</strong> The car must be returned, locked, at one of the designated car parks by ${i.to}.</li>
                <li><strong>Inspection and damage.</strong> An AZoom employee inspects the car after return. The renter pays for any damage found during the rental period, and the amount is added to the final bill.</li>
                <li><strong>Cancellation.</strong> A booking can be cancelled before collection. The full deposit is refunded if cancelled ${FREE_CANCEL_DAYS} or more days before pick-up, otherwise ${Math.round(LATE_CANCEL_REFUND * 100)}% is refunded.</li>
            </ol>
        </div>`;
}

function openContract(id) {
    const i = invoices.find(x => x.id === id);
    // the contract is signed while reserving, so here it is only shown read-only
    bookingBody.innerHTML = `
        <h2>Rental contract</h2>
        ${contractTerms(i)}
        <p class="invoice_note">Signed by <strong>${i.contract.name}</strong> on ${i.contract.date}.</p>
        <button type="button" class="auth_submit" id="doneBtn">Close</button>`;
    openBookingModal();
}

// ---------- customer: drop (cancel) a booking before collection ----------
function openCancel(id) {
    const i = invoices.find(x => x.id === id);
    const b = bill(i);
    const refund = cancelRefund(i);
    bookingBody.innerHTML = `
        <h2>Cancel booking?</h2>
        <p class="invoice_note">${i.car} | ${i.id}<br>${i.from} - ${i.to} (${i.days} days)</p>
        <div class="bill_line"><span>Deposit paid (30%)</span><span>${money(b.deposit)}</span></div>
        <div class="bill_line total"><span>Refund to card **** ${i.card}</span><span>${money(refund)}</span></div>
        <p class="invoice_note">${refund === b.deposit
            ? "You are cancelling " + FREE_CANCEL_DAYS + " or more days before pick-up, so the full deposit is refunded."
            : "You are cancelling less than " + FREE_CANCEL_DAYS + " days before pick-up, so only " + Math.round(LATE_CANCEL_REFUND * 100) + "% of the deposit is refunded."}</p>
        <button type="button" class="auth_submit danger_submit" id="confirmCancel" data-id="${i.id}">Yes, cancel my booking</button>
        <button type="button" class="auth_submit" id="doneBtn">Keep my booking</button>`;
    openBookingModal();
}

function confirmCancel(id) {
    const i = invoices.find(x => x.id === id);
    if (i.status !== "Reserved") return;   // cannot cancel once the car has been collected
    i.refund = cancelRefund(i);
    i.cancelledOn = formatDate(new Date());
    i.status = "Cancelled";
    saveInvoices();
    renderCustomer();
    bookingBody.innerHTML = `
        <div class="success_box">
            <i class="fa-solid fa-circle-check"></i>
            <h2>Booking cancelled</h2>
            <p>${i.id} | ${i.car}</p>
            <div class="bill_line total"><span>Refunded to card **** ${i.card}</span><span>${money(i.refund)}</span></div>
            <button type="button" class="auth_submit" id="doneBtn">Done</button>
        </div>`;
}

// ---------- customer: 3. return the car at a designated car park ----------
function openReturn(id) {
    const i = invoices.find(x => x.id === id);
    bookingBody.innerHTML = `
        <h2>Return your car</h2>
        <p class="invoice_note">${i.car} | ${i.id}</p>
        <label for="parkSelect">Designated car park</label>
        <select id="parkSelect">${CAR_PARKS.map(p => `<option>${p}</option>`).join("")}</select>
        <div id="parkImg">${locationImage(CAR_PARKS[0])}</div>
        <p class="invoice_note">Park the car, lock it and confirm below. Our staff will then inspect it for damage.</p>
        <button type="button" class="auth_submit" id="confirmReturn" data-id="${i.id}">Confirm car returned</button>`;
    openBookingModal();
}

function confirmReturn(id) {
    const i = invoices.find(x => x.id === id);
    i.park = val("parkSelect");
    i.status = "Returned";
    saveInvoices();
    renderCustomer();
    bookingBody.innerHTML = `
        <div class="success_box">
            <i class="fa-solid fa-circle-check"></i>
            <h2>Car returned</h2>
            <p>${i.car} was returned at<br><strong>${i.park}</strong></p>
            <p>An AZoom employee will inspect it shortly. Your final bill will be ready in My Bookings after the inspection.</p>
            <button type="button" class="auth_submit" id="doneBtn">Done</button>
        </div>`;
}

// ---------- customer: 5. pay the final bill ----------
function openPay(id) {
    const i = invoices.find(x => x.id === id);
    const b = bill(i);
    bookingBody.innerHTML = `
        <h2>Final bill</h2>
        <p class="invoice_note">${i.car} | ${i.id}<br>${i.from} - ${i.to} (${i.days} days)</p>
        <div class="bill_line"><span>Rental (${i.days} x ${money(i.rate)})</span><span>${money(b.rental)}</span></div>
        <div class="bill_line"><span>Damage charges</span><span>${money(i.damage)}</span></div>
        <div class="bill_line"><span>Total bill</span><span>${money(b.total)}</span></div>
        <div class="bill_line"><span>Deposit already paid (30%)</span><span>- ${money(b.deposit)}</span></div>
        <div class="bill_line total"><span>Balance to pay</span><span>${money(b.balance)}</span></div>
        <p class="invoice_note">${i.note ? "Inspection note: " + i.note : ""}</p>

        <h3>Pay with card **** ${i.card}</h3>
        <label for="payCvv">CVV</label>
        <input type="password" id="payCvv" inputmode="numeric" maxlength="3" />
        <p class="form_error" id="payError"></p>
        <button type="button" class="auth_submit" id="confirmPay" data-id="${i.id}">Pay ${money(b.balance)}</button>`;
    openBookingModal();
}

function confirmPay(id) {
    if (!/^\d{3}$/.test(val("payCvv"))) {
        document.getElementById("payError").textContent = "CVV must be 3 digits.";
        return;
    }
    const i = invoices.find(x => x.id === id);
    const b = bill(i);
    i.status = "Paid";
    saveInvoices();
    renderCustomer();
    bookingBody.innerHTML = `
        <div class="success_box">
            <i class="fa-solid fa-circle-check"></i>
            <h2>Payment received</h2>
            <p>${i.id} | ${i.car}</p>
            <div class="bill_line"><span>Paid with card **** ${i.card}</span><span>${money(b.balance)}</span></div>
            <div class="bill_line total"><span>Total rental cost</span><span>${money(b.total)}</span></div>
            <p>Thank you for renting with AZOOM!</p>
            <button type="button" class="auth_submit" id="doneBtn">Done</button>
        </div>`;
}

// ---------- events ----------
authLink.addEventListener("click", function (e) {
    e.preventDefault();
    if (getCurrentUser()) {
        localStorage.removeItem("azoomCurrentUser");   // logout
        updatePage();
    } else {
        openModal();
    }
});

function goToFleet() { goToSection(document.getElementById("Our_Fleet")); }

document.getElementById("heroBtn").addEventListener("click", function () {
    if (getCurrentUser()) goToFleet(); else openModal();
});
document.querySelector(".car_rent_btn").addEventListener("click", goToFleet);
document.getElementById("closeModal").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });

loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;
    const email = user.toLowerCase();
    let loggedInAs = null;

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        loggedInAs = ADMIN_USER;
    } else if (/^[^\s@]+@gmail\.com$/.test(email) && pass.length >= 6) {
        loggedInAs = email;   // any gmail address can log in as a customer
    }

    if (!loggedInAs) return showError("Use an email ending in @gmail.com and a password of at least 6 characters.");

    localStorage.setItem("azoomCurrentUser", loggedInAs);
    loginForm.reset();
    closeModal();
    updatePage();

    // the customer clicked Reserve before logging in, so carry on with that reservation
    if (pendingCar !== null && !isAdmin()) openReserve(pendingCar);
    pendingCar = null;
});

statusFilter.innerHTML = ["All"].concat(STATUSES, "Cancelled").map(s => `<option>${s}</option>`).join("");
statusFilter.addEventListener("change", renderAdmin);

document.getElementById("invoiceRows").addEventListener("click", function (e) {
    if (e.target.dataset.id) openInvoice(e.target.dataset.id);
});
invoiceBody.addEventListener("click", function (e) {
    if (e.target.id === "advanceBtn") advanceInvoice(e.target.dataset.id);
    if (e.target.dataset.email) openEmail(e.target.dataset.email);
});

// "Cars to collect" and "Damaged cars" lists
function adminListClick(e) {
    if (e.target.dataset.id) openInvoice(e.target.dataset.id);
    if (e.target.dataset.email) openEmail(e.target.dataset.email);
}
document.getElementById("collectRows").addEventListener("click", adminListClick);
document.getElementById("damageRows").addEventListener("click", adminListClick);

// email modal
emailBody.addEventListener("click", function (e) {
    if (e.target.id === "sendEmail") sendEmail(e.target.dataset.id);
    if (e.target.id === "emailDone") emailModal.classList.remove("open");
});
document.getElementById("closeEmail").addEventListener("click", () => emailModal.classList.remove("open"));
emailModal.addEventListener("click", e => { if (e.target === emailModal) emailModal.classList.remove("open"); });
document.getElementById("closeInvoice").addEventListener("click", () => invoiceModal.classList.remove("open"));
invoiceModal.addEventListener("click", e => { if (e.target === invoiceModal) invoiceModal.classList.remove("open"); });

// customer events
document.querySelectorAll(".reserve_btn").forEach(btn => {
    btn.addEventListener("click", () => openReserve(Number(btn.dataset.car)));
});

bookingList.addEventListener("click", function (e) {
    const id = e.target.dataset.id;
    if (e.target.dataset.action === "return") openReturn(id);
    if (e.target.dataset.action === "pay") openPay(id);
    if (e.target.dataset.action === "contract") openContract(id);
    if (e.target.dataset.action === "cancel") openCancel(id);
});

bookingBody.addEventListener("submit", function (e) {
    e.preventDefault();
    if (e.target.id === "reserveForm") submitReserve();
});

bookingBody.addEventListener("input", function (e) {
    // show the picture of the chosen location
    if (e.target.id === "resOffice") document.getElementById("officeImg").innerHTML = locationImage(e.target.value);
    if (e.target.id === "parkSelect") document.getElementById("parkImg").innerHTML = locationImage(e.target.value);

    if (["resCar", "resFrom", "resTo", "resOffice"].includes(e.target.id)) {
        updateReserveSummary();
        document.getElementById("contractAgree").checked = false;   // the contract changed, so it must be agreed again
    }
    if (e.target.id === "cardNumber") {   // show the card number in groups of 4
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");
    }
});

bookingBody.addEventListener("click", function (e) {
    if (e.target.id === "confirmReturn") confirmReturn(e.target.dataset.id);
    if (e.target.id === "confirmPay") confirmPay(e.target.dataset.id);
    if (e.target.id === "confirmCancel") confirmCancel(e.target.dataset.id);
    if (e.target.id === "doneBtn") closeBookingModal();
    if (e.target.id === "viewBookingsBtn") {
        closeBookingModal();
        goToSection(myBookings);
    }
});

document.getElementById("closeBooking").addEventListener("click", closeBookingModal);
bookingModal.addEventListener("click", e => { if (e.target === bookingModal) closeBookingModal(); });

// ---------- home screen: transition when scrolling into each section ----------
// each selector is revealed when it scrolls into view; "stagger" makes siblings appear one after another
const REVEAL_ITEMS = [
    { selector: ".section_box > h1" },
    { selector: ".about_us_container" },
    { selector: ".Fleet_type_container > h2" },
    { selector: ".Fleet-type", stagger: true },
    { selector: ".choose_container", sides: true },   // alternate sliding in from left and right
    { selector: ".usage_card", stagger: true },
    { selector: ".car_rent_btn" },
    { selector: ".review_card", stagger: true }
];

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// used by the nav bar links: the transition plays after the page has finished scrolling to the section
let revealHooks = null;

if ("IntersectionObserver" in window && !reduceMotion) {
    let navScrolling = false;   // true while a nav link is smooth-scrolling the page
    let navTimer = null;

    const revealObserver = new IntersectionObserver((entries, observer) => {
        if (navScrolling) return;   // wait until the scroll ends, otherwise the animation finishes before you arrive
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
                observer.unobserve(entry.target);   // animate only the first time
            }
        });
    }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" });

    REVEAL_ITEMS.forEach(item => {
        document.querySelectorAll(item.selector).forEach((el, n) => {
            el.classList.add("reveal");
            if (item.stagger) {   // position among its siblings decides the delay
                const siblings = Array.from(el.parentElement.children).filter(c => c.matches(item.selector));
                el.style.setProperty("--delay", Math.min(siblings.indexOf(el) * 0.12, 0.6) + "s");
            }
            if (item.sides) el.classList.add(n % 2 === 0 ? "from_left" : "from_right");
            revealObserver.observe(el);
        });
    });

    // show everything that is on screen now (used when a nav scroll ends)
    const revealInView = () => {
        document.querySelectorAll(".reveal:not(.visible)").forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.top < window.innerHeight - 40 && r.bottom > 0) {
                el.classList.add("visible");
                revealObserver.unobserve(el);
            }
        });
    };

    const endNavScroll = () => { navScrolling = false; revealInView(); };
    const waitForScrollEnd = ms => { clearTimeout(navTimer); navTimer = setTimeout(endNavScroll, ms); };
    window.addEventListener("scroll", () => { if (navScrolling) waitForScrollEnd(150); }, { passive: true });

    revealHooks = {
        // hide the target section's items again (without a fade-out) so they animate in on arrival
        prepare(section) {
            section.querySelectorAll(".reveal").forEach(el => {
                el.style.transition = "none";
                el.classList.remove("visible");
                void el.offsetWidth;   // apply the hidden state immediately
                el.style.transition = "";
                revealObserver.observe(el);
            });
            navScrolling = true;
            waitForScrollEnd(300);   // if the page is already there and no scroll happens
        }
    };
}

// scroll to a section; used by nav links and the "Rent a car now" button
function goToSection(target) {
    if (revealHooks) revealHooks.prepare(target);
    target.scrollIntoView({ behavior: "smooth" });
}

// every in-page link (nav bar, "Our Fleet" link in My Bookings) uses the transition
document.addEventListener("click", function (e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link || link.getAttribute("href") === "#") return;   // "#" is the login link
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    goToSection(target);
});

// ---------- home screen: rotating border on the fleet cards ----------
const BORDER_SPEED = 45;          // degrees per second
const BORDER_SPEED_HOVER = 240;   // faster while the card is hovered

const borderCards = Array.from(document.querySelectorAll(".Fleet")).map(card => {
    const state = { card: card, angle: 0, speed: BORDER_SPEED, target: BORDER_SPEED };
    card.addEventListener("mouseenter", () => { state.target = BORDER_SPEED_HOVER; });
    card.addEventListener("mouseleave", () => { state.target = BORDER_SPEED; });
    return state;
});

// users who prefer less motion get a still border
if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let lastTime = performance.now();

    const spinBorders = now => {
        const dt = Math.min((now - lastTime) / 1000, 0.1);   // seconds since last frame
        lastTime = now;

        borderCards.forEach(s => {
            s.speed += (s.target - s.speed) * Math.min(1, dt * 5);   // ease to the new speed
            s.angle = (s.angle + s.speed * dt) % 360;
            s.card.style.setProperty("--angle", s.angle + "deg");
        });
        requestAnimationFrame(spinBorders);
    };
    requestAnimationFrame(spinBorders);
}

updatePage();   // restores login state after a refresh