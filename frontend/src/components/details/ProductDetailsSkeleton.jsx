const ProductDetailsSkeleton = () => {
  return (
    <div className="w-full animate-pulse">
      <div className="w-full h-[300px] md:h-[400px] bg-gray-800 mb-10"></div>
      
      <main className="w-full px-4 md:px-6 lg:px-4">
        <div className="grid w-full grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column Skeleton */}
          <div className="col-span-1 p-6 border lg:col-span-3 md:p-10 border-gray-700">
            <div className="h-8 bg-gray-700 w-3/4 mb-4 rounded"></div>
            <div className="h-6 bg-gray-700 w-1/2 mb-6 rounded"></div>
            <div className="h-10 bg-gray-700 w-full mb-4 rounded"></div>
            <div className="h-10 bg-gray-700 w-full rounded"></div>
          </div>

          {/* Middle Column (Slider) Skeleton */}
          <div className="col-span-1 p-6 border lg:col-span-5 md:p-8 border-gray-700">
            <div className="aspect-square bg-gray-700 w-full mb-4 rounded"></div>
            <div className="flex gap-2 justify-center">
              <div className="h-16 w-16 bg-gray-700 rounded"></div>
              <div className="h-16 w-16 bg-gray-700 rounded"></div>
              <div className="h-16 w-16 bg-gray-700 rounded"></div>
            </div>
          </div>

          {/* Right Column (Accordion) Skeleton */}
          <div className="col-span-1 p-6 border lg:col-span-4 md:p-10 border-gray-700">
            <div className="h-12 bg-gray-700 w-full mb-3 rounded"></div>
            <div className="h-12 bg-gray-700 w-full mb-3 rounded"></div>
            <div className="h-12 bg-gray-700 w-full rounded"></div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetailsSkeleton;
