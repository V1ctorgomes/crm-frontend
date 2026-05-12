import { LoginBanner, type RecentMember } from '@/components/auth/LoginBanner';
import { LoginForm } from '@/components/auth/LoginForm';

/** Sempre ir buscar os últimos membros ao servidor (não cache estático na build). */
export const dynamic = 'force-dynamic';

const serverApiBase =
  (process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001').replace(
    /\/$/,
    '',
  );

async function getRecentMembers(): Promise<RecentMember[]> {
  try {
    const res = await fetch(`${serverApiBase}/auth/recent-members?limit=3`, {
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { users?: RecentMember[] };
    return Array.isArray(data.users) ? data.users : [];
  } catch {
    return [];
  }
}

export default async function LoginPage() {
  const recentUsers = await getRecentMembers();

  return (
    <div className="min-h-screen w-full flex bg-brand-canvas font-sans selection:bg-brand-100 selection:text-brand-900">
      <LoginBanner recentUsers={recentUsers} />
      <LoginForm />
    </div>
  );
}
