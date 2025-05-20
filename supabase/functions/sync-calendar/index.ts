import { createClient } from "npm:@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Parse request body
    const { accessToken } = await req.json();
    
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: "Missing Google access token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token and get user ID
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid user token" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const userId = userData.user.id;

    // Set up time range for next 24 hours
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Fetch events from Google Calendar API
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${tomorrow.toISOString()}&singleEvents=true&orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!calendarResponse.ok) {
      const errorData = await calendarResponse.json();
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch Google Calendar events", 
          details: errorData 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: calendarResponse.status }
      );
    }
    
    const calendarData = await calendarResponse.json();
    
    // Delete existing calendar events for this user to avoid duplicates
    const { error: deleteError } = await supabase
      .from('calendar_events')
      .delete()
      .eq('user_id', userId);
      
    if (deleteError) {
      return new Response(
        JSON.stringify({ error: "Failed to clean up existing events", details: deleteError }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    // Process and insert events
    const events = [];
    
    if (calendarData.items && calendarData.items.length > 0) {
      for (const event of calendarData.items) {
        // Skip cancelled events
        if (event.status === 'cancelled') continue;
        
        // Handle all-day events
        let startTime, endTime;
        
        if (event.start.dateTime) {
          startTime = new Date(event.start.dateTime);
        } else {
          // All-day event, set to beginning of day
          startTime = new Date(event.start.date);
          startTime.setHours(0, 0, 0, 0);
        }
        
        if (event.end.dateTime) {
          endTime = new Date(event.end.dateTime);
        } else {
          // All-day event, set to end of day
          endTime = new Date(event.end.date);
          endTime.setHours(23, 59, 59, 999);
        }
        
        events.push({
          user_id: userId,
          title: event.summary || 'Untitled Event',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          location: event.location || null,
          google_event_id: event.id
        });
      }
    }
    
    // Insert events if any exist
    if (events.length > 0) {
      const { error: insertError } = await supabase
        .from('calendar_events')
        .insert(events);
        
      if (insertError) {
        return new Response(
          JSON.stringify({ error: "Failed to store calendar events", details: insertError }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Calendar events synced successfully",
        count: events.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
    
  } catch (error) {
    console.error("Error in sync-calendar function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message || "Unknown error occurred"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});