import AuthHeader from '@/components/auth/AuthHeader';
import LoginForm from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Login | WeDesign',
  description: 'Sign in to your WeDesign account',
};

export default function LoginPage() {
  return (
    <>
      <AuthHeader />
      <LoginForm />
    </>
  );
}
