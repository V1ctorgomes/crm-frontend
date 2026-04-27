import { LoginBanner } from '@/components/auth/LoginBanner';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-blue-100 selection:text-blue-900">
      <LoginBanner />
      <LoginForm />
    </div>
  );
}