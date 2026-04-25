// components/admin/FieldError.tsx
interface FieldErrorProps {
  error?: { message?: string };
}

export function FieldError({ error }: FieldErrorProps) {
  if (!error?.message) return null;

  return <p className="text-sm text-red-600 mt-1">{error.message}</p>;
}
