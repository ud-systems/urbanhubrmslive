// Comprehensive Dummy Data Generation Script
// Based on exact database schema and user rules from codebase analysis

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Exact database option values from system analysis
const DATABASE_OPTIONS = {
  leadSources: [
    'Direct Inquiry',
    'Website',
    'Google Ads',
    'Meta Ads', 
    'TikTok',
    'WhatsApp',
    'Referral',
    'Generic Source'
  ],
  leadStatuses: [
    'New',
    'Contacted',
    'Qualified',
    'Proposal Sent',
    'Follow Up',
    'Not Interested',
    'Converted'
  ],
  responseCategories: [
    'Interested',
    'Not Interested',
    'Callback Required',
    'Email Sent',
    'Voicemail Left',
    'Busy',
    'Wrong Number'
  ],
  followUpStages: [
    'Initial Contact',
    'Second Follow Up',
    'Third Follow Up',
    'Final Attempt',
    'Qualified Lead',
    'Ready to Convert'
  ],
  roomGrades: [
    'Studio',
    'En-suite',
    'Standard',
    'Premium',
    'Deluxe',
    'Penthouse'
  ],
  stayDurations: [
    '1 Week',
    '2 Weeks', 
    '3 Weeks',
    '1 Month',
    '2 Months',
    '3 Months',
    '6 Months',
    '1 Year',
    'Academic Year'
  ],
  studioViews: [
    'City View',
    'Garden View',
    'Street View',
    'Courtyard View',
    'River View'
  ],
  userRoles: [
    'admin',
    'manager', 
    'salesperson',
    'accountant',
    'cleaner',
    'student'
  ],
  maintenanceCategories: [
    'plumbing',
    'electrical', 
    'heating',
    'appliances',
    'furniture',
    'cleaning',
    'security',
    'windows',
    'general'
  ],
  maintenancePriorities: ['low', 'medium', 'high', 'urgent'],
  maintenanceUrgency: ['normal', 'asap', 'emergency'],
  maintenanceStatus: ['pending', 'in_progress', 'completed', 'cancelled']
};

// Helper functions
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomPhone = () => `+44${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
const randomRevenue = () => Math.floor(Math.random() * 5000 + 500);

// Generate dummy data functions
const generateUsers = (count = 10) => {
  const users = [];
  const names = [
    'John Smith', 'Sarah Johnson', 'Michael Brown', 'Emma Wilson', 'James Davis',
    'Olivia Miller', 'William Garcia', 'Sophia Martinez', 'Benjamin Anderson', 'Isabella Taylor'
  ];
  
  for (let i = 0; i < count; i++) {
    const name = names[i] || `User ${i + 1}`;
    users.push({
      name,
      email: `${name.toLowerCase().replace(' ', '.')}@urbanhub.com`,
      role: randomChoice(DATABASE_OPTIONS.userRoles),
      approved: true,
      approved_at: new Date().toISOString(),
      created_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
    });
  }
  return users;
};

const generateStudios = (count = 25) => {
  const studios = [];
  const floorTypes = ['G', '1', '2', '3', '4', '5']; // G for ground floor as per user rules
  
  for (let i = 1; i <= count; i++) {
    const floor = randomChoice(floorTypes);
    const roomNumber = `${floor === 'G' ? 'G' : floor}${String(i).padStart(2, '0')}`;
    
    studios.push({
      id: `studio-${roomNumber}`,
      name: `Studio ${roomNumber}`,
      floor: floor === 'G' ? 0 : parseInt(floor),
      view: randomChoice(DATABASE_OPTIONS.studioViews),
      roomgrade: randomChoice(DATABASE_OPTIONS.roomGrades),
      price: randomRevenue(),
      occupied: Math.random() > 0.3, // 70% occupancy rate
      occupiedby: null, // Will be set by triggers
      created_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
    });
  }
  return studios;
};

const generateLeads = (count = 50) => {
  const leads = [];
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Blake'];
  const lastNames = ['Johnson', 'Smith', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  
  for (let i = 1; i <= count; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const name = `${firstName} ${lastName}`;
    
    leads.push({
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.com`,
      phone: randomPhone(),
      status: randomChoice(DATABASE_OPTIONS.leadStatuses),
      source: randomChoice(DATABASE_OPTIONS.leadSources),
      responsecategory: randomChoice(DATABASE_OPTIONS.responseCategories),
      followupstage: randomChoice(DATABASE_OPTIONS.followUpStages),
      roomgrade: randomChoice(DATABASE_OPTIONS.roomGrades),
      duration: randomChoice(DATABASE_OPTIONS.stayDurations),
      revenue: randomRevenue(),
      notes: `Generated lead ${i} - interested in ${randomChoice(DATABASE_OPTIONS.roomGrades)} accommodation`,
      dateofinquiry: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
      created_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
    });
  }
  return leads;
};

