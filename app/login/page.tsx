import { LoginBanner } from '@/components/auth/LoginBanner';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-brand-100 selection:text-brand-900">
      <LoginBanner />
      <LoginForm />
    </div>
  );
}