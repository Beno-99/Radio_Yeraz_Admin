// components/admin/FormActions.tsx
import { Save, Loader2 } from "lucide-react";

interface FormActionsProps {
  onCancel: () => void;
  loading: boolean;
  submitText: string;
}

export function FormActions({
  onCancel,
  loading,
  submitText,
}: FormActionsProps) {
  return (
    <div className="flex flex-col-reverse md:flex-row gap-4 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        className="md:flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className={`md:flex-1 px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
          loading
            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
        }`}
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            {submitText}
          </>
        )}
      </button>
    </div>
  );
}
