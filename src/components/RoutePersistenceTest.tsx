import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useRoutePersistence } from '@/hooks/useStatePersistence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const RoutePersistenceTest = () => {
  const location = useLocation();
  const { saveCurrentRoute, loadRouteState } = useRoutePersistence();
  const [savedRoute, setSavedRoute] = useState<string | null>(null);

  useEffect(() => {
    // Load saved route state
    const routeState = loadRouteState();
    if (routeState?.currentRoute) {
      setSavedRoute(routeState.currentRoute);
    }
  }, [loadRouteState]);

  const handleSaveRoute = () => {
    saveCurrentRoute();
    const routeState = loadRouteState();
    setSavedRoute(routeState?.currentRoute || null);
  };

  const handleClearRoute = () => {
    localStorage.removeItem('urbanhub-app-state');
    sessionStorage.removeItem('urbanhub-app-state');
    setSavedRoute(null);
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Route Persistence Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <strong>Current Route:</strong> {location.pathname + location.search}
        </div>
        <div>
          <strong>Saved Route:</strong> {savedRoute || 'None'}
        </div>
        <div className="flex space-x-2">
          <Button onClick={handleSaveRoute} size="sm">
            Save Current Route
          </Button>
          <Button onClick={handleClearRoute} size="sm" variant="outline">
            Clear Saved Route
          </Button>
        </div>
        <div className="text-sm text-gray-600">
          <p>Instructions:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Navigate to any page</li>
            <li>Click "Save Current Route"</li>
            <li>Refresh the page</li>
            <li>You should return to the saved route</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
};

export default RoutePersistenceTest; 