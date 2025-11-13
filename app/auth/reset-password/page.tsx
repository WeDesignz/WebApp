import AuthHeader from '@/components/auth/AuthHeader';
import ResetPasswordForm from '@/components/auth/ResetPasswordForm';

export const metadata = {
  title: 'Reset Password | WeDesign',
  description: 'Reset your WeDesign account password',
};

export default function ResetPasswordPage() {
  return (
    <>
      <AuthHeader />
      <ResetPasswordForm />
    </>
  );
}
