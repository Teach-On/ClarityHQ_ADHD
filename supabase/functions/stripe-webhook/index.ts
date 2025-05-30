import { createClient } from "npm:@supabase/supabase-js@2.39.7";
import Stripe from "npm:stripe@14.21.0";

Deno.serve(async (req: Request) => {
  try {
    // Initialize Stripe with the secret key
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "Stripe key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    const stripe = new Stripe(stripeSecretKey);
    
    // Get the webhook secret from environment variables
    const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!endpointSecret) {
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Get the signature from the headers
    const sig = req.headers.get('stripe-signature');
    if (!sig) {
      return new Response(
        JSON.stringify({ error: "No signature provided" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Get the request body as text
    const body = await req.text();
    
    // Verify the webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err) {
      return new Response(
        JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Handle the event
    if (event.type === 'customer.subscription.created' || 
        event.type === 'customer.subscription.updated' || 
        event.type === 'customer.subscription.deleted') {
      
      const subscription = event.data.object;
      const customerId = subscription.customer;
      
      // Find the Supabase user associated with this Stripe customer
      const customerData = await stripe.customers.retrieve(customerId as string);
      
      if (!customerData || customerData.deleted) {
        return new Response(
          JSON.stringify({ error: "Customer not found or deleted" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      
      const supabaseId = customerData.metadata?.supabase_id;
      
      if (!supabaseId) {
        return new Response(
          JSON.stringify({ error: "No Supabase ID in customer metadata" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      
      // Prepare subscription data to save in user metadata
      const subscriptionData = {
        id: subscription.id,
        status: subscription.status,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
      };
      
      // Update user metadata with subscription info
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        supabaseId,
        { user_metadata: { subscription: subscriptionData } }
      );
      
      if (updateError) {
        return new Response(
          JSON.stringify({ error: `Failed to update user metadata: ${updateError.message}` }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error in stripe-webhook function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        message: error.message || "Unknown error occurred"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});