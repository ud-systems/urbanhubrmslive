import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  DollarSign, 
  Sparkles, 
  Settings, 
  Users, 
  Calendar,
  Lock,
  CheckCircle,
  Wrench
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { User } from "@/types";
import ProfileDropdown from "@/components/ProfileDropdown";

interface Module {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  route: string;
  color: string;
  gradient: string;
  requiredRole: string[];
  status: 'active' | 'coming-soon' | 'locked';
}

const modules: Module[] = [
  {
    id: 'reservations',
    name: 'Reservations',
    description: 'Manage leads, students, and studio bookings.',
    icon: Building2,
    route: '/dashboard',
    color: 'blue',
    gradient: 'from-blue-600 to-blue-700',
    requiredRole: ['admin', 'manager', 'salesperson', 'accountant', 'cleaner'],
    status: 'active'
  },

  {
    id: 'finance',
    name: 'Finance & Accounts',
    description: 'Track income, expenses, and financial reports.',
    icon: DollarSign,
    route: '/finance',
    color: 'green',
    gradient: 'from-green-600 to-green-700',
    requiredRole: ['admin', 'accountant'],
    status: 'active'
  },
  {
    id: 'cleaning',
    name: 'Cleaning Module',
    description: 'Manage room status and cleaning schedules.',
    icon: Sparkles,
    route: '/cleaning',
    color: 'purple',
    gradient: 'from-purple-600 to-purple-700',
    requiredRole: ['admin', 'cleaner'],
    status: 'active'
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'System configuration and user management.',
    icon: Settings,
    route: '/settings',
    color: 'gray',
    gradient: 'from-gray-600 to-gray-700',
    requiredRole: ['admin'],
    status: 'active'
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    description: 'View and manage maintenance requests.',
    icon: Wrench,
    route: '/maintenance',
    color: 'orange',
    gradient: 'from-orange-600 to-orange-700',
    requiredRole: ['admin', 'manager', 'cleaner'],
    status: 'active'
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Analytics and KPI dashboards.',
    icon: Calendar,
    route: '/reports',
    color: 'indigo',
    gradient: 'from-indigo-600 to-indigo-700',
    requiredRole: ['admin', 'manager', 'salesperson', 'accountant', 'cleaner', 'student'],
    status: 'active'
  }
];

const ModuleSelection = () => {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [userRole, setUserRole] = useState<string>('admin'); // Default for now

  useEffect(() => {
    // Get user role from user object
    if (user?.role) {
      setUserRole(user.role);
      
      // Redirect students to their portal - but only if they came directly here
      // Don't redirect if they were redirected here due to access issues
      if (user.role === 'student') {
        navigate(`/student/${user.id}`, { replace: true });
        return;
      }
    } else if (user) {
      // Fallback to default role if user exists but role is not set
      setUserRole('admin');
    }
  }, [user, navigate]);

  const hasAccess = (module: Module) => {
    return module.requiredRole.includes(userRole);
  };

  const getModuleStatus = (module: Module) => {
    if (!hasAccess(module)) {
      return {
        status: 'locked',
        label: 'No Access',
        color: 'bg-gradient-to-r from-red-500 to-red-600',
        textColor: 'text-white',
        disabled: true
      };
    }

    switch (module.status) {
      case 'active':
        return {
          status: 'active',
          label: 'Access Module',
          color: `bg-gradient-to-r ${module.gradient}`,
          textColor: 'text-white',
          disabled: false
        };
      case 'coming-soon':
        return {
          status: 'coming-soon',
          label: 'Coming Soon',
          color: 'bg-gradient-to-r from-yellow-500 to-orange-500',
          textColor: 'text-white',
          disabled: true
        };
      case 'locked':
        return {
          status: 'locked',
          label: 'Locked',
          color: 'bg-gradient-to-r from-red-500 to-red-600',
          textColor: 'text-white',
          disabled: true
        };
      default:
        return {
          status: 'locked',
          label: 'No Access',
          color: 'bg-gradient-to-r from-red-500 to-red-600',
          textColor: 'text-white',
          disabled: true
        };
    }
  };

  const handleModuleClick = (module: Module) => {
    if (hasAccess(module) && module.status === 'active') {
      navigate(module.route);
    }
  };

  // Show loading state while user is being fetched
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-indigo-50 to-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading modules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Beautiful Blur Radial Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-indigo-50 to-white"></div>
      <div className="absolute inset-0 bg-gradient-to-tl from-purple-100/50 via-transparent to-pink-100/30"></div>
      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-100/40 via-transparent to-blue-100/20"></div>
      
      {/* Floating Blur Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-gradient-to-br from-indigo-400/15 to-blue-400/15 rounded-full blur-3xl animate-pulse delay-500"></div>
      
      {/* Content Overlay */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top Navigation */}
        <div className="flex justify-between items-center p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">UrbanHub</h1>
              <p className="text-sm text-slate-600">Property Management System</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ProfileDropdown />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to UrbanHub
          </h2>
          <p className="text-lg text-slate-700 max-w-2xl mx-auto font-medium">
            Select a module to access the functionality you need. Your access is based on your role permissions.
          </p>
        </div>

        {/* Module Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modules.map((module) => {
            const IconComponent = module.icon;
            const hasModuleAccess = hasAccess(module);

            return (
              <Card 
                key={module.id} 
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl backdrop-blur-sm bg-white/80 border-white/20 ${
                  hasModuleAccess ? 'hover:scale-105 hover:bg-white/90' : 'opacity-75'
                }`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br ${module.gradient}`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-slate-900">
                    {module.name}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {module.description}
                  </p>

                  <Button
                    className={`w-full bg-gradient-to-r ${module.gradient} text-white hover:opacity-90 transition-all duration-200`}
                    disabled={!hasModuleAccess || module.status !== 'active'}
                    onClick={() => handleModuleClick(module)}
                  >
                    {hasModuleAccess && module.status === 'active' ? 'Access Module' : 'Unavailable'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Need access to additional modules? Contact your administrator.
          </p>
        </div>
      </div>
    </div>
  </div>
  );
};

export default ModuleSelection; 