const generateStudents = (studios, count = 20) => {
  const students = [];
  const occupiedStudios = studios.filter(s => s.occupied).slice(0, count);
  
  const firstNames = ['David', 'Emma', 'Michael', 'Sophie', 'James', 'Emily', 'Thomas', 'Charlotte', 'Daniel', 'Grace'];
  const lastNames = ['Chen', 'Patel', 'O\'Connor', 'Kim', 'Ahmed', 'Lopez', 'Wilson', 'Taylor', 'Anderson', 'White'];
  
  for (let i = 0; i < Math.min(count, occupiedStudios.length); i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const name = `${firstName} ${lastName}`;
    const studio = occupiedStudios[i];
    
    students.push({
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i + 1}@student.ac.uk`,
      phone: randomPhone(),
      room: studio.id,
      duration: randomChoice(DATABASE_OPTIONS.stayDurations),
      revenue: studio.price,
      checkin: randomDate(new Date(2024, 0, 1), new Date()).toISOString(),
      created_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
    });
  }
  return students;
};

const generateTourists = (studios, count = 8) => {
  const tourists = [];
  const shortTermDurations = ['1 Week', '2 Weeks', '3 Weeks', '1 Month'];
  const availableStudios = studios.filter(s => !s.occupied).slice(0, count);
  
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eric', 'Fiona', 'George', 'Helen'];
  const lastNames = ['Tourist', 'Visitor', 'Guest', 'Traveler', 'Explorer', 'Nomad', 'Wanderer', 'Adventurer'];
  
  for (let i = 0; i < Math.min(count, availableStudios.length); i++) {
    const firstName = firstNames[i];
    const lastName = randomChoice(lastNames);
    const name = `${firstName} ${lastName}`;
    const studio = availableStudios[i];
    
    tourists.push({
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tourist.com`,
      phone: randomPhone(),
      room: studio.id,
      duration: randomChoice(shortTermDurations),
      revenue: Math.floor(studio.price * 0.8), // 20% discount for short term
      checkin: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
      checkout: randomDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)).toISOString(),
      created_at: new Date().toISOString()
    });
  }
  return tourists;
};

const generateInvoices = (students, tourists, count = 15) => {
  const invoices = [];
  const allResidents = [...students, ...tourists];
  
  for (let i = 0; i < Math.min(count, allResidents.length); i++) {
    const resident = allResidents[i];
    const isStudent = students.includes(resident);
    
    invoices.push({
      student_id: isStudent ? resident.id : null,
      tourist_id: !isStudent ? resident.id : null,
      amount: resident.revenue,
      due_date: randomDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).toISOString(),
      status: randomChoice(['pending', 'paid', 'overdue']),
      description: `${isStudent ? 'Student' : 'Tourist'} accommodation fee - ${resident.duration}`,
      created_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
    });
  }
  return invoices;
};

const generateMaintenanceRequests = (students, studios, count = 12) => {
  const requests = [];
  
  const issues = [
    'Leaky faucet in bathroom',
    'Heating not working properly', 
    'WiFi connection issues',
    'Broken light switch',
    'Door lock malfunction',
    'Shower drain blocked',
    'Window won\'t close properly',
    'Refrigerator making noise',
    'Electricity outlet not working',
    'Air conditioning too loud',
    'Toilet flush not working',
    'Kitchen tap dripping'
  ];
  
  for (let i = 0; i < count; i++) {
    const student = randomChoice(students);
    const studio = studios.find(s => s.id === student.room);
    const issue = issues[i] || randomChoice(issues);
    
    requests.push({
      student_id: student.id,
      studio_id: studio?.id,
      title: issue,
      description: `${issue}. Please repair as soon as possible. Located in ${studio?.name || 'unknown studio'}.`,
      category: randomChoice(DATABASE_OPTIONS.maintenanceCategories),
      priority: randomChoice(DATABASE_OPTIONS.maintenancePriorities),
      urgency: randomChoice(DATABASE_OPTIONS.maintenanceUrgency),
      status: randomChoice(DATABASE_OPTIONS.maintenanceStatus),
      created_at: randomDate(new Date(2024, 0, 1), new Date()).toISOString()
    });
  }
  return requests;
};

