# MEDISAVE — Presentation Q&A & Faculty Defense Guide

> **Project Positioning**: "Verified community medicine redistribution and local handover platform."  
> *Developed as a Community Engagement Program (CEP) prototype at Pune Institute of Computer Technology (PICT).*

---

### 1. What problem does MEDISAVE solve?
Every year, thousands of households accumulate unexpired, unopened surplus medications after recovery or prescription changes and eventually discard them into domestic trash. Concurrently, students and low-income community members face recurring expenses for essential medications. MEDISAVE connects donors with local recipients to safely redistribute unexpired surplus medicines at non-profit community rates (40%–65% below MRP), preventing environmental pharmaceutical waste while improving healthcare accessibility.

---

### 2. Why not just use a pharmacy?
Commercial pharmacies sell newly manufactured inventory at full retail MRP and cannot legally or logistically buy back opened or individual surplus strips from households. MEDISAVE is **not** a commercial pharmacy; it is a peer-to-peer community exchange platform that matches surplus medicine holders with nearby recipients under strict quality, expiry, and prescription guardrails.

---

### 3. How do you handle Katraj vs Hinjewadi?
MEDISAVE uses deterministic **Haversine spherical distance calculations** between Pune localities.
- **Katraj vs Hinjewadi** is ~20.4 km apart $\implies$ marked with a warning badge: **`Far from you · 20.4 km`**.
- **Katraj vs Bibvewadi** is ~2.1 km apart $\implies$ marked: **`Nearby · 2.1 km`**.
- In the marketplace, when sorted by **"Nearby First (Closest Handover)"**, close listings are prioritized. Distant listings are not hidden, but buyers are transparently informed of the distance so they can coordinate practical handovers.

---

### 4. Who delivers the medicine?
**MEDISAVE does NOT operate an internal delivery fleet.** Fulfillment is handled via **community pickup and mutual coordination** at public landmarks (e.g., *Katraj Chowk PMT Stop*, *Vanaz Metro Station*, *College Main Gate*). The platform provides the order lifecycle workflow (`ORDER PLACED` $\rightarrow$ `SELLER CONFIRMS` $\rightarrow$ `READY FOR HANDOVER` $\rightarrow$ `BUYER + SELLER COORDINATE` $\rightarrow$ `HANDOVER COMPLETED`). Physical handover allows both parties to inspect blister seal integrity before final exchange.

---

### 5. How is the price calculated?
Pricing is calculated **deterministically** based on the seller's verified **physical printed MRP**, packaging condition, and remaining shelf life:
- **12+ months remaining shelf life**: $40\%$ discount ($60\%$ of MRP)
- **6–12 months remaining shelf life**: $50\%$ discount ($50\%$ of MRP)
- **3–6 months remaining shelf life**: $65\%$ discount ($35\%$ of MRP)
- **$< 90$ days remaining**: Rejected by safety policy (ineligible)
- **Hard Price Ceiling**: The backend strictly rejects any listing price exceeding **85% of MRP** to prevent profiteering.

---

### 6. Does AI decide the final price?
**No. AI does NOT decide the final price.** The pricing architecture is:
$$\text{Medicine Identification (AI-assisted)} \longrightarrow \text{Physical Printed MRP} \longrightarrow \text{Shelf Life} \longrightarrow \text{Condition} \longrightarrow \text{Deterministic Policy} \longrightarrow \text{Max Price Validation (85\% Cap)}$$
AI only assists with identifying the medicine name and reference parameters. The final price is **policy-constrained and mathematically calculated on the backend**.

---

### 7. What happens if OpenRouter goes down?
The application **does not crash or break**. The backend employs a 3-tier fallback architecture:
1. **Tier 1**: OpenRouter API call with strict 12-second timeout.
2. **Tier 2 (Fallback)**: Local offline pharmaceutical knowledge base (`PHARMA_KNOWLEDGE_BASE`) covering standard Indian formulations (*Dolo 650, Dolomide, Augmentin 625, Pan-D, Pantocid 40, Shelcal 500, Azee 500, Telma 40, Montair LC*).
3. **Tier 3 (Heuristic Engine)**: Algorithmic dosage and category extractor based on title strings.
4. **Manual Override**: The seller can always fill in or edit all fields manually.

---

### 8. Can AI hallucinate medicine information?
Because AI estimates can occasionally vary, MEDISAVE enforces:
- Subtle labeling: **`AI-assisted · Seller confirmation required`**.
- All AI-suggested fields (brand name, salt composition, manufacturer, dosage, quantity, printed MRP) are completely editable by the seller.
- AI-generated information is explicitly disclaimed as **guidance only**, not medically verified advice.
- All listings must undergo **human coordinator moderation** before going live.

