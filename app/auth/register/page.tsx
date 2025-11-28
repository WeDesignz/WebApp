import { Suspense } from 'react';
import AuthHeader from '@/components/auth/AuthHeader';
import RegisterForm from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Register | WeDesign',
  description: 'Create a new WeDesign account',
};

export default function RegisterPage() {
  return (
    <>
      <AuthHeader />
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
        <RegisterForm />
      </Suspense>
    </>
  );
}
