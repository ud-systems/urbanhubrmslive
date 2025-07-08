
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Clock, User, Edit, UserPlus, Building, Trash2, X } from "lucide-react";

interface NotificationsProps {
  onClose?: () => void;
  isPanel?: boolean;
}

const Notifications = ({ onClose, isPanel = false }: NotificationsProps) => {
  const [filter, setFilter] = useState("all");

  // TODO: Replace with actual audit trail from database
  const auditTrail: any[] = [];

  const filteredAudit = filter === "all" ? auditTrail : auditTrail.filter(item => item.type.includes(filter));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Notifications</h2>
          <p className="text-slate-600 mt-1">System audit trail and activity log</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter notifications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="lead">Lead Activities</SelectItem>
              <SelectItem value="student">Student Activities</SelectItem>
              <SelectItem value="studio">Studio Activities</SelectItem>
            </SelectContent>
          </Select>
          {isPanel && onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAudit.map((activity) => {
            const IconComponent = activity.icon;
            return (
              <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-lg hover:bg-slate-50 transition-colors">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activity.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{activity.message}</p>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span>{activity.user}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{activity.timestamp}</span>
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className={activity.color}>
                  {activity.type.replace(/_/g, ' ')}
                </Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
};

export default Notifications;
