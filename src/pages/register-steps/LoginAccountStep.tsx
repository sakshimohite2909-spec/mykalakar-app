import React, { useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { AtSign, Lock } from "lucide-react";
import TextField from "@/components/TextField";
import PasswordField from "@/components/PasswordField";
import PasswordStrengthMeter from "@/components/PasswordStrengthMeter";

/**
 * LoginAccountStep
 * 
 * An isolated module for the first step of the Artist Registration wizard.
 * Uses `useFormContext` to connect seamlessly to the parent `<FormProvider>`.
 */
export default function LoginAccountStep() {
  const [showPassword, setShowPassword] = useState(false);
  const { register, control, formState: { errors } } = useFormContext();

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-2">
          <div className="p-2 bg-stone-100 rounded-lg text-stone-700">
            <Lock className="w-5 h-5" />
          </div>
          Create Your Login Account
        </h2>
        <p className="text-sm text-stone-500">
          Choose a unique username and password to log in to your Artist Dashboard.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TextField
          label="Username *"
          name="username"
          register={register}
          error={errors.username?.message as string}
          icon={AtSign}
          placeholder="e.g. dj_phoenix99"
          className="md:col-span-2"
        />
        <TextField
          label="Email Address *"
          name="email"
          type="email"
          register={register}
          error={errors.email?.message as string}
          placeholder="e.g. artist@example.com"
          className="md:col-span-2"
        />
        
        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <div className="md:col-span-1">
              <PasswordField
                label="Password *"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.password?.message as string}
                show={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                placeholder="Min 8 characters"
              />
              <PasswordStrengthMeter password={field.value} />
            </div>
          )}
        />
        
        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <div className="md:col-span-1">
              <PasswordField
                label="Confirm Password *"
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                error={errors.confirmPassword?.message as string}
                show={showPassword}
                onToggle={() => setShowPassword((current) => !current)}
                placeholder="Re-enter password"
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}
