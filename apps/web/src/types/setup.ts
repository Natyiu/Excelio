export type SetupData = {
  databaseUrl: string;
  directUrl: string;
  databasePassword?: string;
  betterAuthUrl: string;
  corsOrigin: string;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  resendApiKey?: string;
  resendFromEmail?: string;
  googleClientId?: string;
  googleClientSecret?: string;
  emailVerificationEnabled?: boolean;
  forgotPasswordEnabled?: boolean;
  polarAccessToken?: string;
  polarOrganizationId?: string;
  polarWebhookSecret?: string;
  polarSandboxMode?: boolean;
};

export type StepId = "supabase" | "auth" | "payment" | "review";

export interface StepDef {
  id: StepId;
  label: string;
  description: string;
  required?: boolean;
}

export type SetupWizardFormData = {
  databaseUrl: string;
  directUrl: string;
  databasePassword: string;
  betterAuthUrl: string;
  corsOrigin: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  resendApiKey: string;
  resendFromEmail: string;
  googleClientId: string;
  googleClientSecret: string;
  polarAccessToken: string;
  polarOrganizationId: string;
  polarWebhookSecret: string;
  polarSandboxMode: boolean;
  wantGoogle: boolean;
  wantResend: boolean;
  emailVerificationEnabled: boolean;
  forgotPasswordEnabled: boolean;
};

export type SetupWizardStepProps = {
  form: SetupWizardFormData;
  update: <K extends keyof SetupWizardFormData>(key: K, value: SetupWizardFormData[K]) => void;
  errors: Record<string, string>;
  showSecrets: Record<string, boolean>;
  toggleSecret: (key: string) => void;
};

export type SetupWizardSupabaseCredentials = {
  databaseUrl: string;
  directUrl: string;
  databasePassword: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  supabaseServiceRoleKey: string;
};
