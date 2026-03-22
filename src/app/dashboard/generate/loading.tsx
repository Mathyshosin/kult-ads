export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-5 animate-pulse">
      <div className="flex items-center gap-3 mb-8 mt-2">
        <div className="h-10 w-10 bg-gray-200 rounded-xl" />
        <div className="h-7 w-64 bg-gray-200 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
