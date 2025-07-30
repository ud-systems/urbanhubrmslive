import { supabase } from './supabaseClient';
import { createCleaningSchedule } from './supabaseCrud';

/**
 * Auto-schedule cleaning for studios with upcoming checkouts in the next 3 days
 * This function checks both student and tourist reservations
 */
export const autoScheduleUpcomingCleanings = async () => {
  try {
    console.log('🤖 Running auto-scheduling for upcoming cleanings...');
    
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
    const todayStr = today.toISOString().split('T')[0];
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];
    
    // Get student checkouts (calculate from checkin + duration since checkout_date column may not exist)
    let studentCheckouts = [];
    let studentError = null;
    
    try {
      // Get all students with checkin dates and calculate checkout dates manually
      const result = await supabase
        .from('students')
        .select('*')
        .not('checkin', 'is', null)
        .not('duration', 'is', null);
      
      if (result.data) {
        // Filter students whose calculated checkout date is within the next 3 days
        studentCheckouts = result.data.filter(student => {
          if (!student.checkin || !student.duration) return false;
          
          // Calculate checkout date from checkin + duration
          const checkinDate = new Date(student.checkin);
          const durationMonths = parseInt(student.duration) || 0;
          const calculatedCheckout = new Date(checkinDate);
          calculatedCheckout.setMonth(calculatedCheckout.getMonth() + durationMonths);
          
          const checkoutStr = calculatedCheckout.toISOString().split('T')[0];
          
          // Check if checkout is within next 3 days
          return checkoutStr >= todayStr && checkoutStr <= threeDaysStr;
        }).map(student => ({
          ...student,
          calculated_checkout_date: (() => {
            const checkinDate = new Date(student.checkin);
            const durationMonths = parseInt(student.duration) || 0;
            const calculatedCheckout = new Date(checkinDate);
            calculatedCheckout.setMonth(calculatedCheckout.getMonth() + durationMonths);
            return calculatedCheckout.toISOString().split('T')[0];
          })()
        }));
      }
      
      studentError = result.error;
    } catch (error) {
      console.warn('⚠️ Error calculating student checkouts, skipping student auto-scheduling:', error);
      studentError = error;
    }

    if (studentError) {
      console.error('❌ Error fetching student checkouts:', studentError);
    }

    // Get upcoming tourist checkouts (with robust error handling)
    let touristCheckouts = [];
    let touristError = null;
    
    try {
      const result = await supabase
        .from('tourists')
        .select('*')
        .gte('checkout', todayStr)
        .lte('checkout', threeDaysStr)
        .not('checkout', 'is', null);
      
      touristCheckouts = result.data || [];
      touristError = result.error;
    } catch (error) {
      console.warn('⚠️ Error querying tourist checkouts, trying alternate approach:', error);
      // Try getting all tourists and filter manually
      try {
        const altResult = await supabase
          .from('tourists')
          .select('*');
        
        if (altResult.data) {
          touristCheckouts = altResult.data.filter(tourist => {
            const checkoutDate = tourist.checkout || tourist.checkout_date;
            return checkoutDate && checkoutDate >= todayStr && checkoutDate <= threeDaysStr;
          });
        }
      } catch (altError) {
        console.error('❌ Could not fetch tourists with alternate method:', altError);
        touristError = altError;
      }
    }

    if (touristError) {
      console.error('❌ Error fetching tourist checkouts:', touristError);
    }

    const schedulesCreated = [];
    
    // Process student checkouts
    if (studentCheckouts && studentCheckouts.length > 0) {
      console.log(`🎓 Found ${studentCheckouts.length} student checkouts in next 3 days`);
      
      for (const student of studentCheckouts) {
        // Handle different possible field names for studio reference
        const studioId = student.room || student.assignedto || student.studio_id;
        const checkoutDate = student.calculated_checkout_date || student.checkout_date || student.checkout;
        
        if (studioId && checkoutDate) {
          await processCheckoutScheduling({
            reservationId: student.id,
            reservationType: 'student',
            studioId: studioId,
            checkoutDate: checkoutDate,
            guestName: student.name,
            studio: null // Will fetch studio info separately if needed
          });
          schedulesCreated.push(`Student: ${student.name} - Studio: ${studioId} - Checkout: ${checkoutDate}`);
        }
      }
    }

    // Process tourist checkouts
    if (touristCheckouts && touristCheckouts.length > 0) {
      console.log(`🏖️ Found ${touristCheckouts.length} tourist checkouts in next 3 days`);
      
      for (const tourist of touristCheckouts) {
        // Handle different possible field names for studio reference
        const studioId = tourist.assignedto || tourist.room || tourist.studio_id;
        const checkoutDate = tourist.checkout || tourist.checkout_date;
        
        if (studioId && checkoutDate) {
          await processCheckoutScheduling({
            reservationId: tourist.id,
            reservationType: 'tourist',
            studioId: studioId,
            checkoutDate: checkoutDate,
            guestName: tourist.name,
            studio: null // Will fetch studio info separately if needed
          });
          schedulesCreated.push(`Tourist: ${tourist.name} - Studio: ${studioId}`);
        }
      }
    }

    console.log(`✅ Auto-scheduling completed. ${schedulesCreated.length} cleaning schedules processed.`);
    return {
      success: true,
      schedulesCreated: schedulesCreated.length,
      details: schedulesCreated
    };

  } catch (error) {
    console.error('💥 Error in auto-scheduling:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Process checkout scheduling for a single reservation
 */
async function processCheckoutScheduling({
  reservationId,
  reservationType,
  studioId,
  checkoutDate,
  guestName,
  studio
}: {
  reservationId: number;
  reservationType: 'student' | 'tourist';
  studioId: string;
  checkoutDate: string;
  guestName: string;
  studio: any;
}) {
  try {
    // Check if cleaning is already scheduled for this checkout
    const { data: existingSchedule } = await supabase
      .from('cleaning_schedules')
      .select('id')
      .eq('studio_id', studioId)
      .eq('reservation_type', reservationType)
      .eq('reservation_id', reservationId)
      .eq('cleaning_type', 'checkout')
      .single();

    if (existingSchedule) {
      console.log(`⏭️ Cleaning already scheduled for ${reservationType} ${guestName} in studio ${studioId}`);
      return;
    }

    // Calculate cleaning schedule date (same day as checkout, but could be adjusted)
    const cleaningDate = checkoutDate;
    
    // Determine priority based on how soon the checkout is
    const daysUntilCheckout = Math.ceil(
      (new Date(checkoutDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    
    let priority: 'low' | 'normal' | 'high' | 'urgent' = 'normal';
    if (daysUntilCheckout <= 1) {
      priority = 'urgent';
    } else if (daysUntilCheckout <= 2) {
      priority = 'high';
    }

    // Create the cleaning schedule (minimal required fields to avoid column errors)
    const scheduleData = {
      studio_id: studioId,
      reservation_type: reservationType,
      reservation_id: reservationId,
      scheduled_date: cleaningDate,
      scheduled_time: '11:00', // Default checkout cleaning time
      cleaning_type: 'checkout',
      priority,
      assigned_cleaner_id: null, // Will be auto-assigned
      notes: `Auto-scheduled for ${reservationType} checkout: ${guestName}`,
      special_requirements: `Checkout cleaning for studio ${studioId}`
    };

    const result = await createCleaningSchedule(scheduleData);
    
    if (result) {
      console.log(`✅ Auto-scheduled cleaning for ${reservationType} ${guestName} - Studio: ${studioId}, Date: ${cleaningDate}`);
    } else {
      console.error(`❌ Failed to auto-schedule cleaning for ${reservationType} ${guestName}`);
    }

  } catch (error) {
    console.error(`💥 Error processing checkout scheduling for ${reservationType} ${guestName}:`, error);
  }
}

/**
 * Check for overdue cleanings and update their status
 */
export const updateOverdueCleanings = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('cleaning_schedules')
      .update({ status: 'overdue' })
      .eq('status', 'scheduled')
      .lt('scheduled_date', today)
      .select();

    if (error) {
      console.error('❌ Error updating overdue cleanings:', error);
      return { success: false, error: error.message };
    }

    console.log(`📅 Updated ${data?.length || 0} overdue cleaning schedules`);
    return { success: true, updated: data?.length || 0 };

  } catch (error) {
    console.error('💥 Error in updateOverdueCleanings:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Get cleaning automation statistics
 */
export const getAutomationStats = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    const threeDaysStr = threeDaysFromNow.toISOString().split('T')[0];

    // Get upcoming checkouts that need cleaning schedules (calculate student checkouts)
    let upcomingCheckouts = [];
    let upcomingTouristCheckouts = [];
    
    try {
      // Calculate student checkouts from checkin + duration
      const studentResult = await supabase
        .from('students')
        .select('*')
        .not('checkin', 'is', null)
        .not('duration', 'is', null);
      
      if (studentResult.data) {
        upcomingCheckouts = studentResult.data.filter(student => {
          if (!student.checkin || !student.duration) return false;
          
          const checkinDate = new Date(student.checkin);
          const durationMonths = parseInt(student.duration) || 0;
          const calculatedCheckout = new Date(checkinDate);
          calculatedCheckout.setMonth(calculatedCheckout.getMonth() + durationMonths);
          
          const checkoutStr = calculatedCheckout.toISOString().split('T')[0];
          return checkoutStr >= today && checkoutStr <= threeDaysStr;
        });
      }
    } catch (error) {
      console.warn('⚠️ Could not calculate student checkouts for stats:', error);
    }

    try {
      const touristResult = await supabase
        .from('tourists')
        .select('*')
        .gte('checkout', today)
        .lte('checkout', threeDaysStr)
        .not('checkout', 'is', null);
      upcomingTouristCheckouts = touristResult.data || [];
    } catch (error) {
      console.warn('⚠️ Could not fetch tourist checkouts for stats:', error);
      // Try alternate approach if checkout column doesn't exist
      try {
        const altResult = await supabase
          .from('tourists')
          .select('*');
        if (altResult.data) {
          upcomingTouristCheckouts = altResult.data.filter(tourist => {
            const checkoutDate = tourist.checkout || tourist.checkout_date;
            return checkoutDate && checkoutDate >= today && checkoutDate <= threeDaysStr;
          });
        }
      } catch (altError) {
        console.warn('⚠️ Could not fetch tourists with alternate method:', altError);
      }
    }

    // Get existing auto-scheduled cleanings
    const { data: autoScheduled } = await supabase
      .from('cleaning_schedules')
      .select('id')
      .eq('cleaning_type', 'checkout')
      .gte('scheduled_date', today)
      .lte('scheduled_date', threeDaysStr);

    const totalUpcoming = (upcomingCheckouts?.length || 0) + (upcomingTouristCheckouts?.length || 0);
    const totalAutoScheduled = autoScheduled?.length || 0;
    const needsScheduling = Math.max(0, totalUpcoming - totalAutoScheduled);

    return {
      upcomingCheckouts: totalUpcoming,
      autoScheduled: totalAutoScheduled,
      needsScheduling,
      efficiency: totalUpcoming > 0 ? Math.round((totalAutoScheduled / totalUpcoming) * 100) : 100
    };

  } catch (error) {
    console.error('💥 Error getting automation stats:', error);
    return {
      upcomingCheckouts: 0,
      autoScheduled: 0,
      needsScheduling: 0,
      efficiency: 0
    };
  }
}; 