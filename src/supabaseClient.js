(function (global) {
  'use strict';

  var SUPABASE_URL = 'https://fvyinioymlegzfhrahbt.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_dKUs94y6AVkpr3LobPq1eQ_48Oeu-i7';

  function getCreateClient() {
    if (global.supabase && typeof global.supabase.createClient === 'function') {
      return global.supabase.createClient;
    }
    if (typeof require === 'function') {
      try {
        var mod = require('@supabase/supabase-js');
        if (mod && typeof mod.createClient === 'function') return mod.createClient;
      } catch (_) {}
    }
    return null;
  }

  function install() {
    var createClient = getCreateClient();
    if (!createClient) return false;
    if (global.supabase && typeof global.supabase.auth === 'object') return true;
    try {
      global.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  install();
  global.__initSupabaseClient = install;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
