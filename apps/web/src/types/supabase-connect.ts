export type SupabaseOrgOption = { id: string; slug: string; name: string };

export type SupabaseProjectOption = {
  ref: string;
  name: string;
  region: string;
  organizationSlug: string;
  status: string;
};

export type AssembledCredentials = {
  databaseUrl: string;
  directUrl: string;
  databasePassword: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
};
