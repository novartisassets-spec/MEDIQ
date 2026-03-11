import { 
  AuthenticationState, 
  AuthenticationCreds, 
  SignalDataTypeMap, 
  initAuthCreds, 
  BufferJSON,
  proto
} from '@whiskeysockets/baileys';
import { supabaseAdmin } from '../config/supabase';

const BUCKET_NAME = 'baileys_auth';
const FILE_NAME = 'session_auth.json';

/**
 * Custom Baileys Auth State using Supabase Storage
 * Storing as a single JSON blob for simplicity and atomic updates
 */
export const useSupabaseAuthState = async (): Promise<{ state: AuthenticationState, saveCreds: () => Promise<void> }> => {
  
  // 1. Fetch initial state from Supabase
  let data: any = null;
  try {
    const { data: file, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(FILE_NAME);
    
    if (file) {
      const text = await file.text();
      data = JSON.parse(text, BufferJSON.reviver);
    }
  } catch (e) {
    console.log('[Auth] No existing session found in Supabase Storage. Starting fresh.');
  }

  const creds: AuthenticationCreds = data?.creds || initAuthCreds();
  const keys: any = data?.keys || {};

  const saveState = async (creds: AuthenticationCreds, keys: any) => {
    try {
      const sessionData = JSON.stringify({ creds, keys }, BufferJSON.replacer);
      const { error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(FILE_NAME, sessionData, {
          contentType: 'application/json',
          upsert: true
        });
      
      if (error) {
        console.error('[Auth] Supabase storage error:', error.message);
      } else {
        // console.log('[Auth] State saved to Supabase');
      }
    } catch (e: any) {
      console.error('[Auth] Critical fetch failure while saving state:', e.message);
    }
  };

  return {
    state: {
      creds,
      keys: {
        get: (type: keyof SignalDataTypeMap, ids: string[]) => {
          const keyData: any = {};
          for (const id of ids) {
            let value = keys[`${type}-${id}`];
            if (type === 'app-state-sync-key' && value) {
              value = proto.Message.AppStateSyncKeyData.fromObject(value);
            }
            keyData[id] = value;
          }
          return keyData;
        },
        set: (data: any) => {
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              if (value) {
                keys[key] = value;
              } else {
                delete keys[key];
              }
            }
          }
          // We don't save on every tiny key update to avoid DB thrashing
          // Baileys calls saveCreds for critical updates
        }
      }
    },
    saveCreds: () => saveState(creds, keys)
  };
};
