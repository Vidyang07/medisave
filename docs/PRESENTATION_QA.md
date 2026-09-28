# MEDISAVE — Presentation Q&A & Technical Defense Guide

This document contains technically honest, implementation-verified answers to anticipated questions from faculty, technical judges, and community reviewers during the **Community Engagement Program (CEP)** evaluation.

---

## 1. What problem does MEDISAVE solve?
**Answer:**
In urban communities like Pune, households frequently purchase full strips or bottles of prescribed medicines, use only a portion during treatment, and store the remaining unexpired medicines in medicine boxes until they expire and get discarded into household waste (causing chemical waste and financial loss). Concurrently, low-income patients, students, daily wage earners, and elderly residents often struggle to afford ongoing essential medications.

MEDISAVE bridges this gap by providing a **digitally moderated, community-governed peer-to-peer redistribution platform**. It establishes verified identity checks, mandatory administrative inspection of medicine packaging, automated shelf-life validation, prescription compliance checks, and proximity-based local matching to enable safe, dignified, and hyper-local medicine redistribution.

---

## 2. Why would someone use MEDISAVE instead of a pharmacy?
**Answer:**
1. **Affordability for Buyers:** Genuine unexpired medicines are made available at community discounts between **40% and 65% off MRP** based on verifiable remaining shelf life, offering substantial relief for economically constrained individuals.
2. **Waste Reduction for Sellers:** Community members holding surplus unexpired medicines can safely donate or recover a nominal token amount rather than letting good medicines expire in drawers.
3. **Hyper-Local Availability:** In dense neighborhoods, finding specific formulations during off-hours or stockouts at local retail shops is facilitated through local community inventory visibility.
4. **Social & Ecological Responsibility:** It prevents active pharmaceutical compounds from entering municipal water tables through improper household disposal.

*Note: MEDISAVE does not replace licensed retail pharmacies or emergency hospital dispensaries. It is a secondary community exchange layer designed for non-emergency redistribution of unexpired, sealed medicines.*

---

## 3. What happens if buyer and seller are far apart?
**Answer:**
MEDISAVE uses deterministic **Haversine geospatial distance calculation** at the query layer. Listings are categorized into 4 distinct proximity tiers:
- **0.0 – 5.0 km:** `Nearby` (Green badge) — Prioritized at the top of the marketplace feed.
- **5.0 – 15.0 km:** `Local Area` (Teal badge) — Secondary priority for standard cross-neighborhood exchanges.
- **15.0 – 30.0 km:** `Extended Area` / `Far from you` (Amber badge) — Deprioritized with explicit distance advisory.
- **> 30.0 km:** `Distant Area` (Rose/Red badge) — Bottom rank with an explicit warning advising against remote travel.

If a buyer and seller are far apart, the UI clearly displays the calculated distance (e.g., `Far from you · ~20.4 km`) and suggests searching for nearby alternatives. Handover coordination is always at the mutual discretion of the parties; the platform does not force or artificially disguise remote transactions.

---

## 4. How do you solve Katraj vs Hinjewadi?
**Answer:**
- **Calculated Distance:** The distance between Katraj ($18.4529^\circ\text{N}, 73.8652^\circ\text{E}$) and Hinjewadi ($18.5913^\circ\text{N}, 73.7389^\circ\text{E}$) is **20.4 km**.
- **System Behavior:** When a buyer in Hinjewadi views a listing posted by a seller in Katraj, the marketplace attaches a clear warning: `Far from you · 20.4 km`.
- **Marketplace Ranking:** If another seller in Wakad ($2.8\text{ km}$) or Baner ($6.1\text{ km}$) lists the same medicine, their listings are sorted ahead of the Katraj listing.
- **No False Delivery Promises:** The checkout screen informs the Hinjewadi buyer that this is a remote community exchange requiring self-coordinated handover or mutual agreement at a designated partner hub, preventing unrealistic logistics expectations.

---

## 5. Who delivers the medicine?
**Answer:**
MEDISAVE is an **identity-verified matching and safety verification platform, NOT a commercial logistics company**.
In our current community prototype, fulfillment operates via:
1. **Community Self-Pickup:** Buyer and seller coordinate a mutual handover at a safe public location (e.g., college gate, residential society clubhouse, local NGO kiosk).
2. **Institutional Drop-off / Collection Point:** In our campus deployment model, the PICT campus dispensary or NSS student volunteer desk acts as an intermediary verification and collection hub.
3. **Future Extension:** Integration with localized hyper-local couriers (Dunzo, Porter, India Post) via webhooks is architected for Phase 2, but is deliberately not simulated as active today.

---

