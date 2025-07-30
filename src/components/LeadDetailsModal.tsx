import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, User, MessageSquare, Send, Calendar, Phone, Mail, Building2, DollarSign, Target } from "lucide-react";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";

interface Lead {
  id: number;
  name: string;
  phone: string;
  email: string;
  status: string;
  source: string;
  roomgrade: string;
  duration: string;
  revenue: number;
  assignedto: string;
  notes: string;
  dateofinquiry: string;
  responsecategory: string;
  followupstage: string;
  created_at?: string;
  updated_at?: string;
}

interface Comment {
  id: number;
  lead_id: number;
  text: string;
  user_id: string;
  user_name: string;
  user_email: string;
  created_at: string;
}

interface AuditEntry {
  id: number;
  table_name: string;
  record_id: string;
  action: string;
  old_data: any;
  new_data: any;
  user_id: string;
  user_email: string;
  timestamp: string;
}

interface LeadDetailsModalProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
}

const LeadDetailsModal = ({ lead, isOpen, onClose }: LeadDetailsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);

  // Fetch comments and audit trail when modal opens
  useEffect(() => {
    if (isOpen && lead) {
      fetchComments();
      fetchAuditTrail();
    }
  }, [isOpen, lead]);

  const fetchComments = async () => {
    if (!lead) return;
    
    setCommentsLoading(true);
    try {
      // Use the helper function for better performance
      const { data, error } = await supabase
        .rpc('get_lead_comments', { lead_id_param: lead.id });

      if (error) throw error;

      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive"
      });
    } finally {
      setCommentsLoading(false);
    }
  };

  const fetchAuditTrail = async () => {
    if (!lead) return;
    
    setAuditLoading(true);
    try {
      // Use the helper function for better performance
      const { data, error } = await supabase
        .rpc('get_audit_trail', { 
          table_name_param: 'leads', 
          record_id_param: lead.id.toString() 
        });

      if (error) throw error;

      setAuditTrail(data || []);
    } catch (error) {
      console.error('Error fetching audit trail:', error);
      toast({
        title: "Error",
        description: "Failed to load audit history",
        variant: "destructive"
      });
    } finally {
      setAuditLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !lead || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lead_comments')
        .insert([{
          lead_id: lead.id,
          text: newComment.trim(),
          user_id: user.id
        }])
        .select();

      if (error) throw error;

      // Add the new comment to the list
      const newCommentData = {
        id: data[0].id,
        lead_id: lead.id,
        text: newComment.trim(),
        user_id: user.id,
        user_name: user.name || 'Current User',
        user_email: user.email || '',
        created_at: data[0].created_at
      };

      setComments([newCommentData, ...comments]);
      setNewComment("");
      
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully."
      });
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot": return "bg-orange-100 text-orange-800";
      case "Converted": return "bg-green-100 text-green-800";
      case "Cold": return "bg-blue-100 text-blue-800";
      case "Dead": return "bg-red-100 text-red-800";
      case "New": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionDescription = (entry: AuditEntry) => {
    if (entry.action === 'INSERT') {
      return 'Lead created';
    } else if (entry.action === 'UPDATE') {
      const oldData = entry.old_data || {};
      const newData = entry.new_data || {};
      const changedFields = Object.keys(newData).filter(key => 
        oldData[key] !== newData[key] && key !== 'updated_at'
      );
      
      if (changedFields.length === 1) {
        const field = changedFields[0];
        const oldValue = oldData[field] || 'empty';
        const newValue = newData[field] || 'empty';
        return `${field} updated: ${oldValue} → ${newValue}`;
      } else if (changedFields.length > 1) {
        return `${changedFields.length} fields updated`;
      }
      return 'Lead updated';
    } else if (entry.action === 'DELETE') {
      return 'Lead deleted';
    }
    return entry.action;
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-4">
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-medium">
                {lead.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-bold">{lead.name}</h2>
              <Badge className={getStatusColor(lead.status)}>{lead.status}</Badge>
            </div>
          </DialogTitle>
          <p className="text-sm text-slate-600">
            View lead details, add comments, and track history.
          </p>
        </DialogHeader>

        <Tabs defaultValue="details" className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-slate-500 flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone:
                    </span>
                    <p className="font-medium">{lead.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email:
                    </span>
                    <p className="font-medium">{lead.email || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Source:
                    </span>
                    <p className="font-medium">{lead.source || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Inquiry Date:
                    </span>
                    <p className="font-medium">
                      {lead.dateofinquiry ? formatDate(lead.dateofinquiry) : 'Not specified'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="text-sm text-slate-500">Room Grade:</span>
                    <p className="font-medium">{lead.roomgrade || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Duration:</span>
                    <p className="font-medium">{lead.duration || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500 flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Revenue:
                    </span>
                    <p className="font-medium">£{(lead.revenue || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Response Category:</span>
                    <p className="font-medium">{lead.responsecategory || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Follow-up Stage:</span>
                    <p className="font-medium">{lead.followupstage || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Assigned To:</span>
                    <p className="font-medium">{lead.assignedto || 'Not assigned'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {lead.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-700 whitespace-pre-wrap">{lead.notes}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-slate-500">Created:</span>
                    <p className="font-medium">
                      {lead.created_at ? formatDate(lead.created_at) : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Last Updated:</span>
                    <p className="font-medium">
                      {lead.updated_at ? formatDate(lead.updated_at) : 'Unknown'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comments" className="space-y-4 overflow-y-auto">
            <div className="space-y-4">
              {commentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Loading comments...</p>
                </div>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3 p-4 bg-slate-50 rounded-lg">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-600 text-white text-sm">
                        {comment.user_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.user_name}</span>
                        <span className="text-xs text-slate-500">{formatDate(comment.created_at)}</span>
                      </div>
                      <p className="text-slate-700">{comment.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No comments yet</p>
                  <p className="text-sm">Be the first to add a comment!</p>
                </div>
              )}
            </div>

            <div className="flex space-x-2 pt-4 border-t">
              <Textarea
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <Button 
                onClick={handleAddComment} 
                className="bg-gradient-to-r from-blue-600 to-blue-700"
                disabled={loading || !newComment.trim()}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4 overflow-y-auto">
            <div className="space-y-3">
              {auditLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-slate-500 mt-2">Loading audit history...</p>
                </div>
              ) : auditTrail.length > 0 ? (
                auditTrail.map((entry) => (
                  <div key={entry.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {getActionDescription(entry)}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {entry.user_email}
                        </span>
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No audit history available</p>
                  <p className="text-sm">Changes will appear here once made</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default LeadDetailsModal;
