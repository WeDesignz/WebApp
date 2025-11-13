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
      <RegisterForm />
    </>
  );
}
