import { supabaseAdmin } from '../config/supabase';
import { AIOrchestrator } from '../services/ai_orchestrator.service';
import { DatabaseService } from '../services/database.service';
import { HealthMemoryService } from '../services/health_memory.service';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

async function runZitaReturningTest() {
  console.log('--- STARTING REALISTIC "RETURNING USER" TEST: ZITA ---');

  const zitaId = uuidv4();
  
  // 1. Setup Zita's Profile
  console.log(`[Setup] Creating profile for Zita...`);
  await supabaseAdmin.from('profiles').insert({
    id: zitaId,
    full_name: "Zita",
    gender: "female",
    date_of_birth: "1992-06-15",
    base_health_conditions: ["Seasonal Fatigue"]
  });

  // 2. Insert a "Previous Report" (from 4 months ago)
  // Let's say her Vitamin D was dangerously low at 12 ng/mL
  console.log(`[Setup] Injecting historical memory: Vitamin D was 12 ng/mL in October...`);
  const prevReportId = uuidv4();
  await supabaseAdmin.from('reports').insert({
    id: prevReportId,
    user_id: zitaId,
    report_date: '2025-10-10T10:00:00Z',
    file_url: 'https://example.com/old_report.jpg',
    overall_summary: "Your Vitamin D is quite low, Zita. Let's work on getting those levels up."
  });

  await supabaseAdmin.from('biomarkers').insert({
    report_id: prevReportId,
    user_id: zitaId,
    name: 'Vitamin D',
    value: 12,
    unit: 'ng/mL',
    reference_range: '30-100',
    is_abnormal: true,
    recorded_at: '2025-10-10T10:00:00Z'
  });

  // 3. Run New Analysis (Simulated New Report)
  // Verified image URL that works with Gemini 2.5 Flash
  const robustImageUrl = "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1000"; 
  console.log(`[Test] Simulating upload of report: ${robustImageUrl}`);

  try {
    const imageResponse = await fetch(robustImageUrl);
    const buffer = Buffer.from(await imageResponse.arrayBuffer());

    // Retrieve Memory
    const healthSnapshot = await HealthMemoryService.getHealthSnapshot(zitaId);
    console.log(`[Memory Check] Julian's Brain Snapshot:\n${healthSnapshot}`);

    // Execute Pipeline
    console.log('[Test] Julian is analyzing the new data against the old memory...');
    const analysis = await AIOrchestrator.executeAnalysisPipeline(buffer, healthSnapshot, {
      full_name: "Zita",
      base_health_conditions: ["Seasonal Fatigue"]
    });

    console.log('\n--- JULIAN\'S SMART MENTOR RESPONSE ---');
    console.log(analysis.final_response);
    console.log('---------------------------------------\n');

    // 4. Persistence
        await DatabaseService.saveAnalyzedReport(
          { 
            user_id: zitaId, 
            file_url: robustImageUrl, 
            overall_summary: analysis.final_response,        report_date: new Date().toISOString()
      },
      analysis.raw_data.map((item: any) => ({
        user_id: zitaId,
        name: item.biomarker,
        value: parseFloat(item.value) || 0,
        unit: item.unit,
        reference_range: item.range,
        is_abnormal: !!item.flag,
        recorded_at: new Date().toISOString()
      }))
    );

    console.log('[Success] Zita\'s history is now updated with the new trend.');
    console.log('--- TEST COMPLETED ---');

  } catch (error) {
    console.error('[Test Error]', error);
  }
}

runZitaReturningTest();
