import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, TrendingUp, UserCheck, DollarSign, Bell, LogOut, Filter, Phone, Mail, ChevronDown, ChevronRight, Eye, Edit, Trash2, ArrowLeft } from "lucide-react";
import LeadManagement from "@/components/LeadManagement";
import StudentManagement from "@/components/StudentManagement";
import TouristManagement from "@/components/TouristManagement";
import Analytics from "@/components/Analytics";

import StudioManagement from "@/components/StudioManagement";
import LeadDetailsModal from "@/components/LeadDetailsModal";


import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getLeads, getStudents, getTourists, getStudios, createLead, updateLead, deleteLead, createStudent, updateStudent, deleteStudent, createTourist, updateTourist, deleteTourist, bulkDeleteTourists, createStudio, updateStudio, deleteStudio, getRoomGrades, getStayDurations, getLeadSources, getUsers, getLeadStatus, getFollowUpStages, getResponseCategories, getStudioViews, debugStudentsSchema, debugStudiosSchema, createStudentUserAccount, createStudentWithUserAccount, createStudentInvoice, createTouristInvoice } from "@/lib/supabaseCrud";
import { useRoutePersistence } from "@/hooks/useStatePersistence";
import { addDays, startOfDay, startOfWeek, startOfMonth, startOfYear, isAfter, isBefore, isEqual } from 'date-fns';
import { logWarn, logError, logInfo } from '@/lib/logger';
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import LoadingSpinner from "@/components/LoadingSpinner";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [selectedLead, setSelectedLead] = useState(null);
  const [isLeadDetailsOpen, setIsLeadDetailsOpen] = useState(false);

  const { user } = useAuth();
  const { saveRouteState, loadRouteState } = useRoutePersistence();
  
  // Get current tab from URL or default to dashboard
  const getCurrentTab = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('tab') || 'dashboard';
  };
  
  const [currentTab, setCurrentTab] = useState(getCurrentTab());
  
  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('tab', value);
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };
  
  // Update tab when URL changes
  useEffect(() => {
    setCurrentTab(getCurrentTab());
  }, [location.search]);

  // State persistence for route and tab
  useEffect(() => {
    // Save current route state
    saveRouteState(location.pathname + location.search, currentTab);
  }, [location.pathname, location.search, currentTab, saveRouteState]);

  // Restore state on component mount
  useEffect(() => {
    const savedState = loadRouteState();
    if (savedState?.currentTab && savedState.currentTab !== currentTab) {
      console.log('🔄 Restoring tab state:', savedState.currentTab);
      handleTabChange(savedState.currentTab);
    }
  }, [loadRouteState, currentTab]);

  // Listen for state restoration events
  useEffect(() => {
    const handleStateRestored = (event: CustomEvent) => {
      if (event.detail?.currentTab && event.detail.currentTab !== currentTab) {
        console.log('🎯 State restored, updating tab:', event.detail.currentTab);
        handleTabChange(event.detail.currentTab);
      }
    };

    window.addEventListener('stateRestored', handleStateRestored as EventListener);
    return () => {
      window.removeEventListener('stateRestored', handleStateRestored as EventListener);
    };
  }, [currentTab]);

  // Remove hardcoded user data - use actual authenticated user

  const [statusFilter, setStatusFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [responseFilter, setResponseFilter] = useState("all");
  const [followUpFilter, setFollowUpFilter] = useState("all");
  const [assignedToFilter, setAssignedToFilter] = useState("all");

  const [leadStatus, setLeadStatus] = useState([]);
  const [followUpStages, setFollowUpStages] = useState([]);

  const [leads, setLeads] = useState([]);
  const [students, setStudents] = useState([]);
  const [tourists, setTourists] = useState([]);
  const [studios, setStudios] = useState([]);

  const [responseCategories, setResponseCategories] = useState([]);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [roomGrades, setRoomGrades] = useState([]);
  const [stayDurations, setStayDurations] = useState([]);
  const [leadSources, setLeadSources] = useState([]);
  const [studioViews, setStudioViews] = useState([]);

  const [users, setUsers] = useState([]);
  const [salespeople, setSalespeople] = useState([]);
  const statusOptions = ["New", "Hot", "Cold", "Converted", "Dead"];

  // Add loading states for better UX
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Improved data fetching with parallel loading and better error handling
  const fetchAll = async (isRetry = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    }
    
    setLoading(true);
    setError(null);
    
    // Reduced timeout to 10 seconds
    const timeoutId = setTimeout(() => {
      setLoading(false);
      setError('Loading timeout reached. Please check your connection and try again.');
    }, 10000);
    
    try {
      // PARALLEL fetching instead of sequential - Major Performance Improvement
      const fetchPromises = [
        // Core data - fetch in parallel
        Promise.race([
          getLeads(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Leads timeout')), 8000))
        ]).catch(err => {
          logWarn('Failed to fetch leads:', err.message);
          return [];
        }),
        
        Promise.race([
          getStudents(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Students timeout')), 8000))
        ]).catch(err => {
          logWarn('Failed to fetch students:', err.message);
          return [];
        }),
        
        Promise.race([
          getTourists(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Tourists timeout')), 8000))
        ]).catch(err => {
          logWarn('Failed to fetch tourists:', err.message);
          return [];
        }),
        
        Promise.race([
          getStudios(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Studios timeout')), 8000))
        ]).catch(err => {
          logWarn('Failed to fetch studios:', err.message);
          return [];
        })
      ];

      // Configuration data - can be fetched in parallel with core data
      const configPromises = [
        getRoomGrades().catch(() => []),
        getStayDurations().catch(() => []),
        getLeadSources().catch(() => []),
        getLeadStatus().catch(() => []),
        getFollowUpStages().catch(() => []),
        getResponseCategories().catch(() => []),
        getStudioViews().catch(() => [])
      ];

      // Users data - can be slower
      const usersPromise = Promise.race([
        getUsers(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Users timeout')), 8000))
      ]).catch(err => {
        logWarn('Failed to fetch users:', err.message);
        return [];
      });

      // Execute all core data fetches in parallel
      const [leadsData, studentsData, touristsData, studiosData] = await Promise.all(fetchPromises);
      
      // Set core data immediately
      setLeads(leadsData || []);
      setStudents(studentsData || []);
      setTourists(touristsData || []);
      setStudios(studiosData || []);

      // Execute configuration fetches in parallel
      const configResults = await Promise.allSettled(configPromises);
      
      // Extract configuration data
      const [
        roomGradesResult,
        stayDurationsResult,
        leadSourcesResult,
        leadStatusResult,
        followUpStagesResult,
        responseCategoriesResult,
        studioViewsResult
      ] = configResults;

      // Set configuration data
      setRoomGrades(roomGradesResult.status === 'fulfilled' ? roomGradesResult.value || [] : []);
      setStayDurations(stayDurationsResult.status === 'fulfilled' ? stayDurationsResult.value || [] : []);
      setLeadSources(leadSourcesResult.status === 'fulfilled' ? leadSourcesResult.value || [] : []);
      setLeadStatus(leadStatusResult.status === 'fulfilled' ? leadStatusResult.value || [] : []);
      setFollowUpStages(followUpStagesResult.status === 'fulfilled' ? followUpStagesResult.value || [] : []);
      setResponseCategories(responseCategoriesResult.status === 'fulfilled' ? responseCategoriesResult.value || [] : []);
      setStudioViews(studioViewsResult.status === 'fulfilled' ? studioViewsResult.value || [] : []);

      // Fetch users data
      const usersResult = await usersPromise;
      setUsers(usersResult || []);
      setSalespeople((usersResult || []).filter(u => u.role === "salesperson"));

      setLoading(false);
      setIsInitialLoad(false);
      setRetryCount(0);
      
    } catch (error) {
      logError('Critical error during data fetch:', error);
      setError(`Failed to load system data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setLoading(false);
    } finally {
      clearTimeout(timeoutId);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleConvertLead = async (conversionData: any) => {
    try {
      logInfo('Lead conversion data received:', conversionData);
      
      // Check if this is a short-term stay (tourist) or long-term stay (student)
      const isShortTerm = conversionData.duration && (
        conversionData.duration.includes('days') || 
        conversionData.duration.includes('day') ||
        conversionData.duration.includes('short') ||
        conversionData.duration === 'short-term'
      );
      
      logInfo('Duration:', conversionData.duration);
      logInfo('Is short term:', isShortTerm);

      if (isShortTerm) {
        // Convert to tourist
        const touristData = {
          name: conversionData.name,
          phone: conversionData.phone,
          email: conversionData.email,
          room: conversionData.room,
          checkin: conversionData.checkin,
          checkout: conversionData.checkout || conversionData.checkin, // Use checkin as checkout if not provided
          duration: conversionData.duration,
          revenue: conversionData.revenue,
          assignedto: conversionData.assignedto
        };

        logInfo('Creating tourist with data:', touristData);
        const createdTourist = await createTourist(touristData);
        logInfo('Created tourist:', createdTourist);
        
        if (createdTourist) {
          logInfo('Tourist created successfully, updating state...');
          setTourists(prev => {
            const newTourists = [...prev, createdTourist];
            logInfo('Updated tourists state:', newTourists);
            return newTourists;
          });
          
          // Auto-create invoice for the new tourist
          try {
            await createTouristInvoice(createdTourist);
            logInfo('Invoice created automatically for new tourist');
          } catch (invoiceError) {
            logWarn('Failed to create automatic invoice for tourist:', invoiceError);
            // Don't fail the tourist creation if invoice fails
          }
          
          // Refresh studios data to show updated occupancy (handled by database triggers)
          logInfo('Refreshing studios data...');
          const updatedStudios = await getStudios();
          setStudios(updatedStudios);
          logInfo('Tourist conversion completed successfully');
        } else {
          logError('Failed to create tourist - no data returned');
          // Fallback: refresh tourists data
          const refreshedTourists = await getTourists();
          setTourists(refreshedTourists || []);
        }
      } else {
        // Convert to student
        const studentData = {
          name: conversionData.name,
          phone: conversionData.phone,
          email: conversionData.email,
          room: conversionData.room,
          assignedto: conversionData.assignedto,
          checkin: conversionData.checkin,
          duration: conversionData.duration,
          revenue: conversionData.revenue,
          duration_weeks: conversionData.duration_weeks,
          payment_cycles: conversionData.payment_cycles,
          payment_plan_id: conversionData.payment_plan_id,
          // Add lead-specific data for perfect mapping
          source: conversionData.source || '',
          notes: conversionData.notes || '',
          dateofinquiry: conversionData.dateofinquiry || ''
        };

        // Create student with user account link
        const result = await createStudentWithUserAccount(studentData);
        
        if (result?.success) {
          setStudents(prev => [...prev, result.student]);
          logInfo('Student with user account created successfully');
          
          // Auto-create invoice for the new student
          try {
            await createStudentInvoice(result.student);
            logInfo('Invoice created automatically for new student');
          } catch (invoiceError) {
            logError('Failed to create invoice for student:', invoiceError);
            // Don't fail the whole process if invoice creation fails
          }
        } else {
          logWarn('Failed to create student with user account');
          return; // Exit early if student creation failed
        }
      
        // Handle studio assignment if provided
        if (studentData.assignedto && result?.success) {
          await updateStudio(studentData.assignedto, { 
            occupied: true, 
            occupiedby: result.student.id 
          });
            
          // Refresh studios data to show updated occupancy
          const updatedStudios = await getStudios();
          setStudios(updatedStudios);
        }
      }
      
      // Delete the lead after successful conversion (works for both students and tourists)
      if (conversionData.leadId) {
        logInfo('Deleting lead with ID:', conversionData.leadId);
        try {
          await deleteLead(conversionData.leadId);
          setLeads(prev => prev.filter(l => l.id !== conversionData.leadId));
          logInfo('Lead deleted successfully');
        } catch (deleteError) {
          logError('Failed to delete lead:', deleteError);
        }
      } else {
        logWarn('No leadId provided for deletion');
      }
    } catch (error) {
      logError('Error converting lead:', error);
      // Show more detailed error information
      if (error instanceof Error) {
        logError('Error details:', error.message);
      }
    }
  };

  const handleUpdateLead = async (updatedLead: any) => {
    setOperationLoading(`updating-lead-${updatedLead.id}`);
    try {
    await updateLead(updatedLead.id, updatedLead);
      // Optimistically update local state instead of full refetch
      setLeads(prev => prev.map(lead => 
        lead.id === updatedLead.id ? { ...lead, ...updatedLead } : lead
      ));
    } catch (error) {
      logError('Error updating lead:', error);
      // Fallback to full refetch if optimistic update fails
    setLeads(await getLeads());
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDeleteLead = async (leadId: number) => {
    setOperationLoading(`deleting-lead-${leadId}`);
    try {
    await deleteLead(leadId);
      // Optimistically update local state instead of full refetch
      setLeads(prev => prev.filter(lead => lead.id !== leadId));
    } catch (error) {
      logError('Error deleting lead:', error);
      // Fallback to full refetch if optimistic update fails
    setLeads(await getLeads());
    } finally {
      setOperationLoading(null);
    }
  };

  const handleUpdateStudent = async (updatedStudent: any) => {
    try {
      // Get the original student to compare studio assignment
      const originalStudent = students.find((s: any) => s.id === updatedStudent.id);
      
      await updateStudent(updatedStudent.id, updatedStudent);
      
      // Optimistically update students state
      setStudents(prev => prev.map(student => 
        student.id === updatedStudent.id ? { ...student, ...updatedStudent } : student
      ));
      
      // Handle studio assignment changes
      if (originalStudent) {
        if (originalStudent.assignedto !== updatedStudent.assignedto) {
          // Clear previous studio assignment
          if (originalStudent.assignedto) {
            try {
              await updateStudio(originalStudent.assignedto, { 
                occupied: false, 
                occupiedby: null 
              });
              // Optimistically update studios state
              setStudios(prev => prev.map(studio => 
                studio.id === originalStudent.assignedto 
                  ? { ...studio, occupied: false, occupiedby: null }
                  : studio
              ));
            } catch (studioError) {
              logWarn('Failed to clear previous studio assignment:', studioError);
            }
          }
          
          // Set new studio assignment
          if (updatedStudent.assignedto) {
            try {
              await updateStudio(updatedStudent.assignedto, { 
                occupied: true, 
                occupiedby: updatedStudent.id 
              });
              // Optimistically update studios state
              setStudios(prev => prev.map(studio => 
                studio.id === updatedStudent.assignedto 
                  ? { ...studio, occupied: true, occupiedby: updatedStudent.id }
                  : studio
              ));
            } catch (studioError) {
              logWarn('Failed to set new studio assignment:', studioError);
            }
          }
        }
      }
    } catch (error) {
      logError('Error updating student:', error);
      // Fallback to full refetch if optimistic update fails
      const [updatedStudents, updatedStudios] = await Promise.all([
        getStudents(),
        getStudios()
      ]);
      setStudents(updatedStudents);
      setStudios(updatedStudios);
    }
  };

  const handleDeleteStudent = async (studentId: number) => {
    try {
      const student = students.find((s: any) => s.id === studentId);
      
      // Clear studio assignment if student was assigned to a studio
      if (student?.assignedto) {
        try {
          await updateStudio(student.assignedto, { occupied: false, occupiedby: null });
          // Optimistically update studios state
          setStudios(prev => prev.map(studio => 
            studio.id === student.assignedto 
              ? { ...studio, occupied: false, occupiedby: null }
              : studio
          ));
        } catch (studioError) {
          logWarn('Failed to update studio occupancy:', studioError);
        }
      }
      
      // Delete the student
      await deleteStudent(studentId);
      
      // Optimistically update students state
      setStudents(prev => prev.filter(student => student.id !== studentId));
    } catch (error) {
      logError('Error deleting student:', error);
      // Fallback to full refetch if optimistic update fails
      const [updatedStudents, updatedStudios] = await Promise.all([
        getStudents(),
        getStudios()
      ]);
      setStudents(updatedStudents);
      setStudios(updatedStudios);
    }
  };

  const handleUpdateStudio = async (updatedStudio: any) => {
    try {
    await updateStudio(updatedStudio.id, updatedStudio);
      // Optimistically update local state instead of full refetch
      setStudios(prev => prev.map(studio => 
        studio.id === updatedStudio.id ? { ...studio, ...updatedStudio } : studio
      ));
    } catch (error) {
      logError('Error updating studio:', error);
      // Fallback to full refetch if optimistic update fails
    const updatedStudios = await getStudios();
    setStudios(updatedStudios);
    }
  };

  const handleDeleteStudio = async (studioId: string) => {
    try {
    await deleteStudio(studioId);
      // Optimistically update local state instead of full refetch
      setStudios(prev => prev.filter(studio => studio.id !== studioId));
    } catch (error) {
      logError('Error deleting studio:', error);
      // Fallback to full refetch if optimistic update fails
    const updatedStudios = await getStudios();
    setStudios(updatedStudios);
    }
  };

  const handleAddStudio = async (studioData: any) => {
    try {
      const createdStudio = await createStudio(studioData);
      // Optimistically update local state instead of full refetch
      setStudios(prev => [...prev, createdStudio]);
    } catch (error) {
      logError('Error adding studio:', error);
      // Fallback to full refetch if optimistic update fails
    const updatedStudios = await getStudios();
    setStudios(updatedStudios);
    }
  };

  const toggleRowExpansion = (leadId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(leadId)) {
      newExpanded.delete(leadId);
    } else {
      newExpanded.add(leadId);
    }
    setExpandedRows(newExpanded);
  };

  const handleViewLead = (lead: any) => {
    setSelectedLead(lead);
    setIsLeadDetailsOpen(true);
  };



  const handleEditLead = (lead: any) => {
    // Implement lead editing logic here
  };

  const filteredLeadsForStats = leads.filter(l => {
    if (!l.dateofinquiry) return false;
    const leadDate = new Date(l.dateofinquiry);
    if (dateRange?.from && dateRange?.to) {
      return (isAfter(leadDate, dateRange.from) || isEqual(leadDate, dateRange.from)) &&
             (isBefore(leadDate, dateRange.to) || isEqual(leadDate, dateRange.to));
    }
    return true;
  });

  const stats = {
    totalLeads: filteredLeadsForStats.length + students.length, // Include both leads and students
    newLeads: filteredLeadsForStats.filter(l => l.status === "New").length,
    hotLeads: filteredLeadsForStats.filter(l => l.status === "Hot").length,
    coldLeads: filteredLeadsForStats.filter(l => l.status === "Cold").length,
    converted: students.length, // Count students instead of converted leads
    deadLeads: filteredLeadsForStats.filter(l => l.status === "Dead").length,
  };

  // Calculate dynamic room grade availability based on actual studios
  const roomGradeStats = roomGrades.map(grade => {
    const studiosOfGrade = studios.filter(s => s.roomGrade === grade.name);
    const totalStudios = studiosOfGrade.length;
    const occupiedStudios = studiosOfGrade.filter(s => s.occupied).length;
    const vacantStudios = totalStudios - occupiedStudios;
    
    return {
      ...grade,
      total: totalStudios,
      occupied: occupiedStudios,
      vacant: vacantStudios,
      // Keep the original stock for reference, but use dynamic total
      originalStock: grade.stock || 0
    };
  });

  const studioStats = {
    total: studios?.length || 0,
    occupied: studios?.filter(s => s.occupied).length || 0,
    vacant: studios?.filter(s => !s.occupied).length || 0,
    roomGradeStats // Add the dynamic room grade stats
  };

  // Filter leads for dashboard
  const filteredLeads = leads.filter(lead => {
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesResponse = responseFilter === "all" || lead.responsecategory === responseFilter;
    const matchesFollowUp = followUpFilter === "all" || lead.followupstage === followUpFilter;
    const matchesAssignedTo = assignedToFilter === "all" || lead.assignedto === assignedToFilter;
    
    return matchesStatus && matchesSource && matchesResponse && matchesFollowUp && matchesAssignedTo;
  }).slice(0, 8);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hot": return "bg-orange-100 text-orange-800";
      case "Converted": return "bg-green-100 text-green-800";
      case "Cold": return "bg-blue-100 text-blue-800";
      case "Dead": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatStatValue = (value: number) => {
    if (value === 0) return "0";
    if (value >= 1 && value <= 999) {
      return value.toString().padStart(3, '0');
    }
    return value.toString();
  };

  const handleAddStudent = async (newStudent: any) => {
    try {
      // The student has already been created in the StudentManagement component
      // Just refresh the data to show the new student
      
      // Update studio occupancy if studio is assigned
      if (newStudent.assignedto) {
        try {
          await updateStudio(newStudent.assignedto, { 
            occupied: true, 
            occupiedby: newStudent.id 
          });
          // Refresh studios data to show updated occupancy
          const updatedStudios = await getStudios();
          setStudios(updatedStudios);
        } catch (studioError) {
          logWarn('Failed to update studio occupancy:', studioError);
        }
      }
      
      // Refresh students data
      const updatedStudents = await getStudents();
      setStudents(updatedStudents);
    } catch (error) {
      logError('Error adding student:', error);
    }
  };

  const handleAddTourist = async (newTourist: any) => {
    try {
      const createdTourist = await createTourist(newTourist);
      
      // Update studio occupancy if studio is assigned
      if (newTourist.assignedto) {
        try {
          await updateStudio(newTourist.assignedto, { 
            occupied: true, 
            occupiedby: createdTourist.id 
          });
          // Refresh studios data to show updated occupancy
          const updatedStudios = await getStudios();
          setStudios(updatedStudios);
        } catch (studioError) {
          logWarn('Failed to update studio occupancy:', studioError);
        }
      }
      
      // Refresh tourists data
      const updatedTourists = await getTourists();
      setTourists(updatedTourists);
    } catch (error) {
      logError('Error adding tourist:', error);
    }
  };

  const handleUpdateTourist = async (updatedTourist: any) => {
    try {
      // Get the original tourist to compare studio assignment
      const originalTourist = tourists.find(t => t.id === updatedTourist.id);
      
      const updated = await updateTourist(updatedTourist.id, updatedTourist);
      
      // Handle studio assignment changes
      if (originalTourist) {
        // If studio assignment changed, update studio occupancy
        if (originalTourist.assignedto !== updatedTourist.assignedto) {
          // Clear previous studio assignment
          if (originalTourist.assignedto) {
            await updateStudio(originalTourist.assignedto, { 
              occupied: false, 
              occupiedby: null 
            });
          }
          
          // Set new studio assignment
          if (updatedTourist.assignedto) {
            await updateStudio(updatedTourist.assignedto, { 
              occupied: true, 
              occupiedby: updatedTourist.id 
            });
          }
        }
      }
      
      // Refresh tourists data
      const updatedTourists = await getTourists();
      setTourists(updatedTourists);
      
      // Refresh studios data to show updated occupancy
      const updatedStudios = await getStudios();
      setStudios(updatedStudios);
    } catch (error) {
      logError('Error updating tourist:', error);
    }
  };

  const handleDeleteTourist = async (touristId: number) => {
    try {
      // Get the tourist to check if they have a studio assignment
      const tourist = tourists.find(t => t.id === touristId);
      
      // Clear studio assignment if tourist was assigned to a studio
      if (tourist?.assignedto) {
        try {
          await updateStudio(tourist.assignedto, { 
            occupied: false, 
            occupiedby: null 
          });
        } catch (studioError) {
          logWarn('Failed to update studio occupancy:', studioError);
        }
      }
      
      // Delete the tourist
      await deleteTourist(touristId);
      
      // Refresh tourists data
      const updatedTourists = await getTourists();
      setTourists(updatedTourists);
      
      // Refresh studios data to show updated occupancy
      const updatedStudios = await getStudios();
      setStudios(updatedStudios);
    } catch (error) {
      logError('Error deleting tourist:', error);
    }
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 font-inter-tight">
      {/* Main Content */}
      <main className="p-6">
        {/* Loading State */}
        {loading && <LoadingSpinner fullScreen text="Loading dashboard..." />}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-red-600 font-medium mb-2">Failed to load data</p>
              <p className="text-slate-600 mb-4">{error}</p>
              <div className="space-x-2">
              <Button onClick={() => window.location.reload()} variant="outline">
                  Refresh Page
                </Button>
                <Button onClick={() => fetchAll(true)} variant="default">
                  Retry
              </Button>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Reservations</h1>
                <p className="text-slate-600 mt-2">Manage leads, students, and studio bookings.</p>
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
            
            <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-md border border-slate-200/60 p-1 shadow-sm">
            <TabsTrigger value="dashboard" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Dashboard</TabsTrigger>
            <TabsTrigger value="leads" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Leads</TabsTrigger>
            <TabsTrigger value="students" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Students</TabsTrigger>
            <TabsTrigger value="tourists" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Tourists</TabsTrigger>
            <TabsTrigger value="studios" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Studios</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6 animate-fade-in">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Dashboard Overview</h2>
              <p className="text-slate-600">Welcome back! Here's what's happening with your leads today.</p>
            </div>

            {/* Date Range Picker (styled like leads tab) */}
            <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-64 justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      "Pick date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>




            {/* Stats Cards - New Design */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-xl w-full justify-start"
                onClick={() => navigate("/leads/new")}
              >
                <Card className="border-0 bg-transparent shadow-none w-full">
                  <CardContent className="p-2">
                    <div className="flex items-center space-x-3">
                      <div className="min-w-[4rem] h-16 bg-black rounded-xl flex items-center justify-center px-3">
                        <span className="text-white font-bold text-3xl">{formatStatValue(stats.newLeads)}</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <div className="text-sm text-gray-500">Total Number of</div>
                        <div className="text-base font-semibold text-black">New Leads</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-xl w-full justify-start"
                onClick={() => navigate("/leads/cold")}
              >
                <Card className="border-0 bg-transparent shadow-none w-full">
                  <CardContent className="p-2">
                    <div className="flex items-center space-x-3">
                      <div className="min-w-[4rem] h-16 bg-blue-400 rounded-xl flex items-center justify-center px-3">
                        <span className="text-white font-bold text-3xl">{formatStatValue(stats.coldLeads)}</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <div className="text-sm text-gray-500">Total Number of</div>
                        <div className="text-base font-semibold text-black">Cold Leads</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-xl w-full justify-start"
                onClick={() => navigate("/leads/dead")}
              >
                <Card className="border-0 bg-transparent shadow-none w-full">
                  <CardContent className="p-2">
                    <div className="flex items-center space-x-3">
                      <div className="min-w-[4rem] h-16 bg-red-500 rounded-xl flex items-center justify-center px-3">
                        <span className="text-white font-bold text-3xl">{formatStatValue(stats.deadLeads)}</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <div className="text-sm text-gray-500">Total Number of</div>
                        <div className="text-base font-semibold text-black">Dead Leads</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-xl w-full justify-start"
                onClick={() => navigate("/leads/hot")}
              >
                <Card className="border-0 bg-transparent shadow-none w-full">
                  <CardContent className="p-2">
                    <div className="flex items-center space-x-3">
                      <div className="min-w-[4rem] h-16 bg-orange-500 rounded-xl flex items-center justify-center px-3">
                        <span className="text-white font-bold text-3xl">{formatStatValue(stats.hotLeads)}</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <div className="text-sm text-gray-500">Total Number of</div>
                        <div className="text-base font-semibold text-black">Hot Leads</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Button>
              <Button
                variant="ghost"
                className="p-0 h-auto border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-xl w-full justify-start"
                onClick={() => navigate("/leads/converted")}
              >
                <Card className="border-0 bg-transparent shadow-none w-full">
                  <CardContent className="p-2">
                    <div className="flex items-center space-x-3">
                      <div className="min-w-[4rem] h-16 bg-green-600 rounded-xl flex items-center justify-center px-3">
                        <span className="text-white font-bold text-3xl">{formatStatValue(stats.converted)}</span>
                      </div>
                      <div className="flex flex-col text-left">
                        <div className="text-sm text-gray-500">Total Number of</div>
                        <div className="text-base font-semibold text-black">Converted Leads</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Button>
              <Card className="border-0 shadow-md hover:shadow-lg transition-all duration-300 bg-white rounded-xl">
                <CardContent className="p-2">
                  <div className="flex items-center space-x-3">
                    <div className="min-w-[4rem] h-16 bg-black rounded-xl flex items-center justify-center px-3">
                      <span className="text-white font-bold text-3xl">{formatStatValue(stats.totalLeads)}</span>
                    </div>
                    <div className="flex flex-col text-left">
                      <div className="text-sm text-gray-500">Total Number of</div>
                      <div className="text-base font-semibold text-black">All Our Leads</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Filters */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="New">New</SelectItem>
                      <SelectItem value="Hot">Hot</SelectItem>
                      <SelectItem value="Cold">Cold</SelectItem>
                      <SelectItem value="Converted">Converted</SelectItem>
                      <SelectItem value="Dead">Dead</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sourceFilter} onValueChange={setSourceFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      {leadSources.map(source => (
                        <SelectItem key={source.id} value={source.name}>{source.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={responseFilter} onValueChange={setResponseFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by response" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Responses</SelectItem>
                      {responseCategories.map(category => (
                        <SelectItem key={category.id} value={category.name}>{category.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={followUpFilter} onValueChange={setFollowUpFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by follow up" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Follow Ups</SelectItem>
                      {followUpStages.map(stage => (
                        <SelectItem key={stage.id} value={stage.name}>{stage.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={assignedToFilter} onValueChange={setAssignedToFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by assigned to" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {salespeople.map(user => (
                        <SelectItem key={user.id} value={user.name || user.email}>{user.name || user.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Latest Leads with expandable rows */}
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-lg">Latest Leads</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-200">
                      <TableHead className="font-semibold w-8"></TableHead>
                      <TableHead className="font-semibold">Lead</TableHead>
                      <TableHead className="font-semibold">Contact</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
                      <TableHead className="font-semibold">Source</TableHead>
                      <TableHead className="font-semibold">Response</TableHead>
                      <TableHead className="font-semibold">Revenue</TableHead>
                      <TableHead className="font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <React.Fragment key={lead.id}>
                        <TableRow className="hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50/30 transition-all duration-200">
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(lead.id)}
                            >
                              {expandedRows.has(lead.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-blue-700 text-white font-medium">
                                  {lead.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-slate-900">{lead.name}</p>
                                <p className="text-sm text-slate-500">ID: {lead.id.toString().padStart(4, '0')}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2 text-sm">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-600">{lead.phone}</span>
                              </div>
                              <div className="flex items-center space-x-2 text-sm">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-600">{lead.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(lead.status)}>
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="text-slate-700">{lead.source}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-slate-700 text-sm">{lead.responsecategory}</span>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-slate-900">£{(lead.revenue || 0).toLocaleString()}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button variant="outline" size="sm" onClick={() => handleViewLead(lead)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditLead(lead)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleDeleteLead(lead.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                        {expandedRows.has(lead.id) && (
                          <TableRow>
                            <TableCell colSpan={8} className="bg-slate-50 p-4">
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="font-medium text-slate-600">Room Grade:</span>
                                  <p className="text-slate-900">{lead.roomgrade}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-600">Duration:</span>
                                  <p className="text-slate-900">{lead.duration}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-slate-600">Assigned To:</span>
                                  <p className="text-slate-900">{lead.assignedto}</p>
                                </div>
                                <div className="col-span-3">
                                  <span className="font-medium text-slate-600">Notes:</span>
                                  <p className="text-slate-900">{lead.notes}</p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <LeadManagement 
              studios={studios}
              leadStatus={leadStatus}
              followUpStages={followUpStages}
              responseCategories={responseCategories}
              roomGrades={roomGrades}
              stayDurations={stayDurations}
              leadSources={leadSources}
              salespeople={salespeople}
              studioViews={studioViews}
              onConvertLead={handleConvertLead}
              onUpdateLead={handleUpdateLead}
              onDeleteLead={handleDeleteLead}
              operationLoading={operationLoading}
            />
          </TabsContent>

          <TabsContent value="students">
            <StudentManagement 
              students={students}
              studios={studios}
              studioStats={{
                total: studios.length,
                occupied: studios.filter((s: any) => s.occupied).length,
                vacant: studios.filter((s: any) => !s.occupied).length,
              }}
              roomGrades={roomGrades}
              stayDurations={stayDurations}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onAddStudent={handleAddStudent}
            />
          </TabsContent>

          <TabsContent value="tourists">
            <TouristManagement 
              tourists={tourists}
              studios={studios}
              roomGrades={roomGrades}
              onUpdateTourist={handleUpdateTourist}
              onDeleteTourist={handleDeleteTourist}
              onAddTourist={handleAddTourist}
            />
          </TabsContent>

          <TabsContent value="studios">
            <StudioManagement 
              studios={studios}
              students={students}
              tourists={tourists}
              studioStats={studioStats}
              onUpdateStudio={handleUpdateStudio}
              onDeleteStudio={handleDeleteStudio}
              onAddStudio={handleAddStudio}
              roomGrades={roomGrades}
              studioViews={studioViews}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <Analytics leads={leads} students={students} />
        
        {/* Database Status Check */}
        <div className="col-span-1">
          
        </div>
          </TabsContent>

        </Tabs>
        </>
      )}
    </main>

    <LeadDetailsModal
      lead={selectedLead}
      isOpen={isLeadDetailsOpen}
      onClose={() => setIsLeadDetailsOpen(false)}
    />
  </div>
);
};

export default Index;
