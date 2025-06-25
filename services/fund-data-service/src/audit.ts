import { createClient } from '@supabase/supabase-js';
import { getSession } from 'next-auth/react';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function logAuditEvent(
  req: any,
  action: string,
  details: any
): Promise<void> {
  const session = await getSession({ req });
  if (!session?.user) return;

  const { user } = session;
  const { organizationId } = user;

  await supabase.from('audit_logs').insert([
    {
      user_id: user.id,
      organization_id: organizationId,
      action,
      details,
    },
  ]);
}