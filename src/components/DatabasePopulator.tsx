import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, Play, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/hooks/use-toast';

interface TableCount {
  table: string;
  count: number;
  expected: number;
  status: 'empty' | 'partial' | 'complete';
}

const DatabasePopulator = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [tableCounts, setTableCounts] = useState<TableCount[]>([]);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const expectedCounts = {
    leads: 50,
    students: 15,
    tourists: 8,
    studios: 25,
    users: 6,
    invoices: 20,
    maintenance_requests: 12,
    lead_sources: 8,
    lead_status: 7,
    room_grades: 6,
    stay_durations: 9,
    studio_views: 5
  };

  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      const counts: TableCount[] = [];
      
      for (const [table, expected] of Object.entries(expectedCounts)) {
        try {
          const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            console.warn(`Error checking ${table}:`, error.message);
            counts.push({
              table,
              count: 0,
              expected,
              status: 'empty'
            });
          } else {
            const actualCount = count || 0;
            let status: 'empty' | 'partial' | 'complete' = 'empty';
            
            if (actualCount === 0) {
              status = 'empty';
            } else if (actualCount < expected) {
              status = 'partial';
            } else {
              status = 'complete';
            }
            
            counts.push({
              table,
              count: actualCount,
              expected,
              status
            });
          }
        } catch (err) {
          console.warn(`Failed to check ${table}:`, err);
          counts.push({
            table,
            count: 0,
            expected,
            status: 'empty'
          });
        }
      }
      
      setTableCounts(counts);
      setLastChecked(new Date());
      
    } catch (error) {
      console.error('Error checking database status:', error);
      toast({
        title: "Database Check Failed",
        description: "Could not check database status. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsChecking(false);
    }
  };

  const populateDatabase = async () => {
    setIsPopulating(true);
    
    try {
      // Configuration Data
      console.log('🔧 Populating configuration tables...');
      
      const leadSources = [
        'Direct Inquiry', 'Website', 'Google Ads', 'Meta Ads', 
        'TikTok', 'WhatsApp', 'Referral', 'Generic Source'
      ].map((name, index) => ({ id: index + 1, name, active: true }));
      
      await supabase.from('lead_sources').upsert(leadSources, { onConflict: 'name' });
      
      const leadStatuses = [
        'New', 'Contacted', 'Qualified', 'Proposal Sent', 
        'Follow Up', 'Not Interested', 'Converted'
      ].map((name, index) => ({ id: index + 1, name, active: true }));
      
      await supabase.from('lead_status').upsert(leadStatuses, { onConflict: 'name' });
      
      const roomGrades = [
        'Studio', 'En-suite', 'Standard', 'Premium', 'Deluxe', 'Penthouse'
      ].map((name, index) => ({ 
        id: index + 1, 
        name, 
        base_price: 500 + (index * 200),
        active: true 
      }));
      
      await supabase.from('room_grades').upsert(roomGrades, { onConflict: 'name' });
      
      const stayDurations = [
        '1 Week', '2 Weeks', '3 Weeks', '1 Month', '2 Months', 
        '3 Months', '6 Months', '1 Year', 'Academic Year'
      ].map((name, index) => ({ 
        id: index + 1, 
        name,
        days: name.includes('Week') ? parseInt(name) * 7 : 
              name.includes('Month') ? parseInt(name) * 30 : 365,
        active: true 
      }));
      
      await supabase.from('stay_durations').upsert(stayDurations, { onConflict: 'name' });
      
      const studioViews = [
        'City View', 'Garden View', 'Street View', 'Courtyard View', 'River View'
      ].map((name, index) => ({ id: index + 1, name, active: true }));
      
      await supabase.from('studio_views').upsert(studioViews, { onConflict: 'name' });
      
      // Studios
      console.log('🏢 Creating studios...');
      const studios = [];
      const floors = ['G', '1', '2', '3', '4', '5'];
      
      for (let i = 1; i <= 25; i++) {
        const floor = floors[Math.floor(Math.random() * floors.length)];
        const roomNumber = `${floor === 'G' ? 'G' : floor}${String(i).padStart(2, '0')}`;
        
        studios.push({
          id: `studio-${roomNumber}`,
          name: `Studio ${roomNumber}`,
          floor: floor === 'G' ? 0 : parseInt(floor),
          view: studioViews[Math.floor(Math.random() * studioViews.length)].name,
          roomgrade: roomGrades[Math.floor(Math.random() * roomGrades.length)].name,
          price: Math.floor(Math.random() * 3000 + 1000),
          occupied: false,
          occupiedby: null
        });
      }
      
      await supabase.from('studios').upsert(studios, { onConflict: 'id' });
      
      // Users
      console.log('👥 Creating users...');
      const users = [
        { name: 'Admin User', email: 'admin@urbanhub.com', role: 'admin' },
        { name: 'Property Manager', email: 'manager@urbanhub.com', role: 'manager' },
        { name: 'Sales Person', email: 'sales@urbanhub.com', role: 'salesperson' },
        { name: 'Accountant', email: 'accounts@urbanhub.com', role: 'accountant' },
        { name: 'Cleaner', email: 'cleaner@urbanhub.com', role: 'cleaner' },
        { name: 'Student Portal', email: 'student@urbanhub.com', role: 'student' }
      ].map(user => ({
        ...user,
        approved: true,
        approved_at: new Date().toISOString()
      }));
      
      await supabase.from('users').upsert(users, { onConflict: 'email' });
      
      // Leads
      console.log('📈 Creating leads...');
      const leads = [];
      const names = [
        'Alex Johnson', 'Sarah Williams', 'Michael Brown', 'Emma Davis', 'James Wilson'
      ];
      
      for (let i = 1; i <= 50; i++) {
        const name = `${names[i % names.length]} ${i}`;
        const [firstName, lastName] = name.split(' ');
        
        leads.push({
          name,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
          phone: `+44${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)].name,
          source: leadSources[Math.floor(Math.random() * leadSources.length)].name,
          roomgrade: roomGrades[Math.floor(Math.random() * roomGrades.length)].name,
          duration: stayDurations[Math.floor(Math.random() * stayDurations.length)].name,
          revenue: Math.floor(Math.random() * 5000 + 500),
          notes: `Test lead ${i} - interested in accommodation`,
          dateofinquiry: new Date().toISOString()
        });
      }
      
      await supabase.from('leads').upsert(leads);
      
      // Students
      console.log('🎓 Creating students...');
      const students = [];
      const studentNames = ['David Chen', 'Emma Patel', 'Michael O\'Connor', 'Sophie Kim'];
      
      for (let i = 1; i <= 15; i++) {
        const name = `${studentNames[i % studentNames.length]} ${i}`;
        const [firstName, lastName] = name.split(' ');
        const studio = studios[i % studios.length];
        
        students.push({
          name,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@student.ac.uk`,
          phone: `+44${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          room: studio.id,
          duration: stayDurations.filter(d => !d.name.includes('Week'))[Math.floor(Math.random() * 6)].name,
          revenue: studio.price,
          checkin: new Date().toISOString()
        });
      }
      
      await supabase.from('students').upsert(students);
      
      // Tourists
      console.log('🌍 Creating tourists...');
      const tourists = [];
      const touristNames = ['Alice Tourist', 'Bob Visitor', 'Charlie Guest'];
      
      for (let i = 1; i <= 8; i++) {
        const name = `${touristNames[i % touristNames.length]} ${i}`;
        const [firstName, lastName] = name.split(' ');
        const studio = studios[(i + 15) % studios.length];
        
        tourists.push({
          name,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@tourist.com`,
          phone: `+44${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
          room: studio.id,
          duration: ['1 Week', '2 Weeks', '3 Weeks', '1 Month'][Math.floor(Math.random() * 4)],
          revenue: Math.floor(studio.price * 0.8),
          checkin: new Date().toISOString(),
          checkout: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
      
      await supabase.from('tourists').upsert(tourists);
      
      // Maintenance Requests
      console.log('🔧 Creating maintenance requests...');
      const maintenanceRequests = [];
      const issues = [
        'Leaky faucet in bathroom',
        'Heating not working properly',
        'WiFi connection issues',
        'Broken light switch'
      ];
      
      for (let i = 1; i <= 12; i++) {
        const student = students[i % students.length];
        
        maintenanceRequests.push({
          student_id: i,
          studio_id: student.room,
          title: issues[i % issues.length],
          description: `${issues[i % issues.length]} - requires attention`,
          category: 'general',
          priority: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
          urgency: 'normal',
          status: 'pending'
        });
      }
      
      await supabase.from('maintenance_requests').upsert(maintenanceRequests);
      
      toast({
        title: "Database Populated Successfully!",
        description: "All tables have been populated with test data.",
        variant: "default"
      });
      
      // Refresh the status
      await checkDatabaseStatus();
      
    } catch (error) {
      console.error('Error populating database:', error);
      toast({
        title: "Population Failed",
        description: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    } finally {
      setIsPopulating(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const getStatusBadge = (status: 'empty' | 'partial' | 'complete') => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-600">Complete</Badge>;
      case 'partial':
        return <Badge className="bg-yellow-600">Partial</Badge>;
      case 'empty':
        return <Badge variant="destructive">Empty</Badge>;
    }
  };

  const totalTables = tableCounts.length;
  const completeTables = tableCounts.filter(t => t.status === 'complete').length;
  const emptyTables = tableCounts.filter(t => t.status === 'empty').length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-6 h-6 text-blue-600" />
            <span>Database Population Status</span>
          </CardTitle>
          <p className="text-slate-600">
            Check and populate your database with comprehensive test data
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button 
                onClick={checkDatabaseStatus} 
                disabled={isChecking}
                variant="outline"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
                {isChecking ? 'Checking...' : 'Check Status'}
              </Button>
              
              <Button 
                onClick={populateDatabase} 
                disabled={isPopulating}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isPopulating ? 'Populating...' : 'Populate Database'}
              </Button>
            </div>
            
            {lastChecked && (
              <span className="text-sm text-slate-500">
                Last checked: {lastChecked.toLocaleTimeString()}
              </span>
            )}
          </div>

          {tableCounts.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-800">{completeTables}</div>
                    <div className="text-sm text-green-600">Complete</div>
                  </CardContent>
                </Card>
                <Card className="bg-yellow-50 border-yellow-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-yellow-800">
                      {totalTables - completeTables - emptyTables}
                    </div>
                    <div className="text-sm text-yellow-600">Partial</div>
                  </CardContent>
                </Card>
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-800">{emptyTables}</div>
                    <div className="text-sm text-red-600">Empty</div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tableCounts.map((table) => (
                  <div 
                    key={table.table}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {table.status === 'complete' ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium capitalize">
                          {table.table.replace('_', ' ')}
                        </div>
                        <div className="text-sm text-slate-500">
                          {table.count} / {table.expected} records
                        </div>
                      </div>
                    </div>
                    <div>
                      {getStatusBadge(table.status)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabasePopulator; 