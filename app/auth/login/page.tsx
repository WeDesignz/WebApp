import { Suspense } from 'react';
import AuthHeader from '@/components/auth/AuthHeader';
import LoginForm from '@/components/auth/LoginForm';
import PublicPageWrapper from '@/components/common/PublicPageWrapper';

export const metadata = {
  title: 'Login | WeDesign',
  description: 'Sign in to your WeDesign account',
};

export default function LoginPage() {
  return (
    <PublicPageWrapper>
      <AuthHeader />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </PublicPageWrapper>
  );
}
