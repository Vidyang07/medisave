# MEDISAVE — Presentation Q&A & Faculty Defense Guide

> **Project Positioning**: "Verified Community Medicine Donation & Expiry Awareness Platform."  
> *Developed as a Community Engagement Project (CEP) prototype at Pune Institute of Computer Technology (PICT).*

---

### 1. What problem does MEDISAVE solve?
Every year, thousands of households accumulate unexpired, unopened surplus medications after recovery or prescription changes and eventually discard them into domestic trash. Concurrently, low-income families, orphanages, and charitable health clinics face shortages of common essential medications. MEDISAVE creates a verified digital channel to safely donate unexpired surplus medicines to accredited healthcare partners while guiding expired medicines to safe disposal protocols, preventing environmental pharmaceutical waste and antimicrobial resistance (AMR).

---

### 2. Why not just use a commercial pharmacy or sell medicines peer-to-peer?
Commercial pharmacies sell newly manufactured stock at full retail MRP and cannot legally buy back opened or individual surplus strips from households. Furthermore, peer-to-peer commercial selling of prescription drugs is restricted under the Indian Drugs and Cosmetics Act. MEDISAVE is **not** a commercial pharmacy or resale marketplace; it is an academic prototype for **verified surplus donations** where medicines are 100% free and redistributed strictly to accredited community clinics and NGOs.

---

### 3. How do you handle Katraj vs Hinjewadi?
MEDISAVE uses deterministic **Haversine spherical distance calculations** between 18 Pune localities:
- **Katraj vs Hinjewadi** is ~20.4 km apart $\implies$ categorized as **`Distant (20.4 km)`** with a distance warning to prioritize local transfers.
- **Katraj vs Bibvewadi** is ~2.1 km apart $\implies$ categorized as **`Nearby (2.1 km)`**.
- In the Partner Portal, listings are sorted by proximity so clinics can claim nearby donations for convenient pickup.

---

### 4. Who handles physical collection and handover?
**MEDISAVE does NOT operate an internal delivery fleet.** Fulfillment is handled via **localized physical handovers** at designated public landmarks (e.g., *Vanaz Metro Station*, *Katraj Chowk PMT Stop*, *College Main Gate*). The platform authenticates this handover using a server-generated **6-digit one-time code (OTP)** that the donor reveals to the partner only after in-person inspection of the blister packaging.

---

### 5. Why is a 6-digit handover code necessary?
A simple "Received" button allows either party to falsely confirm a transfer without meeting. The 6-digit OTP is generated on the server when a partner accepts a donation, stored with `select: false`, and displayed exclusively on the donor's dashboard. During in-person collection, the partner inspects the packaging and enters the donor's code. Entering the valid code marks the donation as `completed`. Incorrect submissions are limited to 5 attempts to prevent brute-force attacks.

---

### 6. Does AI decide medical decisions or safety validation?
**No. AI is strictly an intake assistant, not a clinical decision-maker.** The architecture is:
$$\text{Donor Enters Brand Name} \longrightarrow \text{AI Autofills Generic/Form (Advisory)} \longrightarrow \text{Donor Confirms Batch/Expiry} \longrightarrow \text{Server 90-Day Filter} \longrightarrow \text{Admin Moderation} \longrightarrow \text{Partner Inspection}$$
Donors must review and physically confirm the printed batch number and expiry date before submission.

---

### 7. What happens if OpenRouter / AI is offline?
The application **does not fail or break**. The backend employs a 3-tier fallback architecture:
1. **Tier 1**: OpenRouter API call with a 12-second timeout.
2. **Tier 2 (Fallback)**: Internal offline pharmaceutical knowledge base covering standard formulations (*Dolo 650, Augmentin 625, Pan-D, Pantocid 40, Shelcal 500, Cetirizine 10mg, etc.*).
3. **Tier 3**: Heuristic dosage and category extractor.
4. **Manual Override**: The donor can always enter all fields manually.

---

### 8. How do you prevent expired or compromised medicines?
MEDISAVE enforces 3 defense layers:
1. **Automated Server Filter**: Strictly rejects medicines with $<90$ days remaining shelf-life, opened packaging, or cold-chain requirements ($2^\circ\text{C}-8^\circ\text{C}$).
2. **Coordinator Moderation**: Admins inspect packaging photos, batch numbers, and expiry stamps before approving.
3. **Physical Inspection**: Partners examine the physical blister foil seal before entering the 6-digit OTP.

---

### 9. How are prescriptions verified?
Prescription-required items (Schedule H/H1) require doctor prescription verification. Scanned documents are stored in private server directories protected against IDOR (Insecure Direct Object References). Only the authenticated user and platform administrators can view the document.

---

### 10. How does admin moderation work?
- Newly submitted donations start with `status: "pending"` and are hidden from the partner catalog.
- Coordinators review submissions in the Admin Console and mark them **Approved** or **Rejected with specific explanation**.
- Administrators also review and verify partner registrations (`partnerStatus: "verified"`).

---

### 11. What are MEDISAVE's current limitations?
1. **Geographic Scope**: Uses straight-line Haversine distance rather than live traffic routing.
2. **Logistics**: Relies on donor-partner physical meetups rather than dedicated courier fleets.
3. **Regulatory Scope**: Designed as an academic prototype; real-world deployment requires formal licensing under state health and drug control authorities.

---

### 12. How does this qualify as a Community Engagement Project (CEP)?
MEDISAVE directly addresses two United Nations Sustainable Development Goals:
- **UN SDG 3 (Good Health and Well-Being)**: Reduces medicine wastage and supports community healthcare clinics with verified surplus supplies.
- **UN SDG 12 (Responsible Consumption and Production)**: Educates community members against flushing unused medicines into Pune's river basin and municipal drains, curbing water pollution and antimicrobial resistance (AMR).
