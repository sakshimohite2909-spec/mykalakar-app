import React from "react";

interface PasswordStrengthMeterProps {
  password: string;
}

export function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const calculateStrength = (pwd: string) => {
    let score = 0;
    if (!pwd) return { score: 0, label: "Empty", color: "bg-slate-200" };

    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[!@#$%^&*]/.test(pwd)) score += 1;

    switch (score) {
      case 0:
      case 1:
        return { score, label: "Weak", color: "bg-red-500" };
      case 2:
      case 3:
        return { score, label: "Medium", color: "bg-yellow-500" };
      case 4:
        return { score, label: "Strong", color: "bg-green-500" };
      default:
        return { score: 0, label: "Empty", color: "bg-slate-200" };
    }
  };

  const strength = calculateStrength(password);

  return (
    <div className="mt-2 w-full">
      <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-full flex-1 transition-colors duration-300 ${
              level <= strength.score ? strength.color : "bg-slate-200"
            }`}
          />
        ))}
      </div>
      <p className="mt-1 text-right text-xs font-semibold text-slate-500">
        Password Strength: <span className={strength.color.replace("bg-", "text-")}>{strength.label}</span>
      </p>
    </div>
  );
}
