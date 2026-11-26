/**
 * Smart PWD ID — Client-side authentication (Supabase-backed)
 *
 * This module preserves the original SmartPWDAuth / Auth global API
 * (loginUser, registerUser, currentUser, requireAuth, ...) so existing
 * pages continue to work — but the implementation now delegates to
 * Supabase Auth + the public.profiles table instead of localStorage.
 */
(function (global) {
  'use strict';

  const SUPABASE_URL = 'https://fvyinioymlegzfhrahbt.supabase.co';
  const SUPABASE_ANON_KEY =
    'sb_publishable_dKUs94y6AVkpr3LobPq1eQ_48Oeu-i7';

  const PROFILE_CACHE_KEY = 'spwd_profile_cache';

  // ---------- obtain the Supabase client (share with page if present) ----------
  function getClient() {
    if (global.supabase && typeof global.supabase.auth === 'object') {
      return global.supabase;
    }
    if (global.supabase && typeof global.supabase.createClient === 'function') {
      global.supabase = global.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      });
      return global.supabase;
    }
    return null;
  }

  function supabaseOrThrow() {
    const sb = getClient();
    if (!sb) {
      throw new Error(
        'Supabase client is not available. Load @supabase/supabase-js before auth.js.'
      );
    }
    return sb;
  }

  // ---------- cache helpers for profile data ----------
  function writeProfileCache(profile) {
    try {
      localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile || null));
    } catch (_) {}
  }

  function readProfileCache() {
    try {
      const raw = localStorage.getItem(PROFILE_CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (_) {
      return null;
    }
  }

  function clearProfileCache() {
    try {
      localStorage.removeItem(PROFILE_CACHE_KEY);
    } catch (_) {}
  }

  // ---------- convert DB row into the "redacted user" shape expected by UI ----------
  function normaliseUser(authUser, profile) {
    if (!authUser && !profile) return null;
    const authMd = (authUser && authUser.user_metadata) || {};
    const email = (authUser && authUser.email) || (profile && profile.email) || '';
    const firstName =
      (profile && profile.first_name)
      || authMd.first_name
      || authMd.firstName
      || '';
    const lastName =
      (profile && profile.last_name)
      || authMd.last_name
      || authMd.lastName
      || '';
    const mobile =
      (profile && profile.mobile)
      || authMd.mobile
      || authMd.phone
      || '';
    const accountType =
      (profile && profile.account_type)
      || authMd.account_type
      || authMd.accountType
      || 'pwd';
    const profileRole = (profile && profile.role) || authMd.role || '';
    const role =
      profileRole
      || (accountType === 'establishment' ? 'verifier' : (accountType === 'admin' ? 'admin' : 'pwd'));
    const idNumber = (profile && profile.id_number) || '';
    // The secret the holder's own QR code has to carry. Reissued by the admin
    // on every Approve / Reject, so an older printed code stops verifying.
    const qrToken = (profile && profile.qr_token) || '';
    const createdAt =
      (authUser && authUser.created_at) || (profile && profile.created_at) || new Date().toISOString();
    const appStatus = (profile && profile.application_status) || 'Not Submitted';
    const approvedAt = (profile && profile.approved_at) || null;
    const validUntil = (profile && profile.valid_until) || null;

    return {
      uid: (authUser && authUser.id) || (profile && profile.id) || null,
      email: email,
      firstName: firstName,
      lastName: lastName,
      mobile: mobile,
      accountType: accountType,
      role: role,
      idNumber: idNumber,
      qrToken: qrToken,
      createdAt: createdAt,
      validUntil: validUntil,
      application: {
        status: appStatus,
        approvedAt: approvedAt,
      },
    };
  }

  // ---------- fetch profile from public.profiles (or use cache) ----------
  async function fetchProfile(uid, options) {
    options = options || {};
    if (!uid) return null;

    if (!options.force) {
      const cached = readProfileCache();
      // A row cached before migration 012 has no qr_token, and a QR built from
      // it would be rejected by the verifier — so treat it as stale and refetch
      // once. The read below rewrites the cache, so this happens only once.
      if (cached && cached.id === uid && 'qr_token' in cached) return cached;
    }

    const sb = supabaseOrThrow();
    const { data, error } = await sb
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .limit(1);

    if (error || !data || !data.length) {
      return null;
    }
    const profile = data[0];
    writeProfileCache(profile);
    return profile;
  }

  async function getUserFromSession(session) {
    if (!session || !session.user) return null;
    let profile = null;
    try {
      profile = await fetchProfile(session.user.id);
    } catch (_) { profile = null; }
    if (!profile) {
      try {
        const sb = getClient();
        if (sb && sb.from && typeof sb.from === 'function') {
          const authMd = (session.user && session.user.user_metadata) || {};
          const role =
            (authMd.role && String(authMd.role))
            || (authMd.account_type === 'establishment' ? 'verifier'
                : (authMd.account_type === 'admin' ? 'admin' : 'pwd'));
          const uid = session.user.id;
          try {
            // NOTE: public.profiles has no `email` column (it lives in auth.users),
            // so upsert must not include it or the whole statement fails.
            await sb.from('profiles').upsert({
              id: uid,
              first_name: authMd.first_name || authMd.firstName || '',
              last_name: authMd.last_name || authMd.lastName || '',
              mobile: authMd.mobile || authMd.phone || '',
              account_type: authMd.account_type || authMd.accountType || 'pwd',
              role: role,
              updated_at: new Date().toISOString(),
            }, { onConflict: 'id', ignoreDuplicates: false });
            profile = await fetchProfile(uid, { force: true });
          } catch (_) { profile = null; }
        }
      } catch (_) { profile = null; }
    }
    const user = normaliseUser(session.user, profile);
    // Flag whether the role came from a reliable source (the profiles table)
    // or from the auth-metadata fallback, so callers don't evict a user whose
    // role merely could not be confirmed.
    if (user) user.profileLoaded = !!profile;
    return user;
  }

  // ------------------------- CORE API ----------------------------------

  async function registerUser(userData) {
    const sb = supabaseOrThrow();
    const email = (userData.email || '').trim().toLowerCase();
    const password = userData.password || '';

    if (!email) return { ok: false, message: 'Email address is required.' };
    if (password.length < 6) {
      return { ok: false, message: 'Password must be at least 6 characters.' };
    }

    const accountType = userData.accountType || 'pwd';
    const { data, error } = await sb.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          first_name: (userData.firstName || '').trim(),
          last_name: (userData.lastName || '').trim(),
          mobile: (userData.mobile || '').trim(),
          account_type: accountType,
        },
      },
    });

    if (error) return { ok: false, message: error.message };

    // signUp may auto-login OR require email confirmation.
    let user = null;
    if (data && data.user) {
      // Force a fresh profile fetch (DB trigger runs AFTER signUp completes)
      const profile = await fetchProfile(data.user.id, { force: true });
      user = normaliseUser(data.user, profile);
    }

    return {
      ok: true,
      user: user,
      session: data && data.session ? data.session : null,
      requiresEmailConfirmation: !!(data && data.user && !data.session),
    };
  }

  async function loginUser(email, password) {
    const sb = supabaseOrThrow();
    email = (email || '').trim().toLowerCase();
    if (!email || !password) {
      return { ok: false, message: 'Email and password are required.' };
    }
    const { data, error } = await sb.auth.signInWithPassword({
      email: email,
      password: password,
    });
    if (error) return { ok: false, message: error.message };
    const user = await getUserFromSession(data.session);
    return { ok: true, user: user };
  }

  async function loginUserPersistent(email, password) {
    return loginUser(email, password);
  }

  async function logoutUser() {
    clearProfileCache();
    try {
      const sb = supabaseOrThrow();
      await sb.auth.signOut();
    } catch (_) {}
  }

  async function currentUser() {
    try {
      const sb = supabaseOrThrow();
      let { data } = await sb.auth.getSession();
      let session = data && data.session ? data.session : null;

      // A transient failure (offline / DNS blip) can make getSession() return
      // nothing even though a valid session is persisted. Retry once before
      // concluding the user is signed out.
      if (!session) {
        await new Promise(function (r) { setTimeout(r, 300); });
        const retry = await sb.auth.getSession();
        session = retry && retry.data && retry.data.session ? retry.data.session : null;
      }

      // Last resort: read the persisted session straight from storage.
      if (!session) session = readStoredSession();

      return await getUserFromSession(session);
    } catch (_) {
      return null;
    }
  }

  /**
   * Read the Supabase session that the SDK persists in localStorage.
   * Used only as a fallback when getSession() transiently returns nothing.
   */
  function readStoredSession() {
    try {
      const ref = SUPABASE_URL.replace(/^https?:\/\//, '').split('.')[0];
      const raw = localStorage.getItem('sb-' + ref + '-auth-token');
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.user) return null;
      if (parsed.expires_at && parsed.expires_at * 1000 < Date.now()) return null;
      return parsed;
    } catch (_) {
      return null;
    }
  }

  async function updateCurrentUser(patch) {
    const sb = supabaseOrThrow();
    const { data } = await sb.auth.getSession();
    if (!data || !data.session || !data.session.user) return false;

    const uid = data.session.user.id;
    const allowed = {};
    ['first_name', 'last_name', 'mobile'].forEach(function (k) {
      if (patch[k] != null) allowed[k] = patch[k];
    });
    // also accept camelCase aliases used by the UI
    const camelMap = { firstName: 'first_name', lastName: 'last_name' };
    Object.keys(camelMap).forEach(function (k) {
      if (patch[k] != null) allowed[camelMap[k]] = patch[k];
    });

    if (Object.keys(allowed).length === 0) return true;

    const { error } = await sb
      .from('profiles')
      .update(allowed)
      .eq('id', uid);

    if (error) return false;
    // Invalidate cache so the next read picks up the change
    clearProfileCache();
    await fetchProfile(uid, { force: true });
    return true;
  }

  /**
   * requireAuth — redirects to login or a role-appropriate page.
   * NOTE: Because this is async, callers should always `await` it.
   *       They can check `!result` to short-circuit further page logic.
   */
  async function requireAuth(allowedRoles) {
    const user = await currentUser();
    if (!user) {
      // Genuinely no session. Redirect to login but do NOT call signOut() here:
      // a transient network failure must not destroy a valid persisted session.
      window.location.replace('login.html');
      return null;
    }
    if (Array.isArray(allowedRoles) && allowedRoles.indexOf(user.role) === -1) {
      // If the role could not be confirmed from the profiles table (cache miss
      // plus a network blip), the fallback may be wrong — e.g. an admin whose
      // auth metadata still says account_type 'pwd'. In that case keep the user
      // on the page instead of bouncing them to another dashboard.
      if (user.profileLoaded === false) return user;

      const rolePage =
        { pwd: 'dashboard.html', verifier: 'verifier.html', admin: 'admin.html' }[user.role];
      const target = rolePage || 'dashboard.html';
      window.location.replace(target);
      return null;
    }
    return user;
  }

  async function redirectIfAlreadySignedIn() {
    const user = await currentUser();
    if (!user) return;
    const rolePage =
      { pwd: 'dashboard.html', verifier: 'verifier.html', admin: 'admin.html' }[user.role];
    const target = rolePage || 'dashboard.html';
    window.location.replace(target);
  }

  /**
   * seedDemoAccounts — retained for API compatibility. Real demo accounts
   * must be created via the Supabase dashboard (auth.users + the profile
   * trigger).  This is a no-op that keeps legacy pages from crashing.
   */
  function seedDemoAccounts() {
    return [];
  }

  // ------------------------- EXPORT ------------------------------------
  const api = {
    seedDemoAccounts: seedDemoAccounts,
    registerUser: registerUser,
    loginUser: loginUser,
    loginUserPersistent: loginUserPersistent,
    logoutUser: logoutUser,
    currentUser: currentUser,
    updateCurrentUser: updateCurrentUser,
    requireAuth: requireAuth,
    redirectIfAlreadySignedIn: redirectIfAlreadySignedIn,
  };

  global.SmartPWDAuth = api;
  global.Auth = api;
})(window);
