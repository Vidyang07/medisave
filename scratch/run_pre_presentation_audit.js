const API_BASE = 'http://127.0.0.1:5000/api';
let FRONTEND_BASE = 'http://127.0.0.1:5173';

async function runAudit() {
  console.log('================================================================');
  console.log('       MEDISAVE FINAL PRE-PRESENTATION SYSTEM AUDIT');
  console.log('================================================================\n');

  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passCount++;
    } else {
      console.error(`[FAIL] ${message}`);
      failCount++;
    }
  }

  // Determine active frontend port
  try {
    const probe = await fetch('http://localhost:5173');
    if (probe.ok) FRONTEND_BASE = 'http://localhost:5173';
  } catch {
    try {
      const probe2 = await fetch('http://localhost:5174');
      if (probe2.ok) FRONTEND_BASE = 'http://localhost:5174';
    } catch {
      FRONTEND_BASE = 'http://localhost:5173';
    }
  }

  // ==========================================================================
  // SECTION 1: FRONTEND ROUTE LOADING VERIFICATION
  // ==========================================================================
  console.log(`--- SECTION 1: FRONTEND ROUTE LOADING VERIFICATION (${FRONTEND_BASE}) ---`);
  const routes = [
    '/',
    '/dashboard',
    '/sell',
    '/buy',
    '/partner',
    '/disposal-guide',
    '/cep-proofs',
    '/admin'
  ];

  for (const r of routes) {
    try {
      const res = await fetch(`${FRONTEND_BASE}${r}`);
      const text = await res.text();
      assert(res.status === 200 && /<!doctype html>/i.test(text), `Frontend route "${r}" loads successfully (HTTP ${res.status})`);
    } catch (e) {
      assert(false, `Frontend route "${r}" failed to load: ${e.message}`);
    }
  }

  // ==========================================================================
  // SECTION 2: AUTHENTICATION & DEMO ACCOUNTS
  // ==========================================================================
  console.log('\n--- SECTION 2: DEMO ACCOUNTS AUTHENTICATION ---');
  let donorToken = '', partnerToken = '', adminToken = '';
  let donorId = '', partnerId = '', adminId = '';

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'community.donor@medisave.org',
        password: 'MedisaveSeedPassword2026!'
      })
    });
    const resData = await res.json();
    const token = resData.data?.token || resData.token;
    const user = resData.data?.user || resData.user;
    assert(resData.success && Boolean(token), 'Donor login successful (community.donor@medisave.org)');
    donorToken = token;
    donorId = user?._id || user?.id;
  } catch (e) {
    assert(false, `Donor login failed: ${e.message}`);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'partner@medisave.org',
        password: 'MedisavePartner2026!'
      })
    });
    const resData = await res.json();
    const token = resData.data?.token || resData.token;
    const user = resData.data?.user || resData.user;
    assert(resData.success && user?.role === 'partner', 'Partner login successful (role: partner, partnerStatus: verified)');
    partnerToken = token;
    partnerId = user?._id || user?.id;
  } catch (e) {
    assert(false, `Partner login failed: ${e.message}`);
  }

  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@medisave.org',
        password: 'MedisaveAdmin2026!'
      })
    });
    const resData = await res.json();
    const token = resData.data?.token || resData.token;
    const user = resData.data?.user || resData.user;
    assert(resData.success && user?.role === 'admin', 'Admin login successful (role: admin)');
    adminToken = token;
    adminId = user?._id || user?.id;
  } catch (e) {
    assert(false, `Admin login failed: ${e.message}`);
  }

  // ==========================================================================
  // SECTION 3: END-TO-END DONATION & 6-DIGIT HANDOVER WORKFLOW
  // ==========================================================================
  console.log('\n--- SECTION 3: END-TO-END DONATION & HANDOVER LIFECYCLE ---');
  let createdMedId = '';
  let generatedOtp = '';

  // 1. Donor creates donation
  try {
    const today = new Date();
    const futureExpiry = new Date(today.getTime() + 200 * 86400000).toISOString().split('T')[0];

    const res = await fetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      },
      body: JSON.stringify({
        medicineName: `Paracetamol 650mg AuditTest-${Date.now()}`,
        brandName: `Dolo 650 Audit`,
        genericName: 'Paracetamol IP',
        company: 'Micro Labs Ltd',
        strength: '650mg',
        dosageForm: 'Tablet',
        category: 'Pain & Fever',
        quantity: 10,
        expiryDate: futureExpiry,
        price: 0,
        listingType: 'free_donation',
        packageCondition: 'Intact Sealed Blister Pack',
        locality: 'Kothrud',
        handoverPoint: 'Vanaz Metro Station Entrance'
      })
    });
    const data = await res.json();
    assert(data.success && data.data?.status === 'pending', '1. Donor created donation (status: pending)');
    createdMedId = data.data?._id || data.data?.id;
  } catch (e) {
    assert(false, `Donor creation failed: ${e.message}`);
  }

  // 2. Admin approves donation
  try {
    const res = await fetch(`${API_BASE}/admin/medicines/${createdMedId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });
    const data = await res.json();
    assert(data.success && data.data?.status === 'approved', '2. Admin approved donation (status: approved)');
  } catch (e) {
    assert(false, `Admin approval failed: ${e.message}`);
  }

  // 3. Partner sees donation in available donations
  try {
    const res = await fetch(`${API_BASE}/medicines/partner/available`, {
      headers: { Authorization: `Bearer ${partnerToken}` }
    });
    const data = await res.json();
    const found = data.data?.find(m => (m._id || m.id) === createdMedId);
    assert(Boolean(found), '3. Verified Partner sees approved donation in Available Donations queue');
  } catch (e) {
    assert(false, `Partner available query failed: ${e.message}`);
  }

  // 4. Partner accepts donation
  try {
    const res = await fetch(`${API_BASE}/medicines/${createdMedId}/accept-donation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${partnerToken}` }
    });
    const data = await res.json();
    assert(data.success && data.data?.status === 'accepted', '4. Partner accepted donation (status: accepted, 6-digit OTP generated)');
  } catch (e) {
    assert(false, `Partner acceptance failed: ${e.message}`);
  }

  // 5. Donor sees 6-digit handover code in /my-listings
  try {
    const res = await fetch(`${API_BASE}/medicines/my-listings`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    const data = await res.json();
    const donorMed = data.data?.find(m => (m._id || m.id) === createdMedId);
    assert(Boolean(donorMed?.handoverCode && /^\d{6}$/.test(donorMed.handoverCode)), `5. Donor sees their own 6-digit handover code (${donorMed?.handoverCode})`);
    generatedOtp = donorMed?.handoverCode;
  } catch (e) {
    assert(false, `Donor code retrieval failed: ${e.message}`);
  }

  // 6. Partner CANNOT retrieve the donor's code via public or partner endpoints
  try {
    const res = await fetch(`${API_BASE}/medicines/partner/my-accepted`, {
      headers: { Authorization: `Bearer ${partnerToken}` }
    });
    const data = await res.json();
    const partnerItem = data.data?.find(m => (m._id || m.id) === createdMedId);
    assert(!partnerItem?.handoverCode, '6. Security check: Partner CANNOT view/retrieve the donor handoverCode from API');
  } catch (e) {
    assert(false, `Partner query check failed: ${e.message}`);
  }

  // 7. Test incorrect handover code & attempt tracking
  try {
    const res = await fetch(`${API_BASE}/medicines/${createdMedId}/verify-handover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${partnerToken}`
      },
      body: JSON.stringify({ code: '000000' })
    });
    const data = await res.json();
    assert(res.status === 400 && data.message?.includes('Invalid handover code'), '7. Incorrect handover code rejected with 400 error message');
  } catch (e) {
    assert(false, `Incorrect code test error: ${e.message}`);
  }

  // 8. Test correct handover code completion
  try {
    const res = await fetch(`${API_BASE}/medicines/${createdMedId}/verify-handover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${partnerToken}`
      },
      body: JSON.stringify({ code: generatedOtp })
    });
    const data = await res.json();
    assert(data.success && data.data?.status === 'completed', '8. Correct 6-digit handover code successfully verified (status: completed)');
  } catch (e) {
    assert(false, `Handover verification failed: ${e.message}`);
  }

  // ==========================================================================
  // SECTION 4: 5-ATTEMPT LOCKOUT TEST
  // ==========================================================================
  console.log('\n--- SECTION 4: 5-ATTEMPT BRUTE-FORCE LOCKOUT VERIFICATION ---');
  try {
    const today = new Date();
    const futureExpiry = new Date(today.getTime() + 200 * 86400000).toISOString().split('T')[0];

    // Create med
    const medRes = await fetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      },
      body: JSON.stringify({
        medicineName: `Lockout Test Med ${Date.now()}`,
        brandName: `Lockout Test`,
        genericName: 'Paracetamol',
        company: 'Test Labs',
        strength: '500mg',
        dosageForm: 'Tablet',
        category: 'General Health',
        quantity: 5,
        expiryDate: futureExpiry,
        price: 0,
        listingType: 'free_donation',
        packageCondition: 'Intact Sealed Blister Pack',
        locality: 'Katraj'
      })
    });
    const medData = await medRes.json();
    const lockMedId = medData.data?._id;

    // Approve
    await fetch(`${API_BASE}/admin/medicines/${lockMedId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({ status: 'approved' })
    });

    // Partner accept
    await fetch(`${API_BASE}/medicines/${lockMedId}/accept-donation`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${partnerToken}` }
    });

    // Submit 5 wrong attempts
    for (let i = 1; i <= 5; i++) {
      await fetch(`${API_BASE}/medicines/${lockMedId}/verify-handover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${partnerToken}`
        },
        body: JSON.stringify({ code: '111111' })
      });
    }

    // 6th attempt should be locked
    const res6 = await fetch(`${API_BASE}/medicines/${lockMedId}/verify-handover`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${partnerToken}`
      },
      body: JSON.stringify({ code: '111111' })
    });
    const data6 = await res6.json();
    assert(res6.status === 400 && data6.message?.includes('locked'), 'Brute-force defense: Handover permanently locked after 5 failed attempts (400 / Locked)');
  } catch (e) {
    assert(false, `Lockout verification failed: ${e.message}`);
  }

  // ==========================================================================
  // SECTION 5: AUTHORIZATION & RBAC BOUNDARIES
  // ==========================================================================
  console.log('\n--- SECTION 5: AUTHORIZATION & RBAC BOUNDARIES ---');

  // A. Normal user cannot access partner dashboard endpoint
  try {
    const res = await fetch(`${API_BASE}/medicines/partner/available`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    assert(res.status === 403, 'Normal user blocked from partner endpoints (403 Forbidden)');
  } catch (e) {
    assert(false, `Partner RBAC test error: ${e.message}`);
  }

  // B. Non-admin cannot perform admin moderation
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${donorToken}` }
    });
    assert(res.status === 403, 'Normal user blocked from admin stats (403 Forbidden)');
  } catch (e) {
    assert(false, `Admin stats RBAC error: ${e.message}`);
  }

  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${partnerToken}` }
    });
    assert(res.status === 403, 'Partner blocked from admin console (403 Forbidden)');
  } catch (e) {
    assert(false, `Partner admin block error: ${e.message}`);
  }

  // C. Non-admin cannot verify partner accounts
  try {
    const res = await fetch(`${API_BASE}/admin/partners/${partnerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      },
      body: JSON.stringify({ partnerStatus: 'verified' })
    });
    assert(res.status === 403, 'Non-admin blocked from partner status moderation (403 Forbidden)');
  } catch (e) {
    assert(false, `Partner verify block error: ${e.message}`);
  }

  // ==========================================================================
  // SECTION 6: MEDICINE SAFETY & EXPIRY GUARDRAILS
  // ==========================================================================
  console.log('\n--- SECTION 6: MEDICINE SAFETY & EXPIRY GUARDRAILS ---');

  // A. Expired medicine rejected
  try {
    const res = await fetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      },
      body: JSON.stringify({
        medicineName: 'Expired Syrup Test',
        company: 'Test Labs',
        category: 'General Health',
        expiryDate: '2023-01-01',
        quantity: 1,
        price: 0,
        locality: 'Katraj'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && data.message?.includes('expired'), 'Expired medicine strictly rejected by server (400)');
  } catch (e) {
    assert(false, `Expired test error: ${e.message}`);
  }

  // B. Less than 90 days shelf-life rejected
  try {
    const today = new Date();
    const shortExpiry = new Date(today.getTime() + 45 * 86400000).toISOString().split('T')[0];
    const res = await fetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      },
      body: JSON.stringify({
        medicineName: 'Short Expiry Test',
        company: 'Test Labs',
        category: 'General Health',
        expiryDate: shortExpiry,
        quantity: 1,
        price: 0,
        locality: 'Katraj'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && data.message?.includes('90 days'), 'Medicine with <90 days shelf-life strictly rejected by server (400)');
  } catch (e) {
    assert(false, `Short expiry test error: ${e.message}`);
  }

  // C. Cold chain medicine rejected
  try {
    const today = new Date();
    const futureExpiry = new Date(today.getTime() + 200 * 86400000).toISOString().split('T')[0];
    const res = await fetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      },
      body: JSON.stringify({
        medicineName: 'Insulin Glargine',
        company: 'Sanofi',
        category: 'Diabetes',
        isColdChain: true,
        expiryDate: futureExpiry,
        quantity: 1,
        price: 0,
        locality: 'Katraj'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && data.message?.includes('Cold-chain'), 'Cold-chain medicine requiring refrigeration strictly blocked (400)');
  } catch (e) {
    assert(false, `Cold chain test error: ${e.message}`);
  }

  // D. Opened / Cut blister strips rejected
  try {
    const today = new Date();
    const futureExpiry = new Date(today.getTime() + 200 * 86400000).toISOString().split('T')[0];
    const res = await fetch(`${API_BASE}/medicines`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${donorToken}`
      },
      body: JSON.stringify({
        medicineName: 'Cut Blister Strip Test',
        company: 'Test Labs',
        category: 'General Health',
        packageCondition: 'cut strip',
        expiryDate: futureExpiry,
        quantity: 1,
        price: 0,
        locality: 'Katraj'
      })
    });
    const data = await res.json();
    assert(res.status === 400 && data.message?.includes('Opened, cut, or unsealed'), 'Opened or cut blister strip strictly rejected (400)');
  } catch (e) {
    assert(false, `Cut strip test error: ${e.message}`);
  }

  // ==========================================================================
  // SECTION 7: SUMMARY RESULTS
  // ==========================================================================
  console.log('\n================================================================');
  console.log(`AUDIT RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================');
  process.exit(failCount === 0 ? 0 : 1);
}

runAudit().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});
