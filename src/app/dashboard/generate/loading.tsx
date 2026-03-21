export default function GenerateLoading() {
  return (
    <div className="max-w-lg mx-auto px-5 pt-12 animate-pulse">
      <div className="flex justify-center mb-6">
        <div className="w-14 h-14 bg-gray-200 rounded-2xl" />
      </div>
      <div className="h-8 w-72 bg-gray-200 rounded-lg mx-auto mb-3" />
      <div className="h-4 w-48 bg-gray-200 rounded mx-auto mb-10" />
      <div className="grid grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-gray-200 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
