import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface DataStatus {
  leads: number;
  students: number;
  tourists: number;
  studios: number;
  isPopulated: boolean;
}

const QuickDataCheck = () => {
  const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkDataStatus = async () => {
    setIsChecking(true);
    try {
      const [
        { count: leads },
        { count: students }, 
        { count: tourists },
        { count: studios }
      ] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('tourists').select('*', { count: 'exact', head: true }),
        supabase.from('studios').select('*', { count: 'exact', head: true })
      ]);

      const status: DataStatus = {
        leads: leads || 0,
        students: students || 0,
        tourists: tourists || 0,
        studios: studios || 0,
        isPopulated: (leads || 0) > 10 && (students || 0) > 5 && (studios || 0) > 10
      };

      setDataStatus(status);
    } catch (error) {
      console.error('Error checking data status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkDataStatus();
  }, []);

  if (!dataStatus) return null;

  return (
    <Card className={`${dataStatus.isPopulated ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Database Status</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={checkDataStatus}
            disabled={isChecking}
          >
            <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between">
            <span>Leads:</span>
            <Badge variant={dataStatus.leads > 0 ? "secondary" : "destructive"} className="text-xs">
              {dataStatus.leads}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Students:</span>
            <Badge variant={dataStatus.students > 0 ? "secondary" : "destructive"} className="text-xs">
              {dataStatus.students}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Tourists:</span>
            <Badge variant={dataStatus.tourists > 0 ? "secondary" : "destructive"} className="text-xs">
              {dataStatus.tourists}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span>Studios:</span>
            <Badge variant={dataStatus.studios > 0 ? "secondary" : "destructive"} className="text-xs">
              {dataStatus.studios}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 pt-2 border-t">
          {dataStatus.isPopulated ? (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Database Populated</span>
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-xs text-yellow-700 font-medium">Needs Population</span>
            </>
          )}
        </div>
        
        {!dataStatus.isPopulated && (
          <div className="text-xs text-yellow-600">
            Go to Settings → Database tab to populate with test data
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickDataCheck; 