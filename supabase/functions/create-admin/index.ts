// @ts-ignore: Deno types
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore: Deno types
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// @ts-ignore: Deno types
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // @ts-ignore: Deno runtime
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    // @ts-ignore: Deno runtime
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get the calling user from the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a client with the user's token to verify they're a super_admin
    // @ts-ignore: Deno runtime
    const supabaseUser = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !callingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid user token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if calling user is a super_admin
    const { data: callerRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callingUser.id)
      .single();

    if (!callerRole || callerRole.role !== "super_admin") {
      return new Response(
        JSON.stringify({ error: "Only super admins can manage admin accounts" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json();
    const { action } = body;

    // Route to appropriate handler based on action
    switch (action) {
      case "create":
        return await handleCreateAdmin(supabaseAdmin, body, callingUser.id, corsHeaders);
      case "assign_role":
        return await handleAssignRole(supabaseAdmin, body, callingUser.id, corsHeaders);
      case "remove_role":
        return await handleRemoveRole(supabaseAdmin, body, corsHeaders);
      case "update_role":
        return await handleUpdateRole(supabaseAdmin, body, corsHeaders);
      case "search_users":
        return await handleSearchUsers(supabaseAdmin, body, corsHeaders);
      default:
        // Backward compatibility - treat as create if no action specified
        if (body.email && body.password) {
          return await handleCreateAdmin(supabaseAdmin, body, callingUser.id, corsHeaders);
        }
        return new Response(
          JSON.stringify({ error: "Invalid action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Create a new admin user
async function handleCreateAdmin(
  supabaseAdmin: any,
  body: any,
  createdBy: string,
  corsHeaders: Record<string, string>
) {
  const { email, password, fullName, role } = body;

  if (!email || !password || !fullName || !role) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: email, password, fullName, role" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const validRoles = ["admin1", "admin2", "admin3", "super_admin"];
  if (!validRoles.includes(role)) {
    return new Response(
      JSON.stringify({ error: "Invalid role" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create the user using admin API
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (createError) {
    return new Response(
      JSON.stringify({ error: createError.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Create profile
  await supabaseAdmin
    .from("profiles")
    .insert({
      user_id: newUser.user.id,
      full_name: fullName,
      email,
    });

  // Assign role
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .insert({
      user_id: newUser.user.id,
      role,
      created_by: createdBy,
    });

  if (roleError) {
    return new Response(
      JSON.stringify({ error: "User created but role assignment failed: " + roleError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      user: { 
        id: newUser.user.id, 
        email: newUser.user.email,
        role 
      } 
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Assign role to existing user
async function handleAssignRole(
  supabaseAdmin: any,
  body: any,
  createdBy: string,
  corsHeaders: Record<string, string>
) {
  const { userId, role } = body;

  if (!userId || !role) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: userId, role" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const validRoles = ["admin1", "admin2", "admin3", "super_admin"];
  if (!validRoles.includes(role)) {
    return new Response(
      JSON.stringify({ error: "Invalid role" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Check if user already has a role
  const { data: existingRole } = await supabaseAdmin
    .from("user_roles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingRole) {
    return new Response(
      JSON.stringify({ error: "User already has an admin role. Use update_role to change it." }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Assign the role
  const { error: roleError } = await supabaseAdmin
    .from("user_roles")
    .insert({
      user_id: userId,
      role,
      created_by: createdBy,
    });

  if (roleError) {
    return new Response(
      JSON.stringify({ error: "Role assignment failed: " + roleError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: "Role assigned successfully" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Remove admin role from user
async function handleRemoveRole(
  supabaseAdmin: any,
  body: any,
  corsHeaders: Record<string, string>
) {
  const { userId } = body;

  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: userId" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { error } = await supabaseAdmin
    .from("user_roles")
    .delete()
    .eq("user_id", userId);

  if (error) {
    return new Response(
      JSON.stringify({ error: "Failed to remove role: " + error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: "Role removed successfully" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Update user's role
async function handleUpdateRole(
  supabaseAdmin: any,
  body: any,
  corsHeaders: Record<string, string>
) {
  const { userId, role } = body;

  if (!userId || !role) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: userId, role" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const validRoles = ["admin1", "admin2", "admin3", "super_admin"];
  if (!validRoles.includes(role)) {
    return new Response(
      JSON.stringify({ error: "Invalid role" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { error } = await supabaseAdmin
    .from("user_roles")
    .update({ role })
    .eq("user_id", userId);

  if (error) {
    return new Response(
      JSON.stringify({ error: "Failed to update role: " + error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  return new Response(
    JSON.stringify({ success: true, message: "Role updated successfully" }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Search users for role assignment
async function handleSearchUsers(
  supabaseAdmin: any,
  body: any,
  corsHeaders: Record<string, string>
) {
  const { searchTerm } = body;

  // Get all profiles
  let query = supabaseAdmin
    .from("profiles")
    .select("user_id, full_name, email");

  if (searchTerm) {
    query = query.or(`email.ilike.%${searchTerm}%,full_name.ilike.%${searchTerm}%`);
  }

  const { data: profiles, error: profilesError } = await query.limit(20);

  if (profilesError) {
    return new Response(
      JSON.stringify({ error: "Failed to search users: " + profilesError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Get existing admin roles
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("user_id, role");

  // Combine profiles with roles
  const usersWithRoles = (profiles || []).map((profile: any) => {
    const userRole = (roles || []).find((r: any) => r.user_id === profile.user_id);
    return {
      ...profile,
      role: userRole?.role || null,
    };
  });

  return new Response(
    JSON.stringify({ users: usersWithRoles }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
