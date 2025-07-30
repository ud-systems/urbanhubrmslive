import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import ConfigManager from "../components/ConfigManager";
import RoomGradeManager from "../components/RoomGradeManager";
import DocumentManagement from "../components/DocumentManagement";
import {
  getResponseCategories, createResponseCategory, updateResponseCategory, deleteResponseCategory,
  getRoomGrades, createRoomGrade, updateRoomGrade, deleteRoomGrade,
  getStayDurations, createStayDuration, updateStayDuration, deleteStayDuration,
  getLeadSources, createLeadSource, updateLeadSource, deleteLeadSource,
  getLeads, getStudios, getStudents, createStudent, createLead, createStudio, getUsers, createUserWithProfile,
  getLeadStatus, createLeadStatus, updateLeadStatus, deleteLeadStatus,
  getFollowUpStages, createFollowUpStage, updateFollowUpStage, deleteFollowUpStage,
  getStudioViews, createStudioView, updateStudioView, deleteStudioView
} from "@/lib/supabaseCrud";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";
import { Progress } from "@/components/ui/progress";
import { Eye, Edit, CheckCircle, Shield, UserCheck, UserX, Trash2, Settings as SettingsIcon, Users, Upload, Target, Building2, Clock, MessageSquare, Download, FileText, BarChart3, RefreshCw, ArrowLeft, CreditCard, Key, ToggleLeft, ToggleRight } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import { StripeConfig, defaultStripeConfig } from "@/lib/stripe";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";


