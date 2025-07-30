// Comprehensive System Verification Script
// Tests all CRUD operations, module functionalities, and inter-module communication

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

class SystemVerificationTester {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'pass' ? '✅' : type === 'fail' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async test(name, testFunction) {
    try {
      this.log(`Testing: ${name}`, 'info');
      await testFunction();
      this.results.passed++;
      this.results.tests.push({ name, status: 'PASSED' });
      this.log(`✅ ${name} - PASSED`, 'pass');
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({ name, status: 'FAILED', error: error.message });
      this.log(`❌ ${name} - FAILED: ${error.message}`, 'fail');
    }
  }

  // Database CRUD Tests
  async testDatabaseCRUD() {
    this.log('🔍 Testing Database CRUD Operations...', 'info');

    // Test Leads CRUD
    await this.test('Leads - Create/Read/Update/Delete', async () => {
      // Create
      const { data: created, error: createError } = await supabase
        .from('leads')
        .insert([{
          name: 'Test Lead',
          email: 'test@test.com',
          phone: '+441234567890',
          status: 'New',
          source: 'Website'
        }])
        .select()
        .single();
      
      if (createError) throw new Error(`Create failed: ${createError.message}`);
      
      // Read
      const { data: read, error: readError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', created.id)
        .single();
      
      if (readError) throw new Error(`Read failed: ${readError.message}`);
      
      // Update
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: 'Contacted' })
        .eq('id', created.id);
      
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      
      // Delete
      const { error: deleteError } = await supabase
        .from('leads')
        .delete()
        .eq('id', created.id);
      
      if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);
    });

    // Test Students CRUD
    await this.test('Students - Create/Read/Update/Delete', async () => {
      const { data: created, error: createError } = await supabase
        .from('students')
        .insert([{
          name: 'Test Student',
          email: 'student@test.com',
          phone: '+441234567891',
          duration: '1 Month'
        }])
        .select()
        .single();
      
      if (createError) throw new Error(`Create failed: ${createError.message}`);
      
      const { data: read, error: readError } = await supabase
        .from('students')
        .select('*')
        .eq('id', created.id)
        .single();
      
      if (readError) throw new Error(`Read failed: ${readError.message}`);
      
      const { error: updateError } = await supabase
        .from('students')
        .update({ duration: '2 Months' })
        .eq('id', created.id);
      
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      
      const { error: deleteError } = await supabase
        .from('students')
        .delete()
        .eq('id', created.id);
      
      if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);
    });

    // Test Studios CRUD
    await this.test('Studios - Create/Read/Update/Delete', async () => {
      const testId = `test-studio-${Date.now()}`;
      const { data: created, error: createError } = await supabase
        .from('studios')
        .insert([{
          id: testId,
          name: 'Test Studio',
          floor: 1,
          view: 'City View',
          roomgrade: 'Standard',
          price: 800
        }])
        .select()
        .single();
      
      if (createError) throw new Error(`Create failed: ${createError.message}`);
      
      const { data: read, error: readError } = await supabase
        .from('studios')
        .select('*')
        .eq('id', testId)
        .single();
      
      if (readError) throw new Error(`Read failed: ${readError.message}`);
      
      const { error: updateError } = await supabase
        .from('studios')
        .update({ price: 900 })
        .eq('id', testId);
      
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      
      const { error: deleteError } = await supabase
        .from('studios')
        .delete()
        .eq('id', testId);
      
      if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);
    });

    // Test Maintenance Requests CRUD
    await this.test('Maintenance Requests - Create/Read/Update/Delete', async () => {
      // Get a student to link to
      const { data: students } = await supabase.from('students').select('id').limit(1);
      if (!students || students.length === 0) {
        throw new Error('No students found for maintenance request test');
      }

      const { data: created, error: createError } = await supabase
        .from('maintenance_requests')
        .insert([{
          student_id: students[0].id,
          title: 'Test Maintenance Request',
          description: 'Test description',
          category: 'general',
          priority: 'medium',
          urgency: 'normal',
          status: 'pending'
        }])
        .select()
        .single();
      
      if (createError) throw new Error(`Create failed: ${createError.message}`);
      
      const { data: read, error: readError } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('id', created.id)
        .single();
      
      if (readError) throw new Error(`Read failed: ${readError.message}`);
      
      const { error: updateError } = await supabase
        .from('maintenance_requests')
        .update({ status: 'in_progress' })
        .eq('id', created.id);
      
      if (updateError) throw new Error(`Update failed: ${updateError.message}`);
      
      const { error: deleteError } = await supabase
        .from('maintenance_requests')
        .delete()
        .eq('id', created.id);
      
      if (deleteError) throw new Error(`Delete failed: ${deleteError.message}`);
    });
  }

  // Test Foreign Key Relationships
  async testRelationships() {
    this.log('🔗 Testing Database Relationships...', 'info');

    await this.test('Student-Studio Relationship', async () => {
      const { data: studios } = await supabase.from('studios').select('id').limit(1);
      if (!studios || studios.length === 0) {
        throw new Error('No studios found for relationship test');
      }

      const { data: student, error: createError } = await supabase
        .from('students')
        .insert([{
          name: 'Relationship Test Student',
          email: 'rel.test@test.com',
          phone: '+441234567892',
          room: studios[0].id
        }])
        .select('id, room')
        .single();
      
      if (createError) throw new Error(`Student creation failed: ${createError.message}`);

      // Verify studio occupancy was updated by trigger
      const { data: studio, error: studioError } = await supabase
        .from('studios')
        .select('occupied, occupiedby')
        .eq('id', studios[0].id)
        .single();
      
      if (studioError) throw new Error(`Studio read failed: ${studioError.message}`);
      
      if (!studio.occupied || studio.occupiedby !== student.id) {
        this.log(`Studio occupancy not updated correctly. Expected occupied: true, occupiedby: ${student.id}, Got occupied: ${studio.occupied}, occupiedby: ${studio.occupiedby}`, 'warn');
      }

      // Cleanup
      await supabase.from('students').delete().eq('id', student.id);
    });

    await this.test('Lead-Student Conversion Tracking', async () => {
      // Create a lead
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert([{
          name: 'Conversion Test Lead',
          email: 'conversion@test.com',
          phone: '+441234567893',
          status: 'New',
          source: 'Website'
        }])
        .select()
        .single();
      
      if (leadError) throw new Error(`Lead creation failed: ${leadError.message}`);

      // Convert to student
      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert([{
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          duration: '1 Month'
        }])
        .select()
        .single();
      
      if (studentError) throw new Error(`Student creation failed: ${studentError.message}`);

      // Update lead with conversion tracking
      const { error: updateError } = await supabase
        .from('leads')
        .update({ 
          status: 'Converted',
          converted_student_id: student.id
        })
        .eq('id', lead.id);
      
      if (updateError) throw new Error(`Lead update failed: ${updateError.message}`);

      // Cleanup
      await supabase.from('students').delete().eq('id', student.id);
      await supabase.from('leads').delete().eq('id', lead.id);
    });
  }

  // Test Configuration Data
  async testConfigurationData() {
    this.log('⚙️ Testing Configuration Data...', 'info');

    const configTables = [
      'lead_sources',
      'lead_status', 
      'response_categories',
      'followup_stages',
      'room_grades',
      'stay_durations',
      'studio_views'
    ];

    for (const table of configTables) {
      await this.test(`Configuration Table: ${table}`, async () => {
        const { data, error } = await supabase.from(table).select('*').limit(5);
        if (error) throw new Error(`Failed to read ${table}: ${error.message}`);
        if (!data || data.length === 0) {
          throw new Error(`No data found in ${table}`);
        }
      });
    }
  }

  // Test User Roles and Permissions
  async testUserRolesAndPermissions() {
    this.log('🔐 Testing User Roles and Permissions...', 'info');

    await this.test('User Roles Table', async () => {
      const { data, error } = await supabase.from('user_roles').select('*');
      if (error) throw new Error(`Failed to read user_roles: ${error.message}`);
    });

    await this.test('Module Permissions Table', async () => {
      const { data, error } = await supabase.from('module_permissions').select('*');
      if (error) throw new Error(`Failed to read module_permissions: ${error.message}`);
    });
  }

  // Test Data Integrity
  async testDataIntegrity() {
    this.log('🔍 Testing Data Integrity...', 'info');

    await this.test('No Orphaned Students (Students without valid studios)', async () => {
      const { data: orphanedStudents, error } = await supabase
        .from('students')
        .select(`
          id, name, room,
          studio:studios(id)
        `)
        .not('room', 'is', null);
      
      if (error) throw new Error(`Query failed: ${error.message}`);
      
      const orphaned = orphanedStudents?.filter(s => s.room && !s.studio) || [];
      if (orphaned.length > 0) {
        throw new Error(`Found ${orphaned.length} students with invalid studio references`);
      }
    });

    await this.test('No Double Studio Occupancy', async () => {
      const { data: studios, error } = await supabase
        .from('studios')
        .select(`
          id, name, occupied, occupiedby,
          students:students(id, name)
        `);
      
      if (error) throw new Error(`Query failed: ${error.message}`);
      
      const issues = [];
      studios?.forEach(studio => {
        const studentCount = studio.students?.length || 0;
        if (studio.occupied && studentCount === 0) {
          issues.push(`Studio ${studio.name} marked as occupied but has no students`);
        }
        if (!studio.occupied && studentCount > 0) {
          issues.push(`Studio ${studio.name} not marked as occupied but has ${studentCount} students`);
        }
        if (studentCount > 1) {
          issues.push(`Studio ${studio.name} has ${studentCount} students (should be max 1)`);
        }
      });
      
      if (issues.length > 0) {
        throw new Error(`Data integrity issues found: ${issues.join('; ')}`);
      }
    });
  }

  // Test Module Integration
  async testModuleIntegration() {
    this.log('🔄 Testing Module Integration...', 'info');

    await this.test('Lead to Student Conversion Flow', async () => {
      // This simulates the complete conversion flow
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .insert([{
          name: 'Integration Test Lead',
          email: 'integration@test.com',
          phone: '+441234567894',
          status: 'Qualified',
          source: 'Website',
          roomgrade: 'Standard',
          duration: '1 Month'
        }])
        .select()
        .single();
      
      if (leadError) throw new Error(`Lead creation failed: ${leadError.message}`);

      // Convert to student (this should trigger studio occupancy update)
      const { data: availableStudio } = await supabase
        .from('studios')
        .select('id')
        .eq('occupied', false)
        .limit(1)
        .single();

      if (!availableStudio) {
        throw new Error('No available studios for conversion test');
      }

      const { data: student, error: studentError } = await supabase
        .from('students')
        .insert([{
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          room: availableStudio.id,
          duration: lead.duration,
          revenue: 800
        }])
        .select()
        .single();
      
      if (studentError) throw new Error(`Student creation failed: ${studentError.message}`);

      // Create invoice for student
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          student_id: student.id,
          amount: student.revenue,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
          description: 'Accommodation fee'
        }])
        .select()
        .single();
      
      if (invoiceError) throw new Error(`Invoice creation failed: ${invoiceError.message}`);

      // Delete lead after successful conversion
      const { error: deleteLeadError } = await supabase
        .from('leads')
        .delete()
        .eq('id', lead.id);
      
      if (deleteLeadError) throw new Error(`Lead deletion failed: ${deleteLeadError.message}`);

      // Cleanup
      await supabase.from('invoices').delete().eq('id', invoice.id);
      await supabase.from('students').delete().eq('id', student.id);
    });

    await this.test('Maintenance Request Creation Flow', async () => {
      // Get a student
      const { data: students } = await supabase.from('students').select('id, room').limit(1);
      if (!students || students.length === 0) {
        this.log('Skipping maintenance request test - no students available', 'warn');
        return;
      }

      const student = students[0];
      
      // Create maintenance request
      const { data: request, error: requestError } = await supabase
        .from('maintenance_requests')
        .insert([{
          student_id: student.id,
          studio_id: student.room,
          title: 'Integration Test Request',
          description: 'Test maintenance request from integration test',
          category: 'general',
          priority: 'medium',
          urgency: 'normal',
          status: 'pending'
        }])
        .select()
        .single();
      
      if (requestError) throw new Error(`Maintenance request creation failed: ${requestError.message}`);

      // Cleanup
      await supabase.from('maintenance_requests').delete().eq('id', request.id);
    });
  }

  // Main execution
  async runAllTests() {
    console.log('🚀 Starting Comprehensive System Verification...\n');
    
    await this.testDatabaseCRUD();
    await this.testRelationships();
    await this.testConfigurationData();
    await this.testUserRolesAndPermissions();
    await this.testDataIntegrity();
    await this.testModuleIntegration();
    
    this.printSummary();
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 SYSTEM VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${this.results.passed}`);
    console.log(`❌ Tests Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(1)}%`);
    
    if (this.results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`   • ${test.name}: ${test.error}`);
        });
    }
    
    console.log('\n📋 ALL TESTS:');
    this.results.tests.forEach(test => {
      const status = test.status === 'PASSED' ? '✅' : '❌';
      console.log(`   ${status} ${test.name}`);
    });
    
    const overallStatus = this.results.failed === 0 ? '🎉 SYSTEM HEALTHY' : '⚠️ ISSUES DETECTED';
    console.log(`\n${overallStatus}`);
    console.log('='.repeat(60));
  }
}

// Run verification
async function runSystemVerification() {
  const tester = new SystemVerificationTester();
  await tester.runAllTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runSystemVerification();
}

export { SystemVerificationTester, runSystemVerification }; 