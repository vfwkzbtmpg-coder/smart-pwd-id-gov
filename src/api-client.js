/**
 * Smart PWD ID — API client for static hosting
 * ============================================
 *
 * The site used to be served by server/server.js, which held the Supabase
 * service-role key and answered fourteen /api/* endpoints. On a static host
 * there is no server at all, so this file answers those same endpoints in the
 * visitor's browser using the publishable key, backed by the policies added in
 * migration 014_public_static_hosting_anon_access.sql.
 *
 * No page was rewritten. Every page still calls fetch('/api/...') exactly as
 * before — this file wraps window.fetch and only takes over requests addressed
 * to /api/ on this origin. Everything else (the Supabase client's own traffic,
 * the translation files, the clip manifest) is passed straight through.
 *
 * Response bodies keep the shapes server.js returned, so the calling code in
 * the pages did not have to change.
 *
 * Endpoints that could not survive the move:
 *   /api/nfc/*      the USB reader is driven by a kiosk service running on the
 *                   kiosk PC. NFC_KIOSK_URL below points at it; a page opened
 *                   anywhere else simply reports the reader as offline.
 *   /api/fsl-videos a static host cannot list a directory, so the clips are
 *                   declared in fsl-videos/manifest.json instead.
 *
 * Optional overrides — declare this before loading this file:
 *   window.SMART_PWD_CONFIG = { nfcKioskUrl: 'https://kiosk.example.org' };
 */