## 6. How do you calculate price?
**Answer:**
Pricing is governed by a **strict deterministic formula (`pricingService.js`)**, calculated mathematically from the manufacturer's printed MRP and verified remaining shelf life:

$$\text{Shelf Life Remaining} = \text{Expiry Date} - \text{Current Date}$$

- **$\ge 12$ Months Remaining:** $40\%$ discount $\rightarrow$ Price $= \text{MRP} \times 0.60$
- **$6 - 12$ Months Remaining:** $50\%$ discount $\rightarrow$ Price $= \text{MRP} \times 0.50$
- **$3 - 6$ Months Remaining:** $65\%$ discount $\rightarrow$ Price $= \text{MRP} \times 0.35$
- **$< 90$ Days ($< 3$ Months):** **REJECTED BY SYSTEM** (Zero tolerance for short-dated medicines).
- **Hard Price Ceiling:** A seller can set a lower or free price (₹0 donation), but the server forcefully enforces:

$$\text{Final Price} \le \min(\text{Seller Listed Price}, \text{MRP} \times 0.85, \text{Policy Suggested Price})$$

---

## 7. Why use AI for pricing?
**Answer:**
AI (via OpenRouter Meta-Llama 3.3 70B Instruct) is used **only as an assistive knowledge engine**, performing:
1. **Composition Extraction:** Parsing brand names (e.g., "Dolomide", "Augmentin 625 Duo") into standard active salts (e.g., "Paracetamol 650mg + Domperidone 10mg", "Amoxicillin + Clavulanic Acid").
2. **Category & Form Identification:** Classifying therapeutic category (Analgesic, Antibiotic, Antidiabetic) and dosage form (Strip of Tablets, Syrup, Ointment).
3. **Reference MRP Benchmark:** Providing standard market price benchmarks to assist sellers who may not have the original box packaging.
4. **Prescription Requirement Flagging:** Indicating whether the active molecule is a Schedule H/H1/X drug requiring a doctor's prescription.

**Key Distinction:** The AI never sets the final database price. The deterministic pricing engine takes the AI's reference data, verifies it against server rules, and applies the mathematical shelf-life discount policy.

---

## 8. Can AI make a wrong recommendation?
**Answer:**
Yes, LLMs can hallucinate or misread packaging text. We designed a multi-layer defense:
1. **Strict JSON Schema Validation:** The AI response must parse against strict schema types with numerical ranges.
2. **Deterministic Bounding:** The server clamps any AI suggested price to the hard formula: $\text{Price} \le \text{MRP} \times 0.85$.
3. **Mandatory Human-in-the-Loop Admin Moderation:** Every listing generated with AI assistance enters `status: 'pending'` and must be physically reviewed by an authorized administrator (who compares the uploaded packaging photo against the entered composition and MRP).
4. **Zero Auto-Publishing:** AI output never bypasses the moderation queue.

---

## 9. What happens if OpenRouter is unavailable?
**Answer:**
MEDISAVE implements an **embedded Offline Pharmaceutical Knowledge Base (`backend/services/aiMedicineService.js`)**.
If the OpenRouter API times out, returns HTTP 5xx, or reaches rate limits:
1. The service intercepts the error gracefully without crashing.
2. It queries a local curated dictionary of common generic and branded pharmaceuticals (Paracetamol, Amoxicillin, Metformin, Cetirizine, Azithromycin, Pantoprazole, Dolo 650, etc.).
3. If matched, it returns verified compositions, categories, and standard MRPs with the flag `source: 'local_knowledge_base'`.
4. If unmatched, it defaults to a safe fallback template requiring manual seller input and prompts the admin for verification.
5. **Listing creation never fails due to external AI downtime.**

---

## 10. Can a seller manipulate the price?
**Answer:**
**No.** Price integrity is enforced on the backend:
1. When a seller submits a price during listing creation, the backend `medicineController.js` passes the payload through `calculatePricingPolicy(mrp, expiryDate)`.
2. Even if an attacker intercepts the HTTP request and sends `price: 99999` with `mrp: 100`, the server overrides the value and saves `price: 60`.
3. If a seller submits a listing with $<90$ days to expiry, the server throws HTTP 400 (`"Medicine is expired or within 90-day safety margin"`).
4. Admin moderation verifies that the user-submitted MRP matches the photo of the blister pack.

---

## 11. How do you prevent expired medicine?
**Answer:**
We employ a **three-tier temporal defense**:
1. **Frontend Pre-Validation:** Datepicker disables selection of dates within 90 days from today and calculates real-time shelf life.
2. **Backend Mongoose & Controller Enforcement:** Listing creation rejects any expiry date where $\text{expiryDate} < \text{Date.now}() + 90\text{ days}$.
3. **Physical Packaging Verification:** Admin inspects the high-resolution photo showing the manufacturer's printed batch number and expiry date before moving `status` from `pending` to `approved`.
4. **Dynamic Marketplace Filter:** Marketplace queries include `{ expiryDate: { $gt: new Date(Date.now() + 90*24*60*60*1000) } }`, automatically suppressing any listing that crosses the threshold while listed.

