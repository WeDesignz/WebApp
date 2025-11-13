import AuthHeader from '@/components/auth/AuthHeader';
import SetPasswordForm from '@/components/auth/SetPasswordForm';

export const metadata = {
  title: 'Set Password | WeDesign',
  description: 'Set your new password',
};

export default function SetPasswordPage() {
  return (
    <>
      <AuthHeader />
      <SetPasswordForm />
    </>
  );
}
