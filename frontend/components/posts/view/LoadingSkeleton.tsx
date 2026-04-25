export function LoadingSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse"></div>
      </div>
      <div className="space-y-8">
        <div className="h-[400px] w-full bg-gray-200 rounded-2xl animate-pulse"></div>
        <div className="space-y-4">
          <div className="h-10 w-3/4 bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="h-24 w-full bg-gray-200 rounded-lg animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 w-full bg-gray-200 rounded-lg animate-pulse"
              ></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