const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [tab, setTab] = useState("templates");
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [csvType, setCsvType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseCategories, setResponseCategories] = useState<any[]>([]);
  const [roomGrades, setRoomGrades] = useState<any[]>([]);
  const [stayDurations, setStayDurations] = useState<any[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [stripeConfig, setStripeConfig] = useState<StripeConfig>(defaultStripeConfig);
  const [stripeConfigSaving, setStripeConfigSaving] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "salesperson" });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkUsers, setBulkUsers] = useState<any[]>([]);
  const [bulkUploadType, setBulkUploadType] = useState<string>("");
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [bulkUploadError, setBulkUploadError] = useState<string | null>(null);
  const [bulkUploadSuccess, setBulkUploadSuccess] = useState<string | null>(null);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [userStatusFilter, setUserStatusFilter] = useState<string>("all");
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isBulkEditOpen, setIsBulkEditOpen] = useState(false);
  const [bulkEditFields, setBulkEditFields] = useState({ name: "", email: "", role: "no-change", email_verified: "no-change", approved: "no-change" });
  const [bulkEditLoading, setBulkEditLoading] = useState(false);
  const [bulkEditError, setBulkEditError] = useState<string | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserLoading, setEditUserLoading] = useState(false);
  const [editUserError, setEditUserError] = useState(null);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);
  const [approveUserLoading, setApproveUserLoading] = useState(false);
  const [verifyUserLoading, setVerifyUserLoading] = useState(false);
  const [leadStatus, setLeadStatus] = useState<any[]>([]);
  const [followUpStages, setFollowUpStages] = useState<any[]>([]);
  const [studioViews, setStudioViews] = useState<any[]>([]);
  const [bulkUploadProgress, setBulkUploadProgress] = useState(0);
  const [bulkUploadErrorDetails, setBulkUploadErrorDetails] = useState<any[]>([]);

  // Fetch all config data
  const fetchConfigs = async () => {
    setLoading(true);
    setError(null);
    try {
      const [ls, rg, sd, lsrc, fus, rc, sv] = await Promise.all([
        getLeadStatus(),
        getRoomGrades(),
        getStayDurations(),
        getLeadSources(),
        getFollowUpStages(),
        getResponseCategories(),
        getStudioViews()
      ]);
      setLeadStatus(ls || []);
      setRoomGrades(rg || []);
      setStayDurations(sd || []);
      setLeadSources(lsrc || []);
      setFollowUpStages(fus || []);
      setResponseCategories(rc || []);
      setStudioViews(sv || []);
    } catch (e: any) {
      setError(e.message || String(e));
      toast({ title: "Error loading config data", description: e.message || String(e), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    setUsersError(null);
    try {
      // Fetch users from our custom users table - simplified query without user_roles table
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          role,
          approved,
          created_at,
          updated_at
        `)
        .order('id', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsersError('Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  // Fetch users when User Management tab is selected
  useEffect(() => {
    if (tab === "user-management") {
      fetchUsers();
    }
  }, [tab]);

  // CSV upload handlers
  const handleCsvUpload = (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file, type);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        processFile(file, type);
      } else {
        toast({ 
          title: 'Invalid file type', 
          description: 'Please upload a CSV file.', 
          variant: 'destructive' 
        });
      }
    }
  };

  // Process uploaded file
  const processFile = (file: File, type: string) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      comments: '#', // Skip comment lines starting with #
      complete: (results) => {
        // Validate and format the data before showing preview
        const validatedData = results.data.map((row, index) => {
          const validatedRow = { ...row };
          
          // For leads and students, validate date format
          if ((type === "leads" || type === "students") && validatedRow.dateofinquiry) {
            try {
              // Handle various date formats
              let dateValue = validatedRow.dateofinquiry;
              
              // Remove any extra whitespace
              dateValue = dateValue.trim();
              
              // Handle common date formats
              let date;
              if (dateValue.includes('/')) {
                // Handle DD/MM/YYYY or MM/DD/YYYY formats
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                  // Assume DD/MM/YYYY format
                  date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
              } else if (dateValue.includes('-')) {
                // Handle YYYY-MM-DD format
                date = new Date(dateValue);
              } else {
                // Try direct parsing
                date = new Date(dateValue);
              }
              
              if (!isNaN(date.getTime())) {
                validatedRow.dateofinquiry = date.toISOString().split('T')[0];
              } else {
                validatedRow.dateofinquiry = 'Invalid Date';
              }
            } catch (error) {
              validatedRow.dateofinquiry = 'Invalid Date';
            }
          }
          
          // Validate numeric fields
          if (validatedRow.revenue) {
            const revenue = parseFloat(validatedRow.revenue);
            if (isNaN(revenue)) {
              validatedRow.revenue = 'Invalid Number';
            }
          }
          
          return validatedRow;
        });
        
        setCsvPreview(validatedData);
        setCsvType(type);
        
        // Show warning if there are validation issues
        const hasIssues = validatedData.some(row => 
          row.dateofinquiry === 'Invalid Date' || row.revenue === 'Invalid Number'
        );
        
        if (hasIssues) {
          toast({ 
            title: 'Data Validation Warning', 
            description: 'Some rows have formatting issues. Please check the preview and fix any invalid dates or numbers.',
            variant: 'destructive'
          });
        }
      },
      error: (err) => {
        toast({ title: 'CSV Parse Error', description: err.message, variant: 'destructive' });
      }
    });
  };

  const handleBulkInsert = async () => {
    setLoading(true);
    try {
      if (csvType === "students") {
        // Format date fields for students before insertion
        const formattedStudents = csvPreview.map(row => {
          const formattedRow = { ...row };
          
          // Format dateofinquiry field
          if (formattedRow.dateofinquiry) {
            try {
              // Handle various date formats
              let dateValue = formattedRow.dateofinquiry;
              
              // Remove any extra whitespace
              dateValue = dateValue.trim();
              
              // Handle common date formats
              let date;
              if (dateValue.includes('/')) {
                // Handle DD/MM/YYYY or MM/DD/YYYY formats
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                  // Assume DD/MM/YYYY format
                  date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
              } else if (dateValue.includes('-')) {
                // Handle YYYY-MM-DD format
                date = new Date(dateValue);
              } else {
                // Try direct parsing
                date = new Date(dateValue);
              }
              
              if (!isNaN(date.getTime())) {
                formattedRow.dateofinquiry = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              } else {
                // If date parsing fails, set to null
                formattedRow.dateofinquiry = null;
              }
            } catch (error) {
              console.warn('Invalid date format for dateofinquiry:', formattedRow.dateofinquiry);
              formattedRow.dateofinquiry = null;
            }
          }
          
          // Ensure numeric fields are properly formatted
          if (formattedRow.revenue) {
            formattedRow.revenue = parseFloat(formattedRow.revenue) || 0;
          }
          
          // Remove any empty strings and replace with null
          Object.keys(formattedRow).forEach(key => {
            if (formattedRow[key] === '') {
              formattedRow[key] = null;
            }
          });
          
          return formattedRow;
        });
        
        await Promise.all(formattedStudents.map(row => createStudent(row)));
      } else if (csvType === "leads") {
        // Format date fields for leads before insertion
        const formattedLeads = csvPreview.map(row => {
          const formattedRow = { ...row };
          
          // Format dateofinquiry field
          if (formattedRow.dateofinquiry) {
            try {
              // Handle various date formats
              let dateValue = formattedRow.dateofinquiry;
              
              // Remove any extra whitespace
              dateValue = dateValue.trim();
              
              // Handle common date formats
              let date;
              if (dateValue.includes('/')) {
                // Handle DD/MM/YYYY or MM/DD/YYYY formats
                const parts = dateValue.split('/');
                if (parts.length === 3) {
                  // Assume DD/MM/YYYY format
                  date = new Date(parts[2], parts[1] - 1, parts[0]);
                }
              } else if (dateValue.includes('-')) {
                // Handle YYYY-MM-DD format
                date = new Date(dateValue);
              } else {
                // Try direct parsing
                date = new Date(dateValue);
              }
              
              if (!isNaN(date.getTime())) {
                formattedRow.dateofinquiry = date.toISOString().split('T')[0]; // YYYY-MM-DD format
              } else {
                // If date parsing fails, set to null
                formattedRow.dateofinquiry = null;
              }
            } catch (error) {
              console.warn('Invalid date format for dateofinquiry:', formattedRow.dateofinquiry);
              formattedRow.dateofinquiry = null;
            }
          }
          
          // Ensure numeric fields are properly formatted
          if (formattedRow.revenue) {
            formattedRow.revenue = parseFloat(formattedRow.revenue) || 0;
          }
          
          // Remove any empty strings and replace with null
          Object.keys(formattedRow).forEach(key => {
            if (formattedRow[key] === '') {
              formattedRow[key] = null;
            }
          });
          
          return formattedRow;
        });
        
        await Promise.all(formattedLeads.map(row => createLead(row)));
      } else if (csvType === "studios") {
        // Process studios one by one with better error handling
        let successCount = 0;
        let failCount = 0;
        const errorDetails: any[] = [];
        
        for (let i = 0; i < csvPreview.length; i++) {
          const studio = csvPreview[i];
          try {
            // Clean up the data before sending
            const cleanStudio = {
              ...studio,
              // Remove any empty strings and convert to proper types
              name: studio.name?.trim() || '',
              id: studio.id?.trim() || '',
              view: studio.view?.trim() || '',
              floor: studio.floor,
              roomGrade: studio.roomGrade?.trim() || '',
              // Set default values for system-managed fields
              occupied: false,
              occupiedby: null
            };
            
            await createStudio(cleanStudio);
            successCount++;
          } catch (e: any) {
            failCount++;
            errorDetails.push({ 
              row: i + 1, 
              id: studio.id, 
              reason: e.message || String(e) 
            });
            console.error(`Studio upload error at row ${i + 1}:`, e);
          }
        }
        
        if (failCount > 0) {
          toast({
            title: 'Bulk upload completed with errors',
            description: `Uploaded ${successCount} studios. ${failCount} failed.`,
            variant: 'destructive',
          });
          console.error('Studio upload errors:', errorDetails);
        } else {
          toast({ 
            title: 'Bulk upload successful', 
            description: `Uploaded ${successCount} studios successfully.` 
          });
        }
      }
      setCsvPreview([]);
      setCsvType("");
    } catch (e: any) {
      toast({ title: 'Bulk upload failed', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    setAddUserLoading(true);
    setAddUserError(null);
    try {
      await createUserWithProfile(newUser.email, newUser.password, newUser.name, newUser.role);
      setIsAddUserOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "salesperson" });
      fetchUsers();
      toast({ title: "User created", description: "User added successfully." });
    } catch (e: any) {
      setAddUserError(e.message || String(e));
    } finally {
      setAddUserLoading(false);
    }
  };

  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBulkUploadError(null);
    setBulkUploadSuccess(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setBulkUsers(results.data);
          setBulkUploadType("csv");
        },
        error: (err) => {
          setBulkUploadError(err.message);
        }
      });
    } else if (["xlsx", "xls"].includes(ext || "")) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet);
        setBulkUsers(json);
        setBulkUploadType("excel");
      };
      reader.readAsArrayBuffer(file);
    } else {
      setBulkUploadError("Unsupported file type. Please upload a CSV or Excel file.");
    }
  };

  const handleBulkUploadUsers = async () => {
    setBulkUploadLoading(true);
    setBulkUploadError(null);
    setBulkUploadSuccess(null);
    setBulkUploadProgress(0);
    setBulkUploadErrorDetails([]);
    let successCount = 0;
    let failCount = 0;
    const errorDetails: any[] = [];
    for (let i = 0; i < bulkUsers.length; i++) {
      const user = bulkUsers[i];
      try {
        await createUserWithProfile(user.email, user.password, user.name, user.role || "salesperson");
        successCount++;
      } catch (e: any) {
        failCount++;
        errorDetails.push({ row: i + 1, email: user.email, reason: e.message || String(e) });
      }
      setBulkUploadProgress(Math.round(((i + 1) / bulkUsers.length) * 100));
    }
    setBulkUploadLoading(false);
    setBulkUploadSuccess(`Uploaded ${successCount} users. ${failCount > 0 ? failCount + ' failed.' : ''}`);
    setBulkUploadErrorDetails(errorDetails);
    setBulkUsers([]);
    fetchUsers();
    if (failCount > 0) {
      toast({
        title: 'Bulk upload completed with errors',
        description: `Uploaded ${successCount} users. ${failCount} failed.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Bulk upload successful',
        description: `Uploaded ${successCount} users.`
      });
    }
  };

  const filteredUsers = users.filter(user => {
    const roleMatch = userRoleFilter === "all" || user.role === userRoleFilter;
    const statusMatch = userStatusFilter === "all" || 
      (userStatusFilter === "verified" && user.email_verified) ||
      (userStatusFilter === "unverified" && !user.email_verified) ||
      (userStatusFilter === "approved" && user.approved) ||
      (userStatusFilter === "pending" && !user.approved);
    return roleMatch && statusMatch;
  });

  const handleSelectUser = (id: string, checked: boolean) => {
    setSelectedUserIds(prev => checked ? [...prev, id] : prev.filter(uid => uid !== id));
  };
  const handleSelectAllUsers = (checked: boolean) => {
    setSelectedUserIds(checked ? filteredUsers.map(u => u.id) : []);
  };
  const handleBulkEdit = async () => {
    setBulkEditLoading(true);
    setBulkEditError(null);
    try {
      for (const id of selectedUserIds) {
        const updates: any = {};
        if (bulkEditFields.name) updates.name = bulkEditFields.name;
        if (bulkEditFields.email) updates.email = bulkEditFields.email;
        if (bulkEditFields.role && bulkEditFields.role !== "no-change") updates.role = bulkEditFields.role;
        if (bulkEditFields.email_verified && bulkEditFields.email_verified !== "no-change") updates.email_verified = bulkEditFields.email_verified === "verified";
        if (bulkEditFields.approved && bulkEditFields.approved !== "no-change") updates.approved = bulkEditFields.approved === "approved";
        if (Object.keys(updates).length > 0) {
          await supabase.from('profiles').update(updates).eq('id', id);
        }
      }
      setIsBulkEditOpen(false);
      setBulkEditFields({ name: "", email: "", role: "no-change", email_verified: "no-change", approved: "no-change" });
      setSelectedUserIds([]);
      fetchUsers();
      toast({ title: "Users updated", description: "Bulk edit successful." });
    } catch (e: any) {
      setBulkEditError(e.message || String(e));
    } finally {
      setBulkEditLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setIsEditUserOpen(true);
  };

  const handleUpdateUser = async () => {
    setEditUserLoading(true);
    setEditUserError(null);
    try {
      await supabase.from('profiles').update({
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role
      }).eq('id', editingUser.id);
      setIsEditUserOpen(false);
      setEditingUser(null);
      fetchUsers();
      toast({ title: 'User updated', description: 'User updated successfully.' });
    } catch (e) {
      setEditUserError(e.message || String(e));
    } finally {
      setEditUserLoading(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      // Delete from user_roles first (due to foreign key constraint)
      await supabase.from('user_roles').delete().eq('user_id', user.id);
      // Then delete from users table
      await supabase.from('users').delete().eq('id', user.id);
      fetchUsers();
      toast({ title: 'User deleted', description: 'User deleted successfully.' });
    } catch (e) {
      toast({ title: 'Delete failed', description: e.message || String(e), variant: 'destructive' });
    }
  };

  const handleViewUser = (user) => {
    setViewingUser(user);
    setIsViewUserOpen(true);
  };

  const handleApproveUser = async (user) => {
    setApproveUserLoading(true);
    try {
      await supabase.from('users').update({ 
        approved: true, 
        approved_at: new Date().toISOString()
      }).eq('id', user.id);
      fetchUsers();
      toast({ title: 'User approved', description: 'User has been approved successfully.' });
    } catch (e) {
      toast({ title: 'Approval failed', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setApproveUserLoading(false);
    }
  };

  const handleVerifyUser = async (user) => {
    setVerifyUserLoading(true);
    try {
      // Note: Email verification is handled by Supabase Auth
      // This function can be used for additional verification if needed
      await supabase.from('users').update({ 
        updated_at: new Date().toISOString()
      }).eq('id', user.id);
      fetchUsers();
      toast({ title: 'User verified', description: 'User has been verified successfully.' });
    } catch (e) {
      toast({ title: 'Verification failed', description: e.message || String(e), variant: 'destructive' });
    } finally {
      setVerifyUserLoading(false);
    }
  };

  // Helper function to download improved CSV template
  const downloadTemplate = (type: string) => {
    let csvContent = '';
    let filename = '';
    
    // Get actual values from database
    const statusOptions = leadStatus.map(s => s.name).join(', ');
    const sourceOptions = leadSources.map(s => s.name).join(', ');
    const roomGradeOptions = roomGrades.map(r => r.name).join(', ');
    const durationOptions = stayDurations.map(d => d.name).join(', ');
    const responseOptions = responseCategories.map(r => r.name).join(', ');
    const followUpOptions = followUpStages.map(f => f.name).join(', ');
    
    if (type === 'leads') {
      csvContent = `# Leads CSV Template
# Date format: YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY (e.g., 2024-09-01, 01/09/2024, 09/01/2024)
# Revenue should be a number (e.g., 12000)
# All fields are optional except name
# Available Status options: ${statusOptions}
# Available Source options: ${sourceOptions}
# Available Room Grade options: ${roomGradeOptions}
# Available Duration options: ${durationOptions}
# Available Response Category options: ${responseOptions}
# Available Follow Up Stage options: ${followUpOptions}
name,phone,email,status,source,roomgrade,duration,revenue,assignedto,notes,dateofinquiry,responsecategory,followupstage
Jane Smith,9876543210,jane@example.com,${leadStatus[0]?.name || 'New'},${leadSources[0]?.name || 'Website'},${roomGrades[0]?.name || 'Standard'},${stayDurations[0]?.name || 'Academic Year'},12000,John Doe,Interested in sea view,2024-09-01,${responseCategories[0]?.name || 'Interested'},${followUpStages[0]?.name || 'Initial Contact'}
John Doe,1234567890,john@example.com,${leadStatus[1]?.name || 'Follow Up'},${leadSources[1]?.name || 'Meta Ads'},${roomGrades[1]?.name || 'Premium'},${stayDurations[1]?.name || 'Short Term'},8000,Jane Smith,Prefers ground floor,01/08/2024,${responseCategories[1]?.name || 'Positive'},${followUpStages[1]?.name || 'Follow Up'}
Alice Johnson,5551234567,alice@example.com,${leadStatus[2]?.name || 'Converted'},${leadSources[2]?.name || 'Google Ads'},${roomGrades[2]?.name || 'Deluxe'},${stayDurations[2]?.name || 'Custom Duration'},15000,John Doe,Booked for next month,07/20/2024,${responseCategories[2]?.name || 'Booked'},${followUpStages[2]?.name || 'Converted'}`;
      filename = 'leads_template.csv';
    } else if (type === 'students') {
      csvContent = `# Students CSV Template
# Date format: YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY (e.g., 2024-09-01, 01/09/2024, 09/01/2024)
# Revenue should be a number (e.g., 12000)
# All fields are optional except name
# Available Room Grade options: ${roomGradeOptions}
# Available Duration options: ${durationOptions}
name,phone,email,roomgrade,duration,revenue,assignedto,notes,dateofinquiry,responsecategory,followupstage
Jane Smith,9876543210,jane@example.com,${roomGrades[0]?.name || 'Standard'},${stayDurations[0]?.name || 'Academic Year'},12000,John Doe,Interested in sea view,2024-09-01,${responseCategories[0]?.name || 'Interested'},${followUpStages[0]?.name || 'Initial Contact'}
John Doe,1234567890,john@example.com,${roomGrades[1]?.name || 'Premium'},${stayDurations[1]?.name || 'Short Term'},8000,Jane Smith,Prefers ground floor,15/08/2024,${responseCategories[1]?.name || 'Positive'},${followUpStages[1]?.name || 'Follow Up'}`;
      filename = 'students_template.csv';
    } else if (type === 'studios') {
      const studioViewOptions = studioViews.map(v => v.name).join(', ');
      csvContent = `# Studios CSV Template
# All fields are optional except id and name
# Floor should be a number (e.g., 1, 2, 3) or "G" for ground floor
# View options: ${studioViewOptions} (or leave empty for "Not chosen")
# Room Grade should match existing room grades in the system: ${roomGradeOptions}
# Occupied and occupiedby are managed by the system
id,name,view,floor,roomGrade
STD001,Platinum Studio A1,${studioViews[0]?.name || 'Moor Lane'},G,${roomGrades[0]?.name || 'Gold Studios'}
STD002,Gold Studio B2,${studioViews[1]?.name || 'Sizer Street'},1,${roomGrades[1]?.name || 'Silver Studios'}
STD003,Silver Studio C3,${studioViews[2]?.name || 'Asmoor Lane'},2,${roomGrades[2]?.name || 'Platinum Studio'}`;
      filename = 'studios_template.csv';
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({ 
      title: 'Template Downloaded', 
      description: `${type.charAt(0).toUpperCase() + type.slice(1)} template downloaded successfully.` 
    });
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading settings..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Settings</h2>
            <p className="text-slate-600 mt-2">Manage your system settings and preferences.</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Button>
        </div>
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="bulk-uploads">Bulk Uploads</TabsTrigger>
          <TabsTrigger value="data-management">Data Management</TabsTrigger>
          <TabsTrigger value="user-management">User Management</TabsTrigger>
          <TabsTrigger value="document-management">Documents</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">CSV Templates</h2>
            <p className="text-slate-600">Download CSV templates for bulk uploading data. Make sure to follow the format guidelines for successful uploads.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Leads Template */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  <span>Leads Template</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p className="font-medium mb-2">Important Notes:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Date format: YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY</li>
                    <li>• Revenue should be a number (e.g., 12000)</li>
                    <li>• All fields are optional except name</li>
                    <li>• Use existing status, source, room grade values</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => downloadTemplate('leads')}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>

            {/* Students Template */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-green-600" />
                  <span>Students Template</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p className="font-medium mb-2">Important Notes:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Date format: YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY</li>
                    <li>• Revenue should be a number (e.g., 12000)</li>
                    <li>• All fields are optional except name</li>
                    <li>• Use existing room grade and duration values</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => downloadTemplate('students')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>

            {/* Studios Template */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="w-5 h-5 text-purple-600" />
                  <span>Studios Template</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-slate-600">
                  <p className="font-medium mb-2">Important Notes:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• ID and name are required fields</li>
                    <li>• Floor should be a number (1, 2, 3, etc.)</li>
                    <li>• View options: City View, Garden View, Courtyard View, Street View</li>
                    <li>• Room Grade must match existing room grades from Data Management</li>
                    <li>• Occupied and occupiedby are managed by the system automatically</li>
                    <li>• Common room grades: Deluxe, Premium, Standard, Luxury, Economy</li>
                  </ul>
                </div>
                <Button 
                  onClick={() => downloadTemplate('studios')}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Template
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Upload Guidelines */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Upload Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Date Format Requirements</h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Use YYYY-MM-DD format (e.g., 2024-09-01)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>DD/MM/YYYY format also supported (e.g., 01/09/2024)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Leave empty if date is unknown</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-3">Number Format Requirements</h4>
                  <div className="space-y-2 text-sm text-slate-600">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Revenue should be a number (e.g., 12000)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Don't include currency symbols</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Use dots for decimals (e.g., 12000.50)</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Bulk Uploads Tab */}
        <TabsContent value="bulk-uploads" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Bulk Uploads</h2>
            <p className="text-slate-600">Upload large amounts of data efficiently using CSV files. Make sure your data follows the required format.</p>
          </div>

          {/* Upload Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Total Uploads</p>
                    <p className="text-2xl font-bold text-blue-900">0</p>
                  </div>
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Success Rate</p>
                    <p className="text-2xl font-bold text-green-900">100%</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Last Upload</p>
                    <p className="text-lg font-bold text-orange-900">-</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Files Ready</p>
                    <p className="text-2xl font-bold text-purple-900">{csvPreview.length > 0 ? '1' : '0'}</p>
                  </div>
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Students Upload */}
            <Card className={`border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${
              csvType === "students" ? "ring-2 ring-green-500 bg-green-50/50" : "bg-white/80 backdrop-blur-md"
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-green-100">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">Students</CardTitle>
                      <p className="text-sm text-slate-500">Upload student data</p>
                    </div>
                  </div>
                  {csvType === "students" && (
                    <Badge className="bg-green-100 text-green-700">Ready</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                    csvType === "students" 
                      ? "border-green-300 bg-green-50" 
                      : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                  onClick={() => document.getElementById('students-upload')?.click()}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "students")}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${
                    csvType === "students" ? "text-green-600" : "text-slate-400"
                  }`} />
                  <p className="text-sm font-medium text-slate-700 mb-1">Drop CSV file here</p>
                  <p className="text-xs text-slate-500 mb-3">or click to browse</p>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCsvUpload("students")} 
                    className="hidden" 
                    id="students-upload"
                  />
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>

                {/* Preview Section */}
                {csvType === "students" && csvPreview.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">Preview ({csvPreview.length} rows)</h4>
                      <Badge variant="secondary">{csvPreview.length} items</Badge>
                    </div>
                    
                    {/* Data Validation */}
                    <div className="space-y-2">
                      {csvPreview.some(row => row.dateofinquiry === 'Invalid Date') && (
                        <div className="flex items-center space-x-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>Some dates have invalid format</span>
                        </div>
                      )}
                      {csvPreview.some(row => row.revenue === 'Invalid Number') && (
                        <div className="flex items-center space-x-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>Some revenue values are invalid</span>
                        </div>
                      )}
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      <table className="min-w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr>
                            {Object.keys(csvPreview[0]).slice(0, 4).map((col) => (
                              <th key={col} className="px-2 py-1 text-slate-700 font-medium">{col}</th>
                            ))}
                            {Object.keys(csvPreview[0]).length > 4 && (
                              <th className="px-2 py-1 text-slate-700 font-medium">...</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t">
                              {Object.values(row).slice(0, 4).map((val, j) => (
                                <td key={j} className="px-2 py-1 text-slate-600">
                                  {String(val).length > 15 ? String(val).substring(0, 15) + '...' : String(val)}
                                </td>
                              ))}
                              {Object.values(row).length > 4 && (
                                <td className="px-2 py-1 text-slate-400">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleBulkInsert} 
                        disabled={loading} 
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Students
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { setCsvPreview([]); setCsvType(""); }}
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {csvType !== "students" && (
                  <div className="text-center py-4 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No file selected</p>
                    <p className="text-xs">Upload a CSV file to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Leads Upload */}
            <Card className={`border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${
              csvType === "leads" ? "ring-2 ring-blue-500 bg-blue-50/50" : "bg-white/80 backdrop-blur-md"
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-100">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">Leads</CardTitle>
                      <p className="text-sm text-slate-500">Upload lead data</p>
                    </div>
                  </div>
                  {csvType === "leads" && (
                    <Badge className="bg-blue-100 text-blue-700">Ready</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                    csvType === "leads" 
                      ? "border-blue-300 bg-blue-50" 
                      : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                  onClick={() => document.getElementById('leads-upload')?.click()}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "leads")}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${
                    csvType === "leads" ? "text-blue-600" : "text-slate-400"
                  }`} />
                  <p className="text-sm font-medium text-slate-700 mb-1">Drop CSV file here</p>
                  <p className="text-xs text-slate-500 mb-3">or click to browse</p>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCsvUpload("leads")} 
                    className="hidden" 
                    id="leads-upload"
                  />
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>

                {/* Preview Section */}
                {csvType === "leads" && csvPreview.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">Preview ({csvPreview.length} rows)</h4>
                      <Badge variant="secondary">{csvPreview.length} items</Badge>
                    </div>
                    
                    {/* Data Validation */}
                    <div className="space-y-2">
                      {csvPreview.some(row => row.dateofinquiry === 'Invalid Date') && (
                        <div className="flex items-center space-x-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>Some dates have invalid format</span>
                        </div>
                      )}
                      {csvPreview.some(row => row.revenue === 'Invalid Number') && (
                        <div className="flex items-center space-x-2 p-2 bg-red-50 rounded text-red-700 text-xs">
                          <AlertCircle className="w-4 h-4" />
                          <span>Some revenue values are invalid</span>
                        </div>
                      )}
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      <table className="min-w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr>
                            {Object.keys(csvPreview[0]).slice(0, 4).map((col) => (
                              <th key={col} className="px-2 py-1 text-slate-700 font-medium">{col}</th>
                            ))}
                            {Object.keys(csvPreview[0]).length > 4 && (
                              <th className="px-2 py-1 text-slate-700 font-medium">...</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t">
                              {Object.values(row).slice(0, 4).map((val, j) => (
                                <td key={j} className="px-2 py-1 text-slate-600">
                                  {String(val).length > 15 ? String(val).substring(0, 15) + '...' : String(val)}
                                </td>
                              ))}
                              {Object.values(row).length > 4 && (
                                <td className="px-2 py-1 text-slate-400">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleBulkInsert} 
                        disabled={loading} 
                        className="flex-1 bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Leads
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { setCsvPreview([]); setCsvType(""); }}
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {csvType !== "leads" && (
                  <div className="text-center py-4 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No file selected</p>
                    <p className="text-xs">Upload a CSV file to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Studios Upload */}
            <Card className={`border-0 shadow-lg transition-all duration-300 hover:shadow-xl ${
              csvType === "studios" ? "ring-2 ring-purple-500 bg-purple-50/50" : "bg-white/80 backdrop-blur-md"
            }`}>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-purple-100">
                      <Building2 className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">Studios</CardTitle>
                      <p className="text-sm text-slate-500">Upload studio data</p>
                    </div>
                  </div>
                  {csvType === "studios" && (
                    <Badge className="bg-purple-100 text-purple-700">Ready</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* File Upload Area */}
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer ${
                    csvType === "studios" 
                      ? "border-purple-300 bg-purple-50" 
                      : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                  }`}
                  onClick={() => document.getElementById('studios-upload')?.click()}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, "studios")}
                >
                  <Upload className={`w-8 h-8 mx-auto mb-2 ${
                    csvType === "studios" ? "text-purple-600" : "text-slate-400"
                  }`} />
                  <p className="text-sm font-medium text-slate-700 mb-1">Drop CSV file here</p>
                  <p className="text-xs text-slate-500 mb-3">or click to browse</p>
                  <Input 
                    type="file" 
                    accept=".csv" 
                    onChange={handleCsvUpload("studios")} 
                    className="hidden" 
                    id="studios-upload"
                  />
                  <Button variant="outline" size="sm">
                    Choose File
                  </Button>
                </div>

                {/* Preview Section */}
                {csvType === "studios" && csvPreview.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-slate-900">Preview ({csvPreview.length} rows)</h4>
                      <Badge variant="secondary">{csvPreview.length} items</Badge>
                    </div>

                    {/* Preview Table */}
                    <div className="max-h-40 overflow-y-auto border rounded-lg">
                      <table className="min-w-full text-xs">
                        <thead className="sticky top-0 bg-slate-50">
                          <tr>
                            {Object.keys(csvPreview[0]).slice(0, 4).map((col) => (
                              <th key={col} className="px-2 py-1 text-slate-700 font-medium">{col}</th>
                            ))}
                            {Object.keys(csvPreview[0]).length > 4 && (
                              <th className="px-2 py-1 text-slate-700 font-medium">...</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {csvPreview.slice(0, 5).map((row, i) => (
                            <tr key={i} className="border-t">
                              {Object.values(row).slice(0, 4).map((val, j) => (
                                <td key={j} className="px-2 py-1 text-slate-600">
                                  {String(val).length > 15 ? String(val).substring(0, 15) + '...' : String(val)}
                                </td>
                              ))}
                              {Object.values(row).length > 4 && (
                                <td className="px-2 py-1 text-slate-400">...</td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={handleBulkInsert} 
                        disabled={loading} 
                        className="flex-1 bg-purple-600 hover:bg-purple-700"
                      >
                        {loading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Studios
                          </>
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => { setCsvPreview([]); setCsvType(""); }}
                        disabled={loading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {csvType !== "studios" && (
                  <div className="text-center py-4 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No file selected</p>
                    <p className="text-xs">Upload a CSV file to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Upload Guidelines */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <span>Upload Guidelines</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>File Requirements</span>
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• CSV format only</li>
                    <li>• UTF-8 encoding</li>
                    <li>• First row as headers</li>
                    <li>• Maximum 10,000 rows per file</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Data Format</span>
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Dates: YYYY-MM-DD format</li>
                    <li>• Numbers: No currency symbols</li>
                    <li>• Text: No special characters</li>
                    <li>• Empty cells are allowed</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900 flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Best Practices</span>
                  </h4>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li>• Test with small files first</li>
                    <li>• Check preview before upload</li>
                    <li>• Use templates for consistency</li>
                    <li>• Backup your data</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Data Management Tab */}
        <TabsContent value="data-management" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Data Management</h2>
            <p className="text-slate-600">Configure system settings and manage data categories for leads, students, and studios.</p>
          </div>

          {/* Statistics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600">Lead Status</p>
                    <p className="text-2xl font-bold text-blue-900">{leadStatus.length}</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-green-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600">Room Grades</p>
                    <p className="text-2xl font-bold text-green-900">{roomGrades.length}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600">Stay Durations</p>
                    <p className="text-2xl font-bold text-purple-900">{stayDurations.length}</p>
                  </div>
                  <Clock className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-orange-50 to-orange-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600">Lead Sources</p>
                    <p className="text-2xl font-bold text-orange-900">{leadSources.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-pink-50 to-pink-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-pink-600">Response Categories</p>
                    <p className="text-2xl font-bold text-pink-900">{responseCategories.length}</p>
                  </div>
                  <MessageSquare className="w-8 h-8 text-pink-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-md bg-gradient-to-br from-indigo-50 to-indigo-100">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-indigo-600">Follow Up Stages</p>
                    <p className="text-2xl font-bold text-indigo-900">{followUpStages.length}</p>
                  </div>
                  <RefreshCw className="w-8 h-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Error loading configuration data</span>
                </div>
                <p className="text-red-600 mt-1">{error}</p>
              </CardContent>
            </Card>
          )}

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <Card key={i} className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded animate-pulse w-24"></div>
                        <div className="h-3 bg-slate-200 rounded animate-pulse w-16"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="h-10 bg-slate-200 rounded animate-pulse"></div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((j) => (
                        <div key={j} className="h-8 bg-slate-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <ConfigManager
                title="Lead Status"
                items={leadStatus}
                onAdd={async (name) => { 
                  try {
                    await createLeadStatus(name);
                    await fetchConfigs();
                    toast({ title: 'Lead Status Added', description: 'New lead status created successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to create lead status.', variant: 'destructive' });
                  }
                }}
                onEdit={async (id, name) => { 
                  try {
                    await updateLeadStatus(id, name);
                    await fetchConfigs();
                    toast({ title: 'Lead Status Updated', description: 'Lead status updated successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to update lead status.', variant: 'destructive' });
                  }
                }}
                onDelete={async (id) => { 
                  try {
                    await deleteLeadStatus(id);
                    await fetchConfigs();
                    toast({ title: 'Lead Status Deleted', description: 'Lead status deleted successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to delete lead status.', variant: 'destructive' });
                  }
                }}
              />
              
              <RoomGradeManager
                items={roomGrades}
                onAdd={async (name, stock) => { 
                  try {
                    await createRoomGrade(name, stock);
                    await fetchConfigs();
                    toast({ title: 'Room Grade Added', description: 'New room grade created successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to create room grade.', variant: 'destructive' });
                  }
                }}
                onEdit={async (id, name, stock) => { 
                  try {
                    await updateRoomGrade(id, name, stock);
                    await fetchConfigs();
                    toast({ title: 'Room Grade Updated', description: 'Room grade updated successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to update room grade.', variant: 'destructive' });
                  }
                }}
                onDelete={async (id) => { 
                  try {
                    await deleteRoomGrade(id);
                    await fetchConfigs();
                    toast({ title: 'Room Grade Deleted', description: 'Room grade deleted successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to delete room grade.', variant: 'destructive' });
                  }
                }}
              />
              
              <ConfigManager
                title="Studio Views"
                items={studioViews}
                onAdd={async (name) => { 
                  try {
                    await createStudioView(name);
                    await fetchConfigs();
                    toast({ title: 'Studio View Added', description: 'New studio view created successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to create studio view.', variant: 'destructive' });
                  }
                }}
                onEdit={async (id, name) => { 
                  try {
                    await updateStudioView(id, name);
                    await fetchConfigs();
                    toast({ title: 'Studio View Updated', description: 'Studio view updated successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to update studio view.', variant: 'destructive' });
                  }
                }}
                onDelete={async (id) => { 
                  try {
                    await deleteStudioView(id);
                    await fetchConfigs();
                    toast({ title: 'Studio View Deleted', description: 'Studio view deleted successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to delete studio view.', variant: 'destructive' });
                  }
                }}
              />
              
              <ConfigManager
                title="Stay Durations"
                items={stayDurations}
                onAdd={async (name) => { 
                  try {
                    await createStayDuration(name);
                    await fetchConfigs();
                    toast({ title: 'Stay Duration Added', description: 'New stay duration created successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to create stay duration.', variant: 'destructive' });
                  }
                }}
                onEdit={async (id, name) => { 
                  try {
                    await updateStayDuration(id, name);
                    await fetchConfigs();
                    toast({ title: 'Stay Duration Updated', description: 'Stay duration updated successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to update stay duration.', variant: 'destructive' });
                  }
                }}
                onDelete={async (id) => { 
                  try {
                    await deleteStayDuration(id);
                    await fetchConfigs();
                    toast({ title: 'Stay Duration Deleted', description: 'Stay duration deleted successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to delete stay duration.', variant: 'destructive' });
                  }
                }}
              />
              
              <ConfigManager
                title="Lead Sources"
                items={leadSources}
                onAdd={async (name) => { 
                  try {
                    await createLeadSource(name);
                    await fetchConfigs();
                    toast({ title: 'Lead Source Added', description: 'New lead source created successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to create lead source.', variant: 'destructive' });
                  }
                }}
                onEdit={async (id, name) => { 
                  try {
                    await updateLeadSource(id, name);
                    await fetchConfigs();
                    toast({ title: 'Lead Source Updated', description: 'Lead source updated successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to update lead source.', variant: 'destructive' });
                  }
                }}
                onDelete={async (id) => { 
                  try {
                    await deleteLeadSource(id);
                    await fetchConfigs();
                    toast({ title: 'Lead Source Deleted', description: 'Lead source deleted successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to delete lead source.', variant: 'destructive' });
                  }
                }}
              />
              
              <ConfigManager
                title="Response Categories"
                items={responseCategories}
                onAdd={async (name) => { 
                  try {
                    await createResponseCategory(name);
                    await fetchConfigs();
                    toast({ title: 'Response Category Added', description: 'New response category created successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to create response category.', variant: 'destructive' });
                  }
                }}
                onEdit={async (id, name) => { 
                  try {
                    await updateResponseCategory(id, name);
                    await fetchConfigs();
                    toast({ title: 'Response Category Updated', description: 'Response category updated successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to update response category.', variant: 'destructive' });
                  }
                }}
                onDelete={async (id) => { 
                  try {
                    await deleteResponseCategory(id);
                    await fetchConfigs();
                    toast({ title: 'Response Category Deleted', description: 'Response category deleted successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to delete response category.', variant: 'destructive' });
                  }
                }}
              />
              
              <ConfigManager
                title="Follow Up Stages"
                items={followUpStages}
                onAdd={async (name) => { 
                  try {
                    await createFollowUpStage(name);
                    await fetchConfigs();
                    toast({ title: 'Follow Up Stage Added', description: 'New follow up stage created successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to create follow up stage.', variant: 'destructive' });
                  }
                }}
                onEdit={async (id, name) => { 
                  try {
                    await updateFollowUpStage(id, name);
                    await fetchConfigs();
                    toast({ title: 'Follow Up Stage Updated', description: 'Follow up stage updated successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to update follow up stage.', variant: 'destructive' });
                  }
                }}
                onDelete={async (id) => { 
                  try {
                    await deleteFollowUpStage(id);
                    await fetchConfigs();
                    toast({ title: 'Follow Up Stage Deleted', description: 'Follow up stage deleted successfully.' });
                  } catch (error) {
                    toast({ title: 'Error', description: 'Failed to delete follow up stage.', variant: 'destructive' });
                  }
                }}
              />
            </div>
          )}

          {/* Quick Actions Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <SettingsIcon className="w-5 h-5 text-blue-600" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2 bg-white/80 hover:bg-white transition-all duration-200"
                  onClick={() => setTab("templates")}
                >
                  <Users className="w-6 h-6 text-blue-600" />
                  <div className="text-center">
                    <div className="font-medium text-slate-900">Download Templates</div>
                    <div className="text-xs text-slate-500">Get CSV templates for bulk uploads</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2 bg-white/80 hover:bg-white transition-all duration-200"
                  onClick={() => setTab("bulk-uploads")}
                >
                  <Upload className="w-6 h-6 text-green-600" />
                  <div className="text-center">
                    <div className="font-medium text-slate-900">Bulk Upload</div>
                    <div className="text-xs text-slate-500">Upload data in bulk</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-auto p-4 flex flex-col items-center space-y-2 bg-white/80 hover:bg-white transition-all duration-200"
                  onClick={() => setTab("user-management")}
                >
                  <UserCheck className="w-6 h-6 text-purple-600" />
                  <div className="text-center">
                    <div className="font-medium text-slate-900">User Management</div>
                    <div className="text-xs text-slate-500">Manage system users</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* System Health & Export Card */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900 flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>System Health & Export</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* System Health */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">System Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/80 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">Database Connection</span>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Connected</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/80 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">Configuration Tables</span>
                      </div>
                      <span className="text-xs text-green-600 font-medium">Healthy</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-white/80 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-700">Total Config Items</span>
                      </div>
                      <span className="text-xs text-blue-600 font-medium">
                        {leadStatus.length + roomGrades.length + stayDurations.length + leadSources.length + responseCategories.length + followUpStages.length}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Export Options */}
                <div className="space-y-4">
                  <h4 className="font-medium text-slate-900">Export Configuration</h4>
                  <div className="space-y-3">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white/80 hover:bg-white"
                      onClick={() => {
                        const configData = {
                          leadStatus,
                          roomGrades,
                          stayDurations,
                          leadSources,
                          responseCategories,
                          followUpStages,
                          exportedAt: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(configData, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `system-config-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: 'Configuration Exported', description: 'System configuration exported successfully.' });
                      }}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export as JSON
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white/80 hover:bg-white"
                      onClick={() => {
                        const csvData = [
                          ['Category', 'ID', 'Name'],
                          ...leadStatus.map(item => ['Lead Status', item.id, item.name]),
                          ...roomGrades.map(item => ['Room Grade', item.id, item.name]),
                          ...stayDurations.map(item => ['Stay Duration', item.id, item.name]),
                          ...leadSources.map(item => ['Lead Source', item.id, item.name]),
                          ...responseCategories.map(item => ['Response Category', item.id, item.name])
                        ];
                        const csv = Papa.unparse(csvData);
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `system-config-${new Date().toISOString().split('T')[0]}.csv`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: 'Configuration Exported', description: 'System configuration exported as CSV.' });
                      }}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Export as CSV
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start bg-white/80 hover:bg-white"
                      onClick={() => {
                        const report = {
                          summary: {
                            totalItems: leadStatus.length + roomGrades.length + stayDurations.length + leadSources.length + responseCategories.length,
                            leadStatusCount: leadStatus.length,
                            roomGradesCount: roomGrades.length,
                            stayDurationsCount: stayDurations.length,
                            leadSourcesCount: leadSources.length,
                            responseCategoriesCount: responseCategories.length
                          },
                          details: {
                            leadStatus,
                            roomGrades,
                            stayDurations,
                            leadSources,
                            responseCategories
                          },
                          generatedAt: new Date().toISOString()
                        };
                        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `system-report-${new Date().toISOString().split('T')[0]}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                        toast({ title: 'System Report Generated', description: 'Detailed system report exported successfully.' });
                      }}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* User Management Tab */}
        <TabsContent value="user-management" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>User Management</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>Bulk Upload</Button>
                <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                  <DialogTrigger asChild>
                    <Button>Add User</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New User</DialogTitle>
                      <DialogDescription>
                        Create a new user account with the specified role and permissions.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label>Name</label>
                        <Input value={newUser.name} onChange={e => setNewUser(u => ({ ...u, name: e.target.value }))} placeholder="Full name" />
                      </div>
                      <div className="space-y-2">
                        <label>Email</label>
                        <Input value={newUser.email} onChange={e => setNewUser(u => ({ ...u, email: e.target.value }))} placeholder="Email address" />
                      </div>
                      <div className="space-y-2">
                        <label>Password</label>
                        <Input type="password" value={newUser.password} onChange={e => setNewUser(u => ({ ...u, password: e.target.value }))} placeholder="Password" />
                      </div>
                      <div className="space-y-2">
                        <label>Role</label>
                        <Select value={newUser.role} onValueChange={value => setNewUser(u => ({ ...u, role: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="salesperson">Salesperson</SelectItem>
                            <SelectItem value="accountant">Accountant</SelectItem>
                            <SelectItem value="cleaner">Cleaner</SelectItem>
                            <SelectItem value="student">Student</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {addUserError && <div className="text-red-600">{addUserError}</div>}
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => setIsAddUserOpen(false)} disabled={addUserLoading}>Cancel</Button>
                        <Button onClick={handleAddUser} disabled={addUserLoading || !newUser.email || !newUser.password || !newUser.name}>
                          {addUserLoading ? "Adding..." : "Add User"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {usersError && <div className="text-red-600 mb-4">{usersError}</div>}
              {usersLoading ? (
                <div className="text-slate-500">Loading users...</div>
              ) : (
                <>
                  {/* User Statistics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Users</p>
                          <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                        </div>
                        <UserCheck className="w-8 h-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Verified</p>
                          <p className="text-2xl font-bold text-green-900">{users.filter(u => u.email_verified).length}</p>
                        </div>
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Approved</p>
                          <p className="text-2xl font-bold text-orange-900">{users.filter(u => u.approved).length}</p>
                        </div>
                        <Shield className="w-8 h-8 text-orange-600" />
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-red-600">Admins</p>
                          <p className="text-2xl font-bold text-red-900">{users.filter(u => u.role === 'admin').length}</p>
                        </div>
                        <UserX className="w-8 h-8 text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 mb-4">
                    <Select value={userRoleFilter} onValueChange={setUserRoleFilter}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Filter by role" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="salesperson">Salesperson</SelectItem>
                        <SelectItem value="accountant">Accountant</SelectItem>
                        <SelectItem value="cleaner">Cleaner</SelectItem>
                        <SelectItem value="student">Student</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={userStatusFilter} onValueChange={setUserStatusFilter}>
                      <SelectTrigger className="w-48"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="verified">Email Verified</SelectItem>
                        <SelectItem value="unverified">Email Unverified</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending Approval</SelectItem>
                      </SelectContent>
                    </Select>
                    {selectedUserIds.length > 0 && (
                      <Button variant="outline" onClick={() => setIsBulkEditOpen(true)}>
                        Bulk Edit ({selectedUserIds.length})
                      </Button>
                    )}
                  </div>
                </>
              )}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        <input type="checkbox" checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0} onChange={e => handleSelectAllUsers(e.target.checked)} />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email Status</TableHead>
                      <TableHead>Approval Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center text-slate-400">No users found.</TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <input type="checkbox" checked={selectedUserIds.includes(user.id)} onChange={e => handleSelectUser(user.id, e.target.checked)} />
                          </TableCell>
                          <TableCell>{user.name || user.email}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.role === 'admin' ? 'bg-red-100 text-red-800' :
                              user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {user.role}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.email_verified ? "Verified" : "Unverified"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.approved ? "Approved" : "Pending"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline" onClick={() => handleViewUser(user)} title="View User Details">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleEditUser(user)} disabled={currentUser?.role !== 'admin'} title="Edit User">
                                <Edit className="w-4 h-4" />
                              </Button>
                              {!user.email_verified && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleVerifyUser(user)} 
                                  disabled={currentUser?.role !== 'admin' || verifyUserLoading}
                                  className="text-blue-600 hover:text-blue-700"
                                  title="Verify Email"
                                >
                                  {verifyUserLoading ? "..." : <Shield className="w-4 h-4" />}
                                </Button>
                              )}
                              {!user.approved && (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  onClick={() => handleApproveUser(user)} 
                                  disabled={currentUser?.role !== 'admin' || approveUserLoading}
                                  className="text-green-600 hover:text-green-700"
                                  title="Approve User"
                                >
                                  {approveUserLoading ? "..." : <UserCheck className="w-4 h-4" />}
                                </Button>
                              )}
                              <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(user)} disabled={currentUser?.role !== 'admin'} title="Delete User">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        {/* Bulk Upload Dialog */}
        <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
          <DialogContent>
            <DialogHeader>
                                <DialogTitle>Bulk Upload Users</DialogTitle>
                  <DialogDescription>
                    Upload multiple users at once using a CSV file. The file should include name, email, password, and role columns.
                  </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <input type="file" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" onChange={handleBulkFile} />
              {bulkUploadError && <div className="text-red-600">{bulkUploadError}</div>}
              {bulkUsers.length > 0 && (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Password</TableHead>
                        <TableHead>Role</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bulkUsers.map((user, i) => (
                        <TableRow key={i}>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{user.password ? "••••••" : <span className="text-red-500">Missing</span>}</TableCell>
                          <TableCell>{user.role || "salesperson"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              {bulkUploadLoading && (
                <div className="space-y-2">
                  <Progress value={bulkUploadProgress} />
                  <div className="text-xs text-slate-500">Uploading... {bulkUploadProgress}%</div>
                </div>
              )}
              {bulkUploadSuccess && <div className="text-green-600">{bulkUploadSuccess}</div>}
              {bulkUploadErrorDetails.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                  <div className="font-semibold text-red-700 mb-1">Failed Rows:</div>
                  <ul className="text-xs text-red-600 max-h-32 overflow-y-auto">
                    {bulkUploadErrorDetails.map((err, i) => (
                      <li key={i}>Row {err.row} ({err.email}): {err.reason}</li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setIsBulkUploadOpen(false); setBulkUsers([]); setBulkUploadErrorDetails([]); }} disabled={bulkUploadLoading}>Cancel</Button>
                <Button onClick={handleBulkUploadUsers} disabled={bulkUploadLoading || bulkUsers.length === 0}>
                  {bulkUploadLoading ? "Uploading..." : "Confirm Upload"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Bulk Edit Dialog */}
        <Dialog open={isBulkEditOpen} onOpenChange={setIsBulkEditOpen}>
          <DialogContent>
            <DialogHeader>
                              <DialogTitle>Bulk Edit Users ({selectedUserIds.length} selected)</DialogTitle>
                <DialogDescription>
                  Update multiple users at once. Leave fields blank to skip changes for that field.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label>Name</label>
                  <Input value={bulkEditFields.name} onChange={e => setBulkEditFields(f => ({ ...f, name: e.target.value }))} placeholder="New name (leave blank to skip)" />
                </div>
                <div className="space-y-2">
                  <label>Email</label>
                  <Input value={bulkEditFields.email} onChange={e => setBulkEditFields(f => ({ ...f, email: e.target.value }))} placeholder="New email (leave blank to skip)" />
                </div>
                <div className="space-y-2">
                  <label>Role</label>
                  <Select value={bulkEditFields.role} onValueChange={value => setBulkEditFields(f => ({ ...f, role: value }))}>
                    <SelectTrigger><SelectValue placeholder="New role (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">(No change)</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="salesperson">Salesperson</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label>Status</label>
                  <Select value={bulkEditFields.email_verified} onValueChange={value => setBulkEditFields(f => ({ ...f, email_verified: value }))}>
                    <SelectTrigger><SelectValue placeholder="New status (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">(No change)</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label>Approval Status</label>
                  <Select value={bulkEditFields.approved} onValueChange={value => setBulkEditFields(f => ({ ...f, approved: value }))}>
                    <SelectTrigger><SelectValue placeholder="New approval status (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-change">(No change)</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {bulkEditError && <div className="text-red-600">{bulkEditError}</div>}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsBulkEditOpen(false)} disabled={bulkEditLoading}>Cancel</Button>
                <Button onClick={handleBulkEdit} disabled={bulkEditLoading}>
                  {bulkEditLoading ? "Updating..." : `Update ${selectedUserIds.length} Users`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Edit User Dialog */}
        <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and role. Changes will be applied immediately.
              </DialogDescription>
            </DialogHeader>
            {editingUser && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label>Name</label>
                  <Input value={editingUser.name} onChange={e => setEditingUser(u => ({ ...u, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label>Email</label>
                  <Input value={editingUser.email} onChange={e => setEditingUser(u => ({ ...u, email: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <label>Role</label>
                  <Select value={editingUser.role} onValueChange={value => setEditingUser(u => ({ ...u, role: value }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="salesperson">Salesperson</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="cleaner">Cleaner</SelectItem>
                      <SelectItem value="student">Student</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editUserError && <div className="text-red-600">{editUserError}</div>}
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsEditUserOpen(false)} disabled={editUserLoading}>Cancel</Button>
                  <Button onClick={handleUpdateUser} disabled={editUserLoading}>
                    {editUserLoading ? "Updating..." : "Update User"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* View User Dialog */}
        <Dialog open={isViewUserOpen} onOpenChange={setIsViewUserOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                View detailed information about the selected user account.
              </DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Full Name</label>
                      <p className="text-slate-900 font-medium">{viewingUser.name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Email Address</label>
                      <p className="text-slate-900">{viewingUser.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">User ID</label>
                      <p className="text-slate-900 font-mono text-sm">{viewingUser.id}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-600">Role</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        viewingUser.role === 'admin' ? 'bg-red-100 text-red-800' :
                        viewingUser.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {viewingUser.role}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Email Verification</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        viewingUser.email_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {viewingUser.email_verified ? "Verified" : "Unverified"}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-600">Approval Status</label>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                        viewingUser.approved ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {viewingUser.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-slate-900 mb-3">Timestamps</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <label className="text-slate-600">Created</label>
                      <p className="text-slate-900">{viewingUser.created_at ? new Date(viewingUser.created_at).toLocaleString() : 'Unknown'}</p>
                    </div>
                    <div>
                      <label className="text-slate-600">Last Updated</label>
                      <p className="text-slate-900">{viewingUser.updated_at ? new Date(viewingUser.updated_at).toLocaleString() : 'Unknown'}</p>
                    </div>
                    {viewingUser.email_verified && (
                      <div>
                        <label className="text-slate-600">Email Verified</label>
                        <p className="text-slate-900">{viewingUser.verified_at ? new Date(viewingUser.verified_at).toLocaleString() : 'Unknown'}</p>
                      </div>
                    )}
                    {viewingUser.approved && (
                      <div>
                        <label className="text-slate-600">Approved</label>
                        <p className="text-slate-900">{viewingUser.approved_at ? new Date(viewingUser.approved_at).toLocaleString() : 'Unknown'}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsViewUserOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => { setIsViewUserOpen(false); handleEditUser(viewingUser); }}>
                    Edit User
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Document Management Tab */}
        <TabsContent value="document-management" className="space-y-6">
          <DocumentManagement />
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Payment Configuration</h2>
            <p className="text-slate-600">Configure Stripe payment settings for student payments and invoicing.</p>
          </div>

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span>Stripe Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Live/Test Mode Toggle */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {stripeConfig.isLiveMode ? (
                    <ToggleRight className="w-5 h-5 text-green-600" />
                  ) : (
                    <ToggleLeft className="w-5 h-5 text-orange-600" />
                  )}
                  <div>
                    <Label className="text-base font-medium">
                      {stripeConfig.isLiveMode ? 'Live Mode' : 'Test Mode'}
                    </Label>
                    <p className="text-sm text-slate-600">
                      {stripeConfig.isLiveMode 
                        ? 'Real payments will be processed' 
                        : 'Test payments only - no real charges'
                      }
                    </p>
                  </div>
                </div>
                <Switch
                  checked={stripeConfig.isLiveMode}
                  onCheckedChange={(checked) => 
                    setStripeConfig(prev => ({ ...prev, isLiveMode: checked }))
                  }
                />
              </div>

              {/* API Keys Section */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="publishable-key" className="flex items-center space-x-2">
                    <Key className="w-4 h-4" />
                    <span>Publishable Key</span>
                    <Badge variant={stripeConfig.isLiveMode ? "default" : "secondary"}>
                      {stripeConfig.isLiveMode ? 'Live' : 'Test'}
                    </Badge>
                  </Label>
                  <Input
                    id="publishable-key"
                    type="text"
                    value={stripeConfig.publishableKey}
                    onChange={(e) => setStripeConfig(prev => ({ 
                      ...prev, 
                      publishableKey: e.target.value 
                    }))}
                    placeholder={stripeConfig.isLiveMode ? 'pk_live_...' : 'pk_test_...'}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secret-key" className="flex items-center space-x-2">
                    <Key className="w-4 h-4" />
                    <span>Secret Key</span>
                    <Badge variant={stripeConfig.isLiveMode ? "default" : "secondary"}>
                      {stripeConfig.isLiveMode ? 'Live' : 'Test'}
                    </Badge>
                  </Label>
                  <Input
                    id="secret-key"
                    type="password"
                    value={stripeConfig.secretKey}
                    onChange={(e) => setStripeConfig(prev => ({ 
                      ...prev, 
                      secretKey: e.target.value 
                    }))}
                    placeholder={stripeConfig.isLiveMode ? 'sk_live_...' : 'sk_test_...'}
                    className="font-mono text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-secret" className="flex items-center space-x-2">
                    <Key className="w-4 h-4" />
                    <span>Webhook Secret (Optional)</span>
                  </Label>
                  <Input
                    id="webhook-secret"
                    type="password"
                    value={stripeConfig.webhookSecret || ''}
                    onChange={(e) => setStripeConfig(prev => ({ 
                      ...prev, 
                      webhookSecret: e.target.value 
                    }))}
                    placeholder="whsec_..."
                    className="font-mono text-sm"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  onClick={async () => {
                    setStripeConfigSaving(true);
                    try {
                      // Save to database or local storage
                      localStorage.setItem('stripe_config', JSON.stringify(stripeConfig));
                      toast({
                        title: "Stripe Configuration Saved",
                        description: "Payment settings have been updated successfully.",
                      });
                    } catch (error) {
                      toast({
                        title: "Error Saving Configuration",
                        description: "Failed to save Stripe settings. Please try again.",
                        variant: "destructive",
                      });
                    } finally {
                      setStripeConfigSaving(false);
                    }
                  }}
                  disabled={stripeConfigSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {stripeConfigSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>

              {/* Test Connection */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Test Your Configuration</h4>
                <p className="text-sm text-blue-700 mb-3">
                  Make sure your Stripe keys are working correctly by testing the connection.
                </p>
                <Button variant="outline" size="sm" className="text-blue-600 border-blue-300">
                  Test Connection
                </Button>
              </div>

              {/* Payment Settings */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-medium text-slate-900">Payment Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Default Currency</Label>
                    <Select value="GBP">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Terms</Label>
                    <Select value="30">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 days</SelectItem>
                        <SelectItem value="14">14 days</SelectItem>
                        <SelectItem value="30">30 days</SelectItem>
                        <SelectItem value="60">60 days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab (placeholder) */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Notification settings and history will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
