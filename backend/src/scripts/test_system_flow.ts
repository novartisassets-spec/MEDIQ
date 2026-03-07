import { supabaseAdmin } from '../config/supabase';
import { AIOrchestrator } from '../services/ai_orchestrator.service';
import { DatabaseService } from '../services/database.service';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

async function runRealTimeTest() {
  console.log('--- STARTING REAL-TIME END-TO-END SYSTEM TEST ---');

  // 1. Setup Mock User (to satisfy foreign key constraints)
  const testUserId = uuidv4();
  console.log(`[Test] Creating mock user with ID: ${testUserId}`);
  
  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .insert({
      id: testUserId,
      full_name: "Test Patient Alex",
      gender: "male",
      date_of_birth: "1990-01-01",
      base_health_conditions: ["High Cholesterol", "Vitamin D Deficiency"]
    });

  if (profileError) {
    console.error('[Test Error] Failed to create mock profile:', profileError);
    return;
  }

  // 2. High-quality sample of a lab report image
  const sampleReportUrl = "https://raw.githubusercontent.com/shadcn-ui/ui/main/apps/www/public/og.png"; // Placeholder for a high-res image
  // Actually, let's use a real public medical report sample if possible, or a direct link to an image on a CDN
  const robustImageUrl = "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=1000"; // A clean lab environment, just to test Vision OCR process
  console.log(`[Test] Simulating upload of report: ${robustImageUrl}`);

  try {
    // 3. Run the AI Pipeline
    console.log('[Test] Triggering Multi-Layered AI Orchestrator (Gemini 2.0 Vision + Groq)...');
    
    // Fetch image buffer
    const response = await fetch(robustImageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Execute pipeline (no historical data yet)
    const analysis = await AIOrchestrator.executeAnalysisPipeline(buffer, [], {
      full_name: "Test Patient Alex",
      base_health_conditions: ["High Cholesterol", "Vitamin D Deficiency"]
    });

    console.log('\n--- LAYER 1 & 2: GEMINI VISION RESULTS ---');
    console.log('Raw Data Extracted:', JSON.stringify(analysis.raw_data, null, 2));
    console.log('Clinical Insights:', JSON.stringify(analysis.clinical_insights, null, 2));

    console.log('\n--- LAYER 3: GROQ CONVERSATIONAL RESPONSE ---');
    console.log('AI Response:', analysis.final_response);

    // 4. Test Persistence (Saving to Supabase)
    console.log('\n[Test] Persisting results to Supabase...');
    const savedReport = await DatabaseService.saveAnalyzedReport(
      { 
        user_id: testUserId, 
        file_url: sampleReportUrl, 
        overall_summary: analysis.final_response,
        report_date: new Date().toISOString()
      },
      analysis.raw_data.map((item: any) => ({
        user_id: testUserId,
        name: item.biomarker,
        value: parseFloat(item.value) || 0,
        unit: item.unit,
        reference_range: item.range,
        is_abnormal: !!item.flag,
        recorded_at: new Date().toISOString()
      }))
    );

    console.log(`[Test Result] Successfully saved report with ID: ${savedReport.id}`);

    // 5. Verify Memory (Fetching history for future reports)
    const history = await DatabaseService.getUserHealthHistory(testUserId);
    console.log(`[Test Result] Successfully retrieved memory: Found ${history.length} biomarkers in database.`);

    console.log('\n--- SYSTEM TEST COMPLETED SUCCESSFULLY ---');
  } catch (error) {
    console.error('[Test Critical Error] Pipeline failure:', error);
  } finally {
    // Cleanup: In a real multimillion-dollar test, we'd delete the test data 
    // but for now, we'll leave it in Supabase for you to inspect.
  }
}

runRealTimeTest();
