import NextAuth from 'next-auth';
import { SupabaseAdapter } from '@auth/supabase-adapter';
import EmailProvider from 'next-auth/providers/email';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role key for admin actions
);

export default NextAuth({
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL!,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  }),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD
        }
      },
      from: process.env.EMAIL_FROM
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: 'jwt',
  },
  events: {
    async createUser(message) {
      // Create a new organization for the new user
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({ name: `${message.user.email}'s Organization` })
        .select()
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        return;
      }

      // Update the user with the new organization_id
      const { error: userError } = await supabase
        .from('users')
        .update({ organization_id: organization.id })
        .eq('id', message.user.id);

      if (userError) {
        console.error('Error updating user with organization:', userError);
      }
    },
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        const { data, error } = await supabase
          .from('users')
          .select('role, organization_id')
          .eq('id', token.sub!)
          .single();
        if (error) {
          console.error('Error fetching user role:', error);
        } else {
          session.user.role = data.role;
          session.user.organizationId = data.organization_id;
        }
      }
      return session;
    },
  },
});