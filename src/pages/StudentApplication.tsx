import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, User } from "lucide-react";
import StudentApplicationForm from "@/components/StudentApplicationForm";
import { useAuth } from "@/contexts/AuthContext";

const StudentApplication = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/')}
              className="bg-white/80 backdrop-blur-md border-slate-200 hover:bg-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Modules
            </Button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Student Application</h1>
              <p className="text-sm text-slate-500">Complete your accommodation application</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-700">Application Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Card */}
          <div className="mb-6">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Welcome to Your Application</h2>
                  <p className="text-slate-600">
                    Please complete all sections of your accommodation application. You can save your progress and return later.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Application Form */}
          <StudentApplicationForm />
        </div>
      </main>
    </div>
  );
};

export default StudentApplication; 