---

### 9. How do you prevent expired medicines?
- **Server-side Date Validation**: The backend checks `expiryDate` against the current server timestamp.
- **90-Day Safety Buffer**: Any medicine with less than 90 days of remaining shelf life is automatically rejected during listing creation and updates.
- **Physical Verification on Handover**: Both parties visually confirm the printed expiry date stamped on the foil strip during in-person pickup.

---

### 10. How are prescriptions verified?
- **Schedule H / H1 Flagging**: Medicines categorized as prescription-only require an approved doctor prescription before checkout.
- **Prescription Upload**: Buyers upload a scanned prescription document (PDF/JPG/PNG) including patient name, doctor name, and registration number.
- **Coordinator Moderation**: Admin/coordinators review the document in the Admin Console, verify doctor credentials against medical registry standards, and mark it **Approved** or **Rejected** with specific reasons.
- **Atomic Checkout Enforcement**: The checkout API strictly rejects orders containing Rx items unless bound to an approved, unexpired prescription ID belonging to that user.

---

### 11. Can users access another person's prescription?
**No. Prescription documents are protected against Insecure Direct Object References (IDOR).**
- Prescription documents are stored outside the public web root in a private server directory.
- Access is gated behind authenticated Express endpoints (`GET /api/prescriptions/:id/document`).
- The server verifies that `req.user._id` matches the prescription owner's ID or that `req.user.role === 'admin'`. Unauthorized users receive HTTP 403 Forbidden.

---

### 12. How does admin moderation work?
- All newly created medicine listings start with `status: "pending"`.
- Listings are not visible in the public marketplace until approved by a platform coordinator in the Admin Console.
- Admins can inspect the medicine image, batch number, expiry date, printed MRP, and offered price.
- Admins can **Approve**, **Reject with a specific explanation**, or **Delete** listings violating safety guidelines.

---

### 13. How does the system scale?
- **Current MVP**: Express.js REST API with indexed MongoDB collections, Haversine distance matching across 18 Pune localities, and local document streaming.
- **Future Scalability Path**:
  - Cloud Object Storage (AWS S3 / GCP Cloud Storage) with time-limited pre-signed URLs for prescription files.
  - Redis caching for marketplace queries and locality coordinates.
  - Geospatial MongoDB / PostGIS spatial queries for multi-city coverage.
  - Integration with licensed NGO collection kiosks and verified student delivery volunteers.

---

### 14. What are MEDISAVE's current limitations?
1. **Geographic Distance**: Uses straight-line Haversine distance rather than real-time road traffic routing.
2. **Delivery Fleet**: Does not operate its own delivery fleet; handovers rely on mutual coordination.
3. **Prescription Review**: Prescription review is currently an administrative simulation workflow and requires licensed pharmacists in real deployments.
4. **Regulatory Framework**: Real-world commercial deployment requires formal licensing under Indian Drugs and Cosmetics Act / CDSCO guidelines.
5. **AI Suggestions**: AI-generated medicine information is non-clinical and requires seller verification.

---

### 15. What would be required before real-world deployment?
1. **Regulatory Clearances & NGO/Pharmacy Partnerships**: Partnering with licensed registered pharmacies or Jan Aushadhi Kendras for physical batch inspections.
2. **Physical Collection / Drop-off Kiosks**: Placing designated medicine collection kiosks at college health centers and RWAs.
3. **Identity Verification (KYC)**: Verifying donor identities via Aadhaar/DigiLocker.
4. **Automated OCR Scanning**: Using computer vision to cross-verify physical batch numbers and expiry stamps directly from uploaded package photographs.
5. **Cold-Chain Prohibitions**: Continued strict ban on temperature-sensitive biologics (e.g., insulin) that require continuous refrigeration.

---

### 16. How does this qualify as a Community Engagement Program?
MEDISAVE addresses two core United Nations Sustainable Development Goals:
- **SDG 3 (Good Health and Well-Being)**: Lowers financial barriers to essential medications for students and low-income residents.
- **SDG 12 (Responsible Consumption and Production)**: Prevents chemical pharmaceutical waste from entering Pune's waterways and landfills.
- **Community Impact**: Directly pilots localized redistribution on college campuses and residential neighborhoods (Katraj, Kothrud, Hinjewadi) where students and residents can safely exchange verified surplus medicines.
