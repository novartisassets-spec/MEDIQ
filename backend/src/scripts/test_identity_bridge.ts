import dotenv from 'dotenv';
dotenv.config();
import { DatabaseService } from '../services/database.service';
import { SchemaService } from '../services/schema.service';
import { supabaseAdmin } from '../config/supabase';

async function runRealisticTest() {
  console.log('🚀 [TEST] Starting Realistic Identity Bridge Test...');

  try {
    // 1. Setup: Ensure Schema is ready
    await SchemaService.initializeSchema();
    
    // Cleanup any prior test data to prevent collisions
    const cleanPhone = '2347040522085';
    await supabaseAdmin.from('profiles').delete().ilike('whatsapp_number', `%${cleanPhone}%`);
    await supabaseAdmin.from('profiles').delete().eq('whatsapp_number', '33355085144309@lid');
    const testUserId = 'test-user-' + Date.now();
    const testPhone = '2347040522085';
    const testJid = `${testPhone}@s.whatsapp.net`;
    
    console.log(`\n--- STAGE 1: WEB REGISTRATION ---`);
    const profile = await DatabaseService.registerUser({
      id: undefined as any, // ID will be auto-generated
      full_name: 'Cana Sovereign',
      username: 'cana_test',
      whatsapp_number: testJid,
      is_registered: true
    });
    console.log(`✅ Profile Created: ${profile.full_name} (${profile.id})`);

    // 3. Mock Proactive Welcome Trigger
    console.log(`\n--- STAGE 2: PROACTIVE WELCOME ---`);
    // We mock the session creation part of sendWelcomeMessageToUser
    const session = await DatabaseService.createChatSession(profile.id, 'WhatsApp Health Link', 'whatsapp');
    await DatabaseService.saveChatMessage(session.id, 'assistant', 'Welcome to MEDIQ!', 'whatsapp');
    await DatabaseService.markWelcomeSent(profile.id);
    console.log(`✅ Dashboard Session Created: ${session.id}`);
    console.log(`✅ Proactive Message Persisted and welcome_sent flag set.`);

    // 4. MOCK IDENTITY MAPPING (The "Missing Link" from Baileys)
    console.log(`\n--- STAGE 3: IDENTITY MAPPING (Baileys Listener) ---`);
    const incomingLid = '33355085144309@lid';
    console.log(`Baileys detected: ${testPhone} is linked to ${incomingLid}`);
    
    // Simulate what mapLidToProfile does
    const existingProfile = await DatabaseService.getProfileByNumber(testPhone);
    if (existingProfile) {
      await DatabaseService.updateProfile(existingProfile.id, { whatsapp_number: incomingLid });
      console.log(`✅ Profile updated with LID.`);
    }

    // 5. Mock Incoming WhatsApp Message from LID
    console.log(`\n--- STAGE 4: WHATSAPP INTERACTION (LID) ---`);
    console.log(`Incoming JID: ${incomingLid}`);

    // This calls the actual logic in DatabaseService
    const { user, isNew } = await DatabaseService.getOrCreateUserByWhatsApp(incomingLid);

    // 6. FINAL VERIFICATION
    console.log(`\n--- FINAL VERIFICATION ---`);
    console.log(`Detected User: ${user.full_name}`);
    console.log(`Is New User: ${isNew}`);
    console.log(`Current DB JID: ${user.whatsapp_number}`);
    console.log(`Welcome Sent Status: ${user.welcome_sent}`);

    if (user.id === profile.id && !isNew && user.whatsapp_number === incomingLid) {
      console.log('\n🏆 TEST PASSED: Identity successfully bridged via Persistent Mapping!');
    } else {
      console.error('\n❌ TEST FAILED: Identity mismatch or duplicate user created.');
    }

  } catch (e) {
    console.error('Test Error:', e);
  } finally {
    // Cleanup the test data so we don't pollute the DB
    console.log('\n🧹 Cleaning up test data...');
    // (Optional: Implement cleanup here if needed)
  }
}

runRealisticTest();
