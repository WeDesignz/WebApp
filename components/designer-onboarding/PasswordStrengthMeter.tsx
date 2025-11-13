"use client";

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const getStrength = (pwd: string): { score: number; label: string; color: string } => {
    if (!pwd) return { score: 0, label: '', color: 'bg-gray-200' };
    
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-destructive' };
    if (score === 3) return { score: 2, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 4) return { score: 3, label: 'Good', color: 'bg-blue-500' };
    return { score: 4, label: 'Strong', color: 'bg-green-500' };
  };

  const strength = getStrength(password);

  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((bar) => (
          <div
            key={bar}
            className={`h-1 flex-1 rounded-full transition-all ${
              bar <= strength.score ? strength.color : 'bg-muted'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>
        Password strength: {strength.label}
      </p>
      {strength.score < 3 && (
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• Use at least 8 characters (12+ recommended)</li>
          <li>• Mix uppercase and lowercase letters</li>
          <li>• Include numbers and special characters</li>
        </ul>
      )}
    </div>
  );
}