---

## 12. How do you verify prescriptions?
**Answer:**
1. **Seller/AI Classification:** If a medicine has `requiresPrescription: true` (Schedule H/H1/Rx), the cart and checkout controllers enforce mandatory prescription validation.
2. **Secure Upload:** The buyer uploads a valid prescription (PDF, JPG, PNG under 10MB) via `POST /api/prescriptions/upload`.
3. **Admin Verification Queue:** Admin inspects the prescription document, patient name, doctor's registration number, issue date, and prescribed drug names.
4. **Status Transitions:** Admin marks the prescription as `APPROVED` or `REJECTED` with review notes.
5. **Checkout Blockade:** The order placement endpoint (`POST /api/orders`) checks the database: if any cart item requires a prescription, it queries for a valid, `APPROVED` prescription belonging to the authenticated buyer. If missing or `PENDING`, checkout is rejected with HTTP 400.

---

## 13. Can one user access another user's prescription?
**Answer:**
**No.** All prescription documents are protected against unauthorized access and IDOR (Insecure Direct Object References):
1. **Private Storage:** Prescription files are stored outside the public static directory in `backend/uploads/prescriptions/` with randomized, hashed filenames (`crypto.randomBytes(16)`).
2. **No Public URL:** There is no static Express route serving `/uploads/prescriptions/` directly.
3. **Protected Streaming Endpoint:** Files are accessed exclusively via `GET /api/prescriptions/document/:id` or `GET /api/prescriptions/:id/file`.
4. **RBAC Ownership Verification:**
   ```javascript
   if (req.user.role !== 'admin' && prescription.userId.toString() !== req.user._id.toString()) {
     return res.status(403).json({ message: 'Forbidden: Access to this prescription is restricted.' });
   }
   ```
5. **Path Traversal Shield:** `path.basename()` and directory sanitization prevent `../` directory traversal attacks.

---

## 14. How does admin moderation work?
**Answer:**
The platform implements a **two-tier RBAC system (`admin` vs `buyer`/`seller`)**:
- **Medicine Moderation:**
  - When submitted, `medicine.status = 'pending'`.
  - Pending medicines are excluded from all public marketplace search queries (`{ status: 'approved' }`).
  - Admins inspect the listing queue in the Admin Dashboard (`/admin`), review photo packaging, batch number, salt, and MRP, and invoke `PUT /api/admin/medicines/:id/status` to transition status to `approved` or `rejected`.
- **Prescription Moderation:**
  - Admins review uploaded medical certificates at `PUT /api/admin/prescriptions/:id/review`.
- **Non-Admin Isolation:** Regular users hitting `/api/admin/*` receive HTTP 403 Forbidden.

---

## 15. How do you prevent fake medicine listings?
**Answer:**
1. **Mandatory Photographic Proof:** Clear photos of the blister pack/bottle showing manufacturer, batch number, manufacturing license, and expiry date are required.
2. **Salt Composition Extraction:** AI and admin verify that the entered brand name corresponds to recognized generic salt formulations.
3. **Seller Accountability:** Listings are permanently linked to authenticated user accounts with email, phone, and geographic coordinates.
4. **Physical Inspection at Handover:** Buyers are instructed to verify seal integrity and batch matching before confirming receipt.
5. **Community Reporting & Ban Mechanism:** Admin has one-click capability to reject listings and suspend fraudulent accounts.

---

## 16. How does scalability work?
**Answer:**
The system is built with a **stateless micro-ready architecture**:
- **Stateless Authentication:** JSON Web Tokens (JWT) eliminate server-side session memory, allowing horizontal scaling across multiple Node.js instances behind an Nginx or AWS ALB load balancer.
- **MongoDB Database Indexing:** High-frequency query fields are indexed:
  - `status`, `category`, `requiresPrescription`, `expiryDate`
  - `userId`, `sellerId`, `buyerId`
- **Decoupled AI Layer:** AI enrichment runs asynchronously without blocking database transactions.
- **Low Footprint Assets:** Static frontend assets are pre-bundled with Vite and can be distributed via CDN (Cloudflare / AWS CloudFront).

---