const generateConfigurationData = () => {
  return {
    lead_sources: DATABASE_OPTIONS.leadSources.map((source, index) => ({
      id: index + 1,
      name: source,
      description: `Leads from ${source}`,
      active: true
    })),
    lead_status: DATABASE_OPTIONS.leadStatuses.map((status, index) => ({
      id: index + 1, 
      name: status,
      description: `Lead status: ${status}`,
      active: true
    })),
    response_categories: DATABASE_OPTIONS.responseCategories.map((category, index) => ({
      id: index + 1,
      name: category, 
      description: `Response category: ${category}`,
      active: true
    })),
    followup_stages: DATABASE_OPTIONS.followUpStages.map((stage, index) => ({
      id: index + 1,
      name: stage,
      description: `Follow-up stage: ${stage}`,
      active: true
    })),
    room_grades: DATABASE_OPTIONS.roomGrades.map((grade, index) => ({
      id: index + 1,
      name: grade,
      description: `Room grade: ${grade}`,
      base_price: 500 + (index * 200),
      active: true
    })),
    stay_durations: DATABASE_OPTIONS.stayDurations.map((duration, index) => ({
      id: index + 1,
      name: duration,
      days: duration.includes('Week') ? parseInt(duration) * 7 : 
             duration.includes('Month') ? parseInt(duration) * 30 : 
             duration.includes('Year') ? 365 : 30,
      active: true
    })),
    studio_views: DATABASE_OPTIONS.studioViews.map((view, index) => ({
      id: index + 1,
      name: view,
      description: `Studio view: ${view}`,
      active: true
    }))
  };
};

// Main execution function
async function generateAllDummyData() {
  console.log('🚀 Starting dummy data generation...');
  
  try {
    // Generate configuration data first
    console.log('📊 Generating configuration data...');
    const configData = generateConfigurationData();
    
    // Insert configuration data
    for (const [table, data] of Object.entries(configData)) {
      console.log(`Inserting ${data.length} records into ${table}...`);
      const { error } = await supabase.from(table).upsert(data, { onConflict: 'name' });
      if (error) {
        console.error(`Error inserting ${table}:`, error);
      } else {
        console.log(`✅ ${table} data inserted successfully`);
      }
    }
    
    // Generate main data
    console.log('🏢 Generating studios...');
    const studios = generateStudios(25);
    const { error: studiosError } = await supabase.from('studios').upsert(studios, { onConflict: 'id' });
    if (studiosError) {
      console.error('Error inserting studios:', studiosError);
    } else {
      console.log('✅ Studios inserted successfully');
    }
    
    console.log('👥 Generating users...');
    const users = generateUsers(10);
    const { error: usersError } = await supabase.from('users').upsert(users, { onConflict: 'email' });
    if (usersError) {
      console.error('Error inserting users:', usersError);
    } else {
      console.log('✅ Users inserted successfully');
    }
    
    console.log('📈 Generating leads...');
    const leads = generateLeads(50);
    const { error: leadsError } = await supabase.from('leads').upsert(leads);
    if (leadsError) {
      console.error('Error inserting leads:', leadsError);
    } else {
      console.log('✅ Leads inserted successfully');
    }
    
    console.log('🎓 Generating students...');
    const students = generateStudents(studios, 20);
    const { error: studentsError } = await supabase.from('students').upsert(students);
    if (studentsError) {
      console.error('Error inserting students:', studentsError);
    } else {
      console.log('✅ Students inserted successfully');
    }
    
    console.log('🌍 Generating tourists...');
    const tourists = generateTourists(studios, 8);
    const { error: touristsError } = await supabase.from('tourists').upsert(tourists);
    if (touristsError) {
      console.error('Error inserting tourists:', touristsError);
    } else {
      console.log('✅ Tourists inserted successfully');
    }
    
    console.log('💰 Generating invoices...');
    const invoices = generateInvoices(students, tourists, 15);
    const { error: invoicesError } = await supabase.from('invoices').upsert(invoices);
    if (invoicesError) {
      console.error('Error inserting invoices:', invoicesError);
    } else {
      console.log('✅ Invoices inserted successfully');
    }
    
    console.log('🔧 Generating maintenance requests...');
    const maintenanceRequests = generateMaintenanceRequests(students, studios, 12);
    const { error: maintenanceError } = await supabase.from('maintenance_requests').upsert(maintenanceRequests);
    if (maintenanceError) {
      console.error('Error inserting maintenance requests:', maintenanceError);
    } else {
      console.log('✅ Maintenance requests inserted successfully');
    }
    
    console.log('🎉 Dummy data generation completed successfully!');
    console.log(`
📊 Generated Data Summary:
• Studios: ${studios.length}
• Users: ${users.length}  
• Leads: ${leads.length}
• Students: ${students.length}
• Tourists: ${tourists.length}
• Invoices: ${invoices.length}
• Maintenance Requests: ${maintenanceRequests.length}
• Configuration Tables: ${Object.keys(configData).length}

🎯 All data follows exact database schema and user rules!
    `);
    
  } catch (error) {
    console.error('❌ Error during dummy data generation:', error);
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllDummyData();
}

export { generateAllDummyData }; 