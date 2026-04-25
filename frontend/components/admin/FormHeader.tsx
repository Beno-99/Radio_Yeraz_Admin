// components/admin/FormHeader.tsx
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface FormHeaderProps {
  title: string;
  backLink: string;
}

export function FormHeader({ title, backLink }: FormHeaderProps) {
  return (
    <div className="mb-6">
      <Link
        href={backLink}
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        <span>Back to Admins</span>
      </Link>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-600 mt-1">
        Add a new administrator to the system
      </p>
    </div>
  );
}