(function (global) {
  'use strict';

  var CONFIG = {
    nfcKioskUrl: 'http://127.0.0.1:8000',
    fslManifestUrl: 'fsl-videos/manifest.json',
  };
  if (global.SMART_PWD_CONFIG) {
    Object.keys(global.SMART_PWD_CONFIG).forEach(function (key) {
      if (global.SMART_PWD_CONFIG[key]) CONFIG[key] = global.SMART_PWD_CONFIG[key];
    });
  }

  var nativeFetch = global.fetch ? global.fetch.bind(global) : null;
  if (!nativeFetch) return;

  var UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  var DATE_LIKE = /^[0-9]{1,4}[/.-][0-9]{1,2}[/.-][0-9]{2,4}$/;
  var VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)$/i;

  var PROFILE_FIELDS = 'id,first_name,last_name,id_number,application_status,role,valid_until,approved_at';
  var PROFILE_FIELDS_WITH_METHODS = PROFILE_FIELDS + ',qr_enabled,nfc_enabled';

  // Probed once and remembered: a database that has not run migration 012 yet
  // still verifies by ID number instead of refusing every card in the field.
  var qrTokenColumnReady = null;

  var KIOSK_OFFLINE = {
    ok: false,
    message: 'The NFC reader service is not running. Start it with "python server.py" '
      + 'in public/nfc/NFC VERIFY, then keep the ESP32 plugged in.',
  };

  // ------------------------------- plumbing -------------------------------

  function jsonResponse(body, status) {
    return new Response(JSON.stringify(body), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // The CDN build of supabase-js leaves window.supabase holding the module
  // namespace (createClient) rather than a ready client, and the pages that
  // install one — js/auth.js and src/supabaseClient.js — load after this file.
  // verify.html proves the order cannot be relied on: its deep-link handler
  // runs on DOMContentLoaded, before either of them has executed. Creating the
  // client here on first use removes that dependency; every caller that runs
  // afterwards finds the same instance already in place.
  var SUPABASE_URL = 'https://fvyinioymlegzfhrahbt.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_dKUs94y6AVkpr3LobPq1eQ_48Oeu-i7';

  function client() {
    var instance = global.supabase;
    if (instance && typeof instance.from === 'function') return instance;
    if (instance && typeof instance.createClient === 'function') {
      instance = instance.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      global.supabase = instance;
      return instance;
    }
    throw new Error('The Supabase client is not available on this page.');
  }

  function formatDate(value) {
    if (!value) return null;
    var date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: '2-digit',
    });
  }

  /** 128 bits of randomness: an ID number is guessable, this is not. */
  function newQrToken() {
    var bytes = new Uint8Array(16);
    global.crypto.getRandomValues(bytes);
    var out = '';
    for (var i = 0; i < bytes.length; i++) out += ('0' + bytes[i].toString(16)).slice(-2);
    return out;
  }

  function randomDigits(count) {
    return String(Math.floor(Math.random() * Math.pow(10, count))).padStart(count, '0');
  }

  async function qrTokenSupported() {
    if (qrTokenColumnReady !== null) return qrTokenColumnReady;
    var probe = await client().from('profiles').select('qr_token').limit(1);
    qrTokenColumnReady = !(probe.error && /qr_token/i.test(probe.error.message || ''));
    return qrTokenColumnReady;
  }

  async function sessionUser() {
    try {
      var result = await client().auth.getSession();
      return (result && result.data && result.data.session && result.data.session.user) || null;
    } catch (_) {
      return null;
    }
  }

  /** The signed-in caller and their role, or null when nobody is signed in. */
  async function caller() {
    var user = await sessionUser();
    if (!user) return null;
    var profile = await client().from('profiles').select('role').eq('id', user.id).limit(1);
    var role = (profile.data && profile.data[0] && profile.data[0].role) || 'pwd';
    return { uid: user.id, role: role, user: user };
  }

  /**
   * Both columns are cleared because the kiosk writes nfc_uid (migration 010)
   * while older deployments still carry nfc_id; clearing only one leaves the
   * card verifying on the other.
   */
  async function clearNfcBinding(userId) {
    var both = await client()
      .from('profiles')
      .update({ nfc_uid: null, nfc_id: null })
      .eq('id', userId)
      .select('id');
    // A refused update is not an error under row level security, it simply
    // matches no rows — so the row that comes back is the proof it happened.
    if (!both.error) return !!(both.data && both.data.length);
    if (!/nfc_uid/i.test(both.error.message || '')) return false;
    var legacy = await client()
      .from('profiles')
      .update({ nfc_id: null })
      .eq('id', userId)
      .select('id');
    return !legacy.error && !!(legacy.data && legacy.data.length);
  }

  function flatMessage(row) {
    return {
      id: row.id,
      userId: row.user_id,
      senderRole: row.sender_role || 'pwd',
      body: row.body || '',
      createdAt: row.created_at || null,
    };
  }

  // -------------------------- POST /api/verify ----------------------------
  // Verifies a printed card's QR code or NFC tag. Runs as a signed-out visitor,
  // which is exactly why migration 014 exists.
  async function verify(body) {
    var user = client();
    var pwdId = body.pwdId;
    var methodKey = String(body.method || 'Manual').trim().toUpperCase();

    if (!pwdId) {
      return jsonResponse({ ok: false, message: 'PWD ID is required for verification.' }, 400);
    }

    // Look up by id_number first (e.g. "2026-0000-4821") and fall back to UUID.
    var byUuid = /^[0-9a-fA-F-]{36}$/.test(String(pwdId));

    async function lookupProfile(includeMethodSettings) {
      var query = user.from('profiles').select(
        includeMethodSettings ? PROFILE_FIELDS_WITH_METHODS : PROFILE_FIELDS
      );
      query = byUuid ? query.eq('id', pwdId) : query.eq('id_number', pwdId);
      return query.limit(1);
    }

    var first = await lookupProfile(true);
    var profiles = first.data;
    var error = first.error;
    // Verification keeps working while migration 011 is pending.
    if (error && /qr_enabled|nfc_enabled/i.test(error.message || '')) {
      var second = await lookupProfile(false);
      profiles = second.data;
      error = second.error;
    }
    if (error) throw new Error('Database error during verification.');

    var account = profiles && profiles[0];

    // The holder's secret is read in its own query so a database without
    // migration 012 still verifies by ID number, exactly as before.
    var expectedToken = null;
    if (await qrTokenSupported()) {
      var tokenQuery = user.from('profiles').select('qr_token');
      tokenQuery = byUuid ? tokenQuery.eq('id', pwdId) : tokenQuery.eq('id_number', pwdId);
      var tokenRows = await tokenQuery.limit(1);
      expectedToken = (tokenRows.data && tokenRows.data[0] && tokenRows.data[0].qr_token) || null;
    }
    var suppliedToken = String(body.token || '').trim();
    // A holder that has never been issued a token is not held to one, so cards
    // printed before migration 012 keep working.
    var staleToken = !!(expectedToken && suppliedToken !== expectedToken);

    var expired = !!(account && account.valid_until
      && String(account.valid_until).slice(0, 10) < new Date().toISOString().slice(0, 10));
    var methodDisabled = !!(account && (
      (methodKey === 'QR' && account.qr_enabled === false)
      || (methodKey === 'NFC' && account.nfc_enabled === false)
    ));
    var isApproved = !!(
      account
      && account.application_status === 'Approved'
      && account.role === 'pwd'
      && !expired
      && !methodDisabled
      && !staleToken
    );
    var failureReason = isApproved ? null
      : !account ? 'ID not found'
      : account.role !== 'pwd' ? 'Not a PWD account'
      : account.application_status !== 'Approved' ? 'Application status: ' + account.application_status
      : expired ? 'ID expired'
      : methodDisabled ? methodKey + ' verification is disabled by the cardholder'
      : staleToken ? 'Code is out of date'
      : 'ID is not valid';

    // Log every verification attempt, success or failure.
    try {
      await user.from('verification_transactions').insert({
        pwd_id: account ? account.id : '00000000-0000-0000-0000-000000000000',
        verifier_id: body.verifierId || null,
        method: ['QR', 'NFC', 'RFID', 'MANUAL'].indexOf(methodKey) >= 0
          ? (methodKey === 'MANUAL' ? 'Manual' : methodKey)
          : 'Manual',
        result: isApproved ? 'Success' : 'Failed',
        failure_reason: failureReason,
      });
    } catch (_) {
      // A verification that cannot be logged is still a verification.
    }

    if (!isApproved) {
      return jsonResponse({
        ok: false,
        message: staleToken
          ? 'This code is no longer valid. The PWD ID was reissued after this code was printed — ask the holder for their latest card.'
          : methodDisabled
          ? methodKey + ' verification is disabled by the cardholder.'
          : expired
          ? 'This PWD ID has expired.'
          : 'PWD ID not found, is not valid, or has not been approved yet.',
      }, (methodDisabled || staleToken) ? 403 : 404);
    }

    // The printed card lives on pwd_applications. profiles only holds the
    // identity and the issued ID number, so pull the newest application row.
    var card = null;
    var cards = await user
      .from('pwd_applications')
      .select('photo_url,signature_url,bg_front,birthdate,sex,blood_type,emergency_name,emergency_contact,address,disability_type,reviewed_at,submitted_at')
      .eq('user_id', account.id)
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (!cards.error) {
      var row = (cards.data && cards.data[0]) || {};
      // Rows written before migration 005 kept the birthdate inside
      // disability_type; a date-like value there IS the birthdate.
      var legacyDisabilityType = String(row.disability_type || '').trim();
      var legacyBirthdate = DATE_LIKE.test(legacyDisabilityType) ? legacyDisabilityType : '';
      card = {
        photoUrl: row.photo_url || '',
        signatureUrl: row.signature_url || '',
        bgFront: String(row.bg_front || '').toLowerCase(),
        birthdate: String(row.birthdate || '').trim() || legacyBirthdate,
        sex: row.sex || '',
        bloodType: row.blood_type || '',
        disabilityType: legacyBirthdate ? '' : legacyDisabilityType,
        emergencyName: row.emergency_name || '',
        emergencyContact: row.emergency_contact || '',
        address: row.address || '',
        dateIssued: row.reviewed_at || row.submitted_at || null,
      };
    }

    return jsonResponse({
      ok: true,
      message: 'PWD ID is valid.',
      method: methodKey === 'MANUAL' ? 'Manual' : methodKey,
      account: {
        id: account.id,
        idNumber: account.id_number,
        firstName: account.first_name || '—',
        lastName: account.last_name || '—',
        validUntil: formatDate(account.valid_until),
        approvedAt: formatDate(account.approved_at),
      },
      card: card,
    });
  }

  // ---------------------- GET /api/profiles/stats -------------------------
  // Read by the admin console only. Row level security answers a query it
  // refuses with zero rows rather than an error, so a signed-out or stale
  // session would otherwise be handed a full set of zeros that looks like real
  // statistics. Ask for a session first and say so plainly.
  async function stats() {
    if (!await caller()) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);
    var user = client();
    var todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    var monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    function count(table, apply) {
      var query = user.from(table).select('*', { count: 'exact', head: true });
      if (apply) query = apply(query);
      return query;
    }

    var results = await Promise.all([
      count('profiles'),
      count('profiles', function (q) { return q.eq('application_status', 'Approved'); }),
      count('profiles', function (q) { return q.eq('application_status', 'Pending'); }),
      count('pwd_applications', function (q) { return q.eq('status', 'Pending'); }),
      count('verification_transactions', function (q) { return q.gte('created_at', todayStart.toISOString()); }),
      count('verification_transactions', function (q) { return q.gte('created_at', monthAgo.toISOString()); }),
    ]);

    var failure = results.find(function (r) { return r.error; });
    if (failure) throw failure.error;

    var value = function (index) { return results[index].count || 0; };
    return jsonResponse({
      ok: true,
      total: value(0),
      approved: value(1),
      pending: value(2),
      pendingApplications: value(3),
      verificationsToday: value(4),
      verificationsLast30Days: value(5),
    });
  }

  // ------------------- GET /api/verification-logs -------------------------
  async function verificationLogs(searchParams) {
    if (!await caller()) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);
    var limit = Math.min(Number(searchParams.get('limit')) || 100, 500);
    var result = await client()
      .from('verification_transactions')
      .select('id, method, result, failure_reason, establishment, location, created_at,' +
        'pwd:profiles!verification_transactions_pwd_id_fkey(id_number,first_name,last_name),' +
        'verifier:profiles!verification_transactions_verifier_id_fkey(first_name,last_name)')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (result.error) throw result.error;
    return jsonResponse({ ok: true, logs: result.data || [] });
  }

  // ---------------------- GET /api/establishments -------------------------
  async function establishments() {
    if (!await caller()) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);
    var result = await client()
      .from('profiles')
      .select('id, first_name, last_name, mobile, account_type, role, id_number, application_status, approved_at, valid_until, created_at')
      .eq('account_type', 'establishment')
      .order('created_at', { ascending: false });
    if (result.error) throw result.error;

    var flat = (result.data || []).map(function (row) {
      return {
        id: row.id,
        name: [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || 'Unnamed Establishment',
        mobile: row.mobile || '',
        idNumber: row.id_number || '',
        role: row.role || 'verifier',
        status: row.application_status || 'Not Submitted',
        approvedAt: row.approved_at || null,
        validUntil: row.valid_until || null,
        createdAt: row.created_at || null,
      };
    });
    return jsonResponse({ ok: true, establishments: flat });
  }

  var APPLICATION_FIELDS_WITH_USER =
    'id, status, submitted_at, reviewed_at, reviewed_by, review_notes, disability_type, disability_id_no,' +
    'birthdate, sex, blood_type, emergency_name, emergency_contact, address, signature_url, bg_front,' +
    'id_front_url, id_back_url, photo_url, medical_cert_url, barangay_cert_url, user_id,' +
    'user:profiles!pwd_applications_user_id_fkey(id_number,first_name,last_name,mobile,application_status,valid_until)';

  var APPLICATION_FIELDS_REFRESH =
    'id, status, submitted_at, reviewed_at, reviewed_by, review_notes, disability_type, disability_id_no,' +
    'birthdate, sex, blood_type, emergency_name, emergency_contact, address, signature_url, bg_front, user_id,' +
    'user:profiles!pwd_applications_user_id_fkey(id_number,first_name,last_name,mobile,application_status,valid_until)';

  function flattenApplication(row) {
    var u = row.user || {};
    // Migration 005 moved the birthdate into its own column, but rows written
    // before that still hold a date inside disability_type.
    var legacyDisabilityType = String(row.disability_type || '').trim();
    var legacyBirthdate = DATE_LIKE.test(legacyDisabilityType) ? legacyDisabilityType : '';
    return {
      id: row.id,
      user_id: row.user_id,
      userName: [u.first_name, u.last_name].filter(Boolean).join(' ').trim() || 'Unnamed applicant',
      // Emails live in auth.users, which is not reachable from a browser. The
      // admin console shows a blank here where the server used to fill it in.
      userEmail: '',
      userMobile: u.mobile || '',
      idNumber: u.id_number || '',
      applicationStatus: u.application_status || row.status || 'Not Submitted',
      status: row.status || 'Pending',
      submittedAt: row.submitted_at || null,
      reviewedAt: row.reviewed_at || null,
      reviewedBy: row.reviewed_by || null,
      reviewNotes: row.review_notes || '',
      birthdate: row.birthdate || legacyBirthdate,
      disabilityType: legacyBirthdate ? '' : legacyDisabilityType,
      sex: row.sex || '',
      bloodType: row.blood_type || '',
      emergencyName: row.emergency_name || '',
      emergencyContact: row.emergency_contact || '',
      address: row.address || '',
      signatureUrl: row.signature_url || '',
      bgFront: row.bg_front || '',
      disabilityIdNo: row.disability_id_no || '',
      validUntil: u.valid_until || null,
      idFrontUrl: row.id_front_url || '',
      idBackUrl: row.id_back_url || '',
      photoUrl: row.photo_url || '',
      medicalCertUrl: row.medical_cert_url || '',
      barangayCertUrl: row.barangay_cert_url || '',
    };
  }

  // ---------------------- GET /api/applications ---------------------------
  // Read by the admin console only; see the note on stats() about why a
  // missing session has to be reported rather than answered with an empty list.
  async function listApplications(searchParams) {
    if (!await caller()) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);
    var statusFilter = (searchParams.get('status') || '').trim();
    var userIdFilter = (searchParams.get('user_id') || '').trim();

    var query = client()
      .from('pwd_applications')
      .select(APPLICATION_FIELDS_WITH_USER)
      .order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('status', statusFilter);
    if (userIdFilter) query = query.eq('user_id', userIdFilter);

    var result = await query;
    if (result.error) throw result.error;
    return jsonResponse({ ok: true, applications: (result.data || []).map(flattenApplication) });
  }

  // ------------------ PUT /api/applications/:id ---------------------------
  // Admin review action: Approve, Reject or set any other review status.
  async function updateApplication(appId, body) {
    var user = client();
    var nextStatus = String(body.status || '').trim();
    var reviewNotes = (typeof body.reviewNotes === 'string') ? body.reviewNotes : null;
    // reviewed_by is a uuid column: a non-uuid value (e.g. the role name
    // "admin") would fail the whole UPDATE.
    var reviewedByRaw = (typeof body.reviewedBy === 'string') ? body.reviewedBy.trim() : '';
    var reviewedBy = UUID_RE.test(reviewedByRaw) ? reviewedByRaw : null;
    // The card background is an LGU slug, never a path — so a stray "../" or a
    // full URL can never end up in the column. An empty string means "clear".
    var bgFrontProvided = (typeof body.bgFront === 'string');
    var bgFrontRaw = bgFrontProvided ? body.bgFront.trim() : '';
    var bgFront = bgFrontRaw
      ? bgFrontRaw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
      : '';

    var validStatuses = ['Approved', 'Rejected', 'Submitted', 'Pending', 'Under Review', 'Needs Revision'];
    var hasStatus = !!nextStatus;
    if (!appId) return jsonResponse({ ok: false, message: 'Application id is required.' }, 400);
    if (!hasStatus && !bgFrontProvided) {
      return jsonResponse({ ok: false, message: 'Provide a status, a bgFront, or both.' }, 400);
    }
    if (hasStatus && validStatuses.indexOf(nextStatus) < 0) {
      return jsonResponse({ ok: false, message: 'Invalid status. Must be one of: ' + validStatuses.join(', ') }, 400);
    }

    var now = new Date().toISOString();

    var current = await user
      .from('pwd_applications')
      .select('id, user_id, status, disability_type, disability_id_no')
      .eq('id', appId)
      .limit(1)
      .maybeSingle();
    if (current.error) throw new Error('pwd_applications load: ' + current.error.message);
    if (!current.data) return jsonResponse({ ok: false, message: 'Application not found.' }, 404);
    var userId = current.data.user_id;

    var patch = { updated_at: now };
    if (bgFrontProvided) patch.bg_front = bgFront || null;
    if (hasStatus) {
      patch.status = nextStatus;
      if (nextStatus === 'Approved' || nextStatus === 'Rejected') {
        patch.reviewed_at = now;
        if (reviewedBy) patch.reviewed_by = reviewedBy;
      }
    }
    if (reviewNotes != null) patch.review_notes = reviewNotes;

    var updated = await user.from('pwd_applications').update(patch).eq('id', appId).select('id');
    if (updated.error) throw new Error('pwd_applications update: ' + updated.error.message);
    // Only an administrator may review an application (003). A refusal comes
    // back as no error and no rows, which must not be reported as a decision
    // that was made.
    if (!updated.data || !updated.data.length) {
      return jsonResponse({ ok: false, message: 'Only an administrator can review applications.' }, 403);
    }

    // Mirror the status onto profiles so the holder's dashboard sees it.
    if (userId && hasStatus) {
      var profilePatch = { updated_at: now };

      if (nextStatus === 'Approved') {
        profilePatch.application_status = 'Approved';
        var profile = await user
          .from('profiles')
          .select('id_number, valid_until')
          .eq('id', userId)
          .limit(1)
          .maybeSingle();
        if (profile.error) throw new Error('profiles load: ' + profile.error.message);
        var existing = profile.data;
        if (!existing || !existing.id_number) {
          profilePatch.id_number = '2026-' + randomDigits(4) + '-' + randomDigits(4);
        }
        if (!existing || !existing.valid_until) {
          profilePatch.valid_until = new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString();
        }
      } else if (nextStatus === 'Rejected') {
        profilePatch.application_status = 'Rejected';
      } else if (nextStatus === 'Pending' || nextStatus === 'Under Review') {
        profilePatch.application_status = nextStatus;
      } else if (nextStatus === 'Needs Revision') {
        profilePatch.application_status = 'Needs Revision';
      } else if (nextStatus === 'Submitted') {
        // "Mark Submitted" clears a previous decision, so the holder goes back
        // to having no approved profile and no verifiable ID.
        profilePatch.application_status = 'Not Submitted';
      }

      // Every decision reissues the holder's code: an ID number is guessable
      // and a printed card can be photocopied.
      if ((nextStatus === 'Approved' || nextStatus === 'Rejected') && await qrTokenSupported()) {
        profilePatch.qr_token = newQrToken();
      }

      var profileUpdate = await user.from('profiles').update(profilePatch).eq('id', userId);
      if (profileUpdate.error) throw new Error('profiles update: ' + profileUpdate.error.message);

      // A rejected holder must not still get through by tapping the old tag.
      if (nextStatus === 'Rejected') await clearNfcBinding(userId);
    }

    var refreshed = await user
      .from('pwd_applications')
      .select(APPLICATION_FIELDS_REFRESH)
      .eq('id', appId)
      .limit(1)
      .maybeSingle();
    if (refreshed.error) throw new Error('refetch: ' + refreshed.error.message);

    var row = refreshed.data || {};
    var joined = row.user || {};
    return jsonResponse({
      ok: true,
      application: {
        id: row.id || appId,
        user_id: userId,
        userName: [joined.first_name, joined.last_name].filter(Boolean).join(' ').trim() || '',
        userEmail: '',
        idNumber: joined.id_number || '',
        applicationStatus: joined.application_status || row.status || nextStatus,
        status: row.status || nextStatus,
        submittedAt: row.submitted_at || null,
        reviewedAt: row.reviewed_at || now,
        validUntil: joined.valid_until || null,
        birthdate: row.birthdate || '',
        disabilityType: row.disability_type || '',
        sex: row.sex || '',
        bloodType: row.blood_type || '',
        emergencyName: row.emergency_name || '',
        emergencyContact: row.emergency_contact || '',
        address: row.address || '',
        signatureUrl: row.signature_url || '',
        bgFront: row.bg_front || '',
      },
    });
  }

  // ---------------- POST /api/submit-application --------------------------
  async function submitApplication(body) {
    var user = client();
    var uid = body.userId ? String(body.userId) : '';
    if (!uid) return jsonResponse({ ok: false, message: 'userId is required.' }, 400);
    if (!body.birthdate || !body.contact || !body.address || !body.status || !body.country) {
      return jsonResponse({
        ok: false,
        message: 'birthdate, contact, address, status, and country are all required.',
      }, 400);
    }

    var now = new Date().toISOString();
    var fileData = (body.files && typeof body.files === 'object') ? body.files : {};
    var nameData = (body.fileNames && typeof body.fileNames === 'object') ? body.fileNames : {};

    function pick(key) { return fileData[key] || ''; }
    // The server trimmed these and stored an empty value as NULL; a
    // whitespace-only entry must not land in the column as a space.
    function optional(value) {
      return (typeof value === 'string' && value.trim()) ? value.trim() : null;
    }
    var signatureUrl = pick('signature');
    var fileSummary = Object.keys(nameData).map(function (key) { return key + ': ' + nameData[key]; }).join(', ');

    var reviewNotes = 'Address: ' + body.address
      + ' | Contact: ' + body.contact
      + ' | Status: ' + String(body.status)
      + ' | Country: ' + String(body.country)
      + (fileSummary ? ' | Files: ' + fileSummary : '')
      + (signatureUrl ? ' | Signature: uploaded' : '');

    // Ensure the profile row exists before writing pwd_applications, in case
    // the auth trigger has not materialised it yet.
    var existingProfile = await user.from('profiles').select('id').eq('id', uid).limit(1);
    if (existingProfile.error) throw new Error('profiles check: ' + existingProfile.error.message);

    if (!existingProfile.data || !existingProfile.data.length) {
      // The server read this from the Auth admin API; the browser only has the
      // signed-in user's own metadata, which is the case that matters here.
      var current = await sessionUser();
      var metadata = (current && current.id === uid && current.user_metadata) ? current.user_metadata : {};
      var accountType = metadata.account_type ? String(metadata.account_type) : 'pwd';
      var role = accountType === 'establishment' ? 'verifier' : (accountType === 'admin' ? 'admin' : 'pwd');

      var seeded = await user.from('profiles').insert({
        id: uid,
        first_name: metadata.first_name ? String(metadata.first_name) : (metadata.firstName ? String(metadata.firstName) : ''),
        last_name: metadata.last_name ? String(metadata.last_name) : (metadata.lastName ? String(metadata.lastName) : ''),
        mobile: metadata.mobile ? String(metadata.mobile) : (metadata.phone ? String(metadata.phone) : String(body.contact)),
        account_type: accountType,
        role: role,
        id_number: role === 'verifier'
          ? 'EST-' + randomDigits(4)
          : '2026-' + randomDigits(4) + '-' + randomDigits(4),
        application_status: role === 'verifier' ? 'Approved' : 'Not Submitted',
        valid_until: role === 'pwd' ? new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000).toISOString() : null,
      });
      if (seeded.error) throw new Error('profiles insert: ' + seeded.error.message);
    }

    var profileUpdate = await user.from('profiles').update({
      mobile: String(body.contact),
      application_status: 'Pending',
      updated_at: now,
    }).eq('id', uid);
    if (profileUpdate.error) throw new Error('profiles update: ' + profileUpdate.error.message);

    var applicationFields = {
      status: 'Pending',
      submitted_at: now,
      birthdate: String(body.birthdate),
      disability_type: optional(body.disabilityType),
      sex: optional(body.sex),
      blood_type: optional(body.bloodType),
      emergency_name: optional(body.emergencyName),
      emergency_contact: optional(body.emergencyContact),
      address: String(body.address),
      signature_url: signatureUrl,
      disability_id_no: String(body.country) + ' / ' + String(body.status),
      review_notes: reviewNotes,
      photo_url: pick('picture'),
      id_front_url: pick('valid-id'),
      id_back_url: pick('old-id'),
      medical_cert_url: pick('medical-cert'),
      barangay_cert_url: pick('affidavit'),
      updated_at: now,
    };

    var existing = await user.from('pwd_applications').select('id').eq('user_id', uid).limit(1);
    if (existing.error) throw new Error('pwd_applications select: ' + existing.error.message);

    if (existing.data && existing.data.length) {
      var updated = await user.from('pwd_applications').update(applicationFields).eq('id', existing.data[0].id);
      if (updated.error) throw new Error('pwd_applications update: ' + updated.error.message);
    } else {
      var inserted = await user.from('pwd_applications').insert(Object.assign({ user_id: uid }, applicationFields));
      if (inserted.error) throw new Error('pwd_applications insert: ' + inserted.error.message);
    }

    return jsonResponse({ ok: true, submittedAt: now });
  }

  // --------------- GET/PUT /api/pwd/verification-settings -----------------
  // Cardholders manage only their own preferences.
  var SETTINGS_FIELDS = 'qr_enabled,nfc_enabled,nfc_id';

  function settingsPayload(row, includeAvailable) {
    var payload = {
      ok: true,
      qrEnabled: row.qr_enabled !== false,
      nfcEnabled: row.nfc_enabled !== false,
      nfcLinked: !!row.nfc_id,
    };
    if (includeAvailable) payload.settingsAvailable = true;
    return payload;
  }

  async function getVerificationSettings() {
    var user = client();
    var signedIn = await caller();
    if (!signedIn) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);

    var result = await user.from('profiles').select(SETTINGS_FIELDS).eq('id', signedIn.uid).maybeSingle();

    // Verification still works while migration 011 is pending.
    if (result.error && /qr_enabled|nfc_enabled/i.test(result.error.message || '')) {
      var legacy = await user.from('profiles').select('nfc_id').eq('id', signedIn.uid).maybeSingle();
      if (legacy.error) throw legacy.error;
      if (!legacy.data) return jsonResponse({ ok: false, message: 'Your profile could not be found.' }, 404);
      return jsonResponse({
        ok: true,
        qrEnabled: true,
        nfcEnabled: true,
        nfcLinked: !!legacy.data.nfc_id,
        settingsAvailable: false,
      });
    }
    if (result.error) {
      return jsonResponse({ ok: false, message: 'Could not load verification settings.' }, 500);
    }
    if (!result.data) return jsonResponse({ ok: false, message: 'Your profile could not be found.' }, 404);

    return jsonResponse(settingsPayload(result.data, true));
  }

  async function saveVerificationSettings(body) {
    var user = client();
    var signedIn = await caller();
    if (!signedIn) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);

    var patch = {};
    if (typeof body.qrEnabled === 'boolean') patch.qr_enabled = body.qrEnabled;
    if (typeof body.nfcEnabled === 'boolean') patch.nfc_enabled = body.nfcEnabled;
    if (!Object.keys(patch).length) {
      return jsonResponse({ ok: false, message: 'Choose a QR or NFC setting to update.' }, 400);
    }

    var result = await user
      .from('profiles')
      .update(patch)
      .eq('id', signedIn.uid)
      .select(SETTINGS_FIELDS)
      .maybeSingle();
    if (result.error) {
      // The patch names qr_enabled/nfc_enabled, so a database that has not run
      // migration 011 rejects the whole statement by column name.
      var needsMigration = /qr_enabled|nfc_enabled/i.test(result.error.message || '');
      return jsonResponse({
        ok: false,
        message: needsMigration
          ? 'Verification settings need database migration 011_verification_method_settings.sql.'
          : 'Could not save verification settings.',
      }, 500);
    }
    if (!result.data) return jsonResponse({ ok: false, message: 'Your profile could not be found.' }, 404);

    return jsonResponse(settingsPayload(result.data, false));
  }

  // ------------------ DELETE /api/pwd/nfc-card ----------------------------
  async function removeOwnNfcCard() {
    var user = client();
    var signedIn = await caller();
    if (!signedIn) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);

    var profile = await user.from('profiles').select('id').eq('id', signedIn.uid).maybeSingle();
    if (profile.error) throw profile.error;
    if (!profile.data) return jsonResponse({ ok: false, message: 'Your profile could not be found.' }, 404);

    if (!await clearNfcBinding(signedIn.uid)) {
      return jsonResponse({ ok: false, message: 'Could not unlink the NFC card. Please try again.' }, 500);
    }

    return jsonResponse({ ok: true, nfcLinked: false, message: 'The lost NFC card has been unlinked.' });
  }

  // ------------- DELETE /api/profiles/:userId/nfc-card --------------------
  // The same action run by an administrator from the console.
  async function removeNfcCardAsAdmin(userId) {
    var signedIn = await caller();
    if (!signedIn) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);
    if (signedIn.role !== 'admin') {
      return jsonResponse({ ok: false, message: 'Only an administrator can unlink a cardholder\u2019s NFC card.' }, 403);
    }
    if (!UUID_RE.test(userId)) {
      return jsonResponse({ ok: false, message: 'A valid cardholder id is required.' }, 400);
    }

    if (!await clearNfcBinding(userId)) {
      return jsonResponse({ ok: false, message: 'Could not unlink the NFC card. Please try again.' }, 500);
    }

    return jsonResponse({ ok: true, nfcLinked: false, message: 'The lost NFC card has been unlinked.' });
  }

  // ---------------------------- /api/messages -----------------------------
  async function listMessages(searchParams) {
    var user = client();
    var signedIn = await caller();
    if (!signedIn) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);

    var isAdmin = signedIn.role === 'admin';
    var requested = (searchParams.get('user_id') || '').trim();
    var userId = isAdmin ? (requested || signedIn.uid) : signedIn.uid;
    if (!UUID_RE.test(userId)) {
      return jsonResponse({ ok: false, message: 'A valid applicant id is required.' }, 400);
    }

    var result = await user
      .from('messages')
      .select('id, user_id, sender_role, body, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(500);
    if (result.error) throw result.error;

    return jsonResponse({ ok: true, messages: (result.data || []).map(flatMessage) });
  }

  async function sendMessage(body) {
    var user = client();
    var signedIn = await caller();
    if (!signedIn) return jsonResponse({ ok: false, message: 'Please log in again.' }, 401);

    var text = (typeof body.body === 'string') ? body.body.trim() : '';
    if (!text) return jsonResponse({ ok: false, message: 'Write a message first.' }, 400);

    // The sender role comes from the signed-in account, never from the request.
    var isAdmin = signedIn.role === 'admin';
    var requested = (typeof body.userId === 'string') ? body.userId.trim() : '';
    var userId = isAdmin ? (requested || signedIn.uid) : signedIn.uid;
    if (!UUID_RE.test(userId)) {
      return jsonResponse({ ok: false, message: 'A valid applicant id is required.' }, 400);
    }

    var result = await user
      .from('messages')
      .insert({
        user_id: userId,
        sender_role: isAdmin ? 'admin' : 'pwd',
        body: text.slice(0, 4000),
      })
      .select('id, user_id, sender_role, body, created_at')
      .single();
    if (result.error) throw result.error;

    return jsonResponse({ ok: true, message: flatMessage(result.data) });
  }

  // ------------------------- /api/nfc/* (kiosk) ---------------------------
  // The USB reader is driven by the Python kiosk service. A page opened on the
  // kiosk PC reaches it directly; anywhere else reports it as offline.
  async function callKiosk(pathname, init) {
    var controller = new AbortController();
    var timer = setTimeout(function () { controller.abort(); }, 8000);
    try {
      var response = await nativeFetch(CONFIG.nfcKioskUrl.replace(/\/+$/, '') + pathname,
        Object.assign({}, init, { signal: controller.signal }));
      var text = await response.text();
      var json = null;
      try { json = JSON.parse(text); } catch (_) {}
      return { ok: response.ok, offline: false, json: json };
    } catch (_) {
      return { ok: false, offline: true, json: null };
    } finally {
      clearTimeout(timer);
    }
  }

  async function enrollNfc(body) {
    var userId = (body && typeof body.userId === 'string') ? body.userId.trim() : '';
    if (!UUID_RE.test(userId)) {
      return jsonResponse({ ok: false, message: 'A valid PWD ID holder is required.' }, 400);
    }
    var out = await callKiosk('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ personId: userId }),
    });
    if (out.offline) return jsonResponse(KIOSK_OFFLINE, 503);
    if (!out.ok) {
      return jsonResponse({ ok: false, message: (out.json && out.json.error) || 'The reader refused the request.' }, 502);
    }
    return jsonResponse({ ok: true, name: (out.json && out.json.name) || '' });
  }

  async function cancelNfcEnroll() {
    var out = await callKiosk('/api/enroll/cancel', { method: 'POST' });
    if (out.offline) return jsonResponse(KIOSK_OFFLINE, 503);
    return jsonResponse({ ok: true });
  }

  async function nfcState() {
    var out = await callKiosk('/api/state');
    if (out.offline) return jsonResponse(KIOSK_OFFLINE, 503);
    var state = out.json || {};
    return jsonResponse({
      ok: true,
      serial: state.serial || { connected: false, message: 'Unknown' },
      enrolling: !!state.enrolling,
      enrollName: state.enrollName || '',
      last: state.last || null,
    });
  }

  // ---------------------- GET /api/fsl-videos -----------------------------
  // A static host cannot list a directory, so the clips are declared in
  // fsl-videos/manifest.json. Add a file to that list when you add a clip.
  async function fslVideos() {
    try {
      var response = await nativeFetch(CONFIG.fslManifestUrl, { cache: 'no-store' });
      if (!response.ok) return jsonResponse({ ok: true, videos: [] });
      var names = await response.json();
      if (!Array.isArray(names)) return jsonResponse({ ok: true, videos: [] });

      var videos = names.filter(function (name) {
        return typeof name === 'string' && VIDEO_EXT.test(name);
      }).map(function (name) {
        var raw = name.replace(VIDEO_EXT, '').trim();
        // A file whose name starts with "_" is the fallback clip: it plays for
        // every sentence that has no clip of its own.
        var isDefault = raw.charAt(0) === '_';
        var label = isDefault ? raw.slice(1).trim() : raw;
        return {
          sentence: label.replace(/_+/g, ' ').trim(),
          video_url: 'fsl-videos/' + encodeURIComponent(name),
          is_default: isDefault,
        };
      });
      return jsonResponse({ ok: true, videos: videos });
    } catch (_) {
      return jsonResponse({ ok: true, videos: [] });
    }
  }

  // ------------------------------ routing ---------------------------------

  async function handle(method, url, body) {
    var path = url.pathname;

    if (path === '/api/verify' && method === 'POST') return verify(body);
    if (path === '/api/profiles/stats' && method === 'GET') return stats();
    if (path === '/api/verification-logs' && method === 'GET') return verificationLogs(url.searchParams);
    if (path === '/api/establishments' && method === 'GET') return establishments();
    if (path === '/api/applications' && method === 'GET') return listApplications(url.searchParams);
    if (path === '/api/submit-application' && method === 'POST') return submitApplication(body);
    if (path === '/api/pwd/verification-settings' && method === 'GET') return getVerificationSettings();
    if (path === '/api/pwd/verification-settings' && method === 'PUT') return saveVerificationSettings(body);
    if (path === '/api/pwd/nfc-card' && method === 'DELETE') return removeOwnNfcCard();
    if (path === '/api/messages' && method === 'GET') return listMessages(url.searchParams);
    if (path === '/api/messages' && method === 'POST') return sendMessage(body);
    if (path === '/api/nfc/enroll' && method === 'POST') return enrollNfc(body);
    if (path === '/api/nfc/enroll/cancel' && method === 'POST') return cancelNfcEnroll();
    if (path === '/api/nfc/state' && method === 'GET') return nfcState();
    if (path === '/api/fsl-videos' && method === 'GET') return fslVideos();
    if (path === '/api/health' && method === 'GET') {
      // There is no server process to report on any more.
      return jsonResponse({ ok: true, service: 'Smart PWD ID API', uptime: 0 });
    }

    var application = /^\/api\/applications\/([^/]+)$/.exec(path);
    if (application && method === 'PUT') return updateApplication(decodeURIComponent(application[1]), body);

    var adminNfc = /^\/api\/profiles\/([^/]+)\/nfc-card$/.exec(path);
    if (adminNfc && method === 'DELETE') return removeNfcCardAsAdmin(decodeURIComponent(adminNfc[1]));

    return jsonResponse({ ok: false, message: 'Not found.' }, 404);
  }

  function hrefOf(input) {
    if (typeof input === 'string') return input;
    if (input && typeof input.url === 'string') return input.url;
    return String(input);
  }

  async function readBody(input, init) {
    var raw = null;
    if (init && init.body != null) raw = init.body;
    else if (input && typeof input !== 'string' && typeof input.clone === 'function') {
      try { raw = await input.clone().text(); } catch (_) { raw = null; }
    }
    if (raw == null) return {};
    if (typeof raw === 'string') {
      try { return JSON.parse(raw) || {}; } catch (_) { return {}; }
    }
    if (typeof URLSearchParams !== 'undefined' && raw instanceof URLSearchParams) {
      var form = {};
      raw.forEach(function (value, key) { form[key] = value; });
      return form;
    }
    return {};
  }

  global.fetch = function (input, init) {
    var url = null;
    try { url = new URL(hrefOf(input), global.location.href); } catch (_) { url = null; }

    // Anything that is not an /api/ call on this origin goes to the network
    // exactly as it would have without this file.
    if (!url || url.origin !== global.location.origin || url.pathname.indexOf('/api/') !== 0) {
      return nativeFetch(input, init);
    }

    var method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();

    return (async function () {
      try {
        return await handle(method, url, await readBody(input, init));
      } catch (err) {
        // Pages expect JSON on failure, never a rejected promise.
        return jsonResponse({
          ok: false,
          message: (err && err.message) ? err.message : 'The request could not be completed.',
        }, 500);
      }
    })();
  };

  global.SmartPWDApiClient = { config: CONFIG };
})(typeof window !== 'undefined' ? window : this);
