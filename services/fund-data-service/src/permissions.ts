import { getSession } from 'next-auth/react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function hasPermission(
  req: any,
  requiredRole: string
): Promise<boolean> {
  const session = await getSession({ req });
  if (!session?.user) return false;

  const { user } = session;
  if (user.role === 'admin') return true;
  if (user.role === requiredRole) return true;

  // Check for hierarchical permissions
  let currentUser = user;
  while (currentUser.parent_id) {
    const { data: parentUser, error } = await supabase
      .from('users')
      .select('role, parent_id')
      .eq('id', currentUser.parent_id)
      .single();

    if (error) {
      console.error('Error fetching parent user:', error);
      return false;
    }

    if (parentUser.role === 'admin') return true;
    if (parentUser.role === requiredRole) return true;

    currentUser = parentUser;
  }

  return false;
}