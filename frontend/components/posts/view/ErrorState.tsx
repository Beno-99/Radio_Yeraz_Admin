import { ArrowLeft } from "lucide-react";

interface ErrorStateProps {
  onBack: () => void;
}

export function ErrorState({ onBack }: ErrorStateProps) {
  return (
    <div className="max-w-6xl mx-auto p-8 text-center">
      <div className="bg-white rounded-xl shadow-md border py-12 px-6">
        <div className="space-y-4">
          <div className="text-4xl">📄</div>
          <h2 className="text-2xl font-semibold text-gray-800">
            Post not found
          </h2>
          <p className="text-gray-500">
            The post you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={onBack}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
