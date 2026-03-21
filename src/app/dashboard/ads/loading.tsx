export default function AdsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-5 pt-8 animate-pulse">
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-9 w-64 bg-gray-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