## 17. What happens when thousands of users use the platform?
**Answer:**
For high-concurrency production scaling, the roadmap includes:
1. **Geospatial 2dsphere Indexing:** Utilizing MongoDB's native `$nearSphere` and `$geoWithin` for sub-millisecond distance sorting across millions of coordinates.
2. **Cloud Object Storage (S3 / GCS):** Transitioning local `backend/uploads/prescriptions/` to AWS S3 with time-limited pre-signed URLs.
3. **Redis Caching:** Caching the approved marketplace catalogue and locality coordinates with a 5-minute TTL.
4. **Queue Workers (BullMQ / RabbitMQ):** Offloading AI metadata queries, email notifications, and automated expiry sweeps to background worker threads.
5. **Database Sharding:** Sharding MongoDB clusters by geographic region (e.g., Pune-East, Pune-West, Mumbai).

---

## 18. How is user privacy protected?
**Answer:**
1. **Coarse Locality Display:** The public marketplace displays only the neighborhood/area name (e.g., "Katraj", "Bibvewadi", "Kothrud") and relative distance ("2.1 km away"). Exact street address, flat numbers, and GPS coordinates are **never exposed publicly**.
2. **Private Prescription Storage:** Medical prescriptions contain sensitive personal health information (PHI) and are restricted exclusively to the uploading patient and verified platform administrators.
3. **Password Hashing:** Passwords are salted and hashed using `bcryptjs` (10 rounds); plaintext passwords are never logged or stored.
4. **Secure Token Handling:** JWTs are scoped with expiration and validated on every sensitive route.

---

## 19. What is the role of MEDISAVE in delivery?
**Answer:**
MEDISAVE is the **digital governance, trust, and verification infrastructure**.
- It provides: Medicine verification, pricing regulation, prescription validation, proximity matching, and order tracking.
- It does not: Employ delivery drivers, operate courier fleets, or hold centralized physical drug inventories.
- Delivery is explicitly framed as **Community Coordination / Pickup Hub Handover**.

---

## 20. What are the current limitations?
**Answer:**
As an academic Community Engagement prototype:
1. **Local Disk Document Storage:** Prescriptions and photos are stored on the server's local file system rather than a cloud S3 bucket.
2. **In-Memory Haversine Math:** Distance calculations are executed in application memory across active listings rather than MongoDB native `$geoNear` indexes.
3. **Asynchronous Manual Verification:** Admin moderation requires human review, introducing latency between listing submission and marketplace appearance.
4. **Cold-Chain Medicines:** We currently exclude temperature-sensitive pharmaceuticals (e.g., Insulin, biological vaccines) due to lack of verified cold-chain logistics.

---

## 21. How would you deploy this for a real community?
**Answer:**
A realistic phased rollout for Pune:
1. **Phase 1 — Campus & College Pilot:** Deploy at PICT with NSS/Rotaract student volunteers managing the Admin Moderation desk. Campus dispensary serves as the designated physical handover point.
2. **Phase 2 — NGO Partnership:** Partner with local healthcare NGOs (e.g., Seva Sahayog Foundation, Jan Swasthya Manch) to deploy 3 verified pickup kiosks in Katraj, Kothrud, and Hadapsar.
3. **Phase 3 — Pharmacist Advisory Board:** Involve registered volunteer pharmacists to supervise prescription approval and physical packaging inspections.
4. **Phase 4 — Cloud Hardening:** Migrate database to MongoDB Atlas, document storage to AWS S3, and domain to a secure HTTPS host with Cloudflare DDoS protection.

---

## 22. How does this create actual community engagement?
**Answer:**
- **Promotes Civic Responsibility:** Encourages households to responsibly check home medicine cabinets and redistribute surplus unexpired medicines rather than disposing of them.
- **Fosters Neighborhood Solidarity:** Connects college students, senior citizens, and neighborhood residents through mutual assistance.
- **Supports Environmental Sustainability:** Directly reduces chemical contamination of soil and water systems caused by discarded medications.
- **Empowers Student Volunteers:** Provides student community service groups (NSS/Rotaract) with a structured digital platform to run health awareness and medicine donation drives.

---

## 23. What would you improve next?
**Answer:**
1. **OCR / Vision Model Integration:** Real-time optical character recognition (OCR) on packaging photos to automatically read batch numbers and expiry dates directly from the blister foil.
2. **Doctor / Pharmacist Portal:** Dedicated role-based access for registered medical professionals to review and approve prescriptions with digital signatures.
3. **Automated Expiry Cron Sweeper:** Automated daily background worker to transition listings with $<90$ days remaining to `archived` status automatically.
4. **WhatsApp / SMS Gateway:** Twilio or Gupshup notification integration for instant order status alerts and handover pin codes.
5. **Multilingual Support:** Localizing the user interface into Marathi and Hindi to maximize accessibility among grassroots community members.
