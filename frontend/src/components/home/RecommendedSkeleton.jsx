const RecommendedSkeleton = () => {
  return (
    <div className="w-full py-12 animate-pulse">
      <div className="container px-4 mx-auto">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 md:ml-12 md:flex-row">
          <div className="h-10 bg-gray-800 w-64 rounded"></div>
          <div className="h-10 bg-gray-800 w-32 rounded"></div>
        </div>
        
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className="h-[320px] w-[82vw] sm:w-[300px] md:h-[350px] md:w-[340px] lg:h-[400px] lg:w-[430px] bg-gray-800 rounded flex-shrink-0"
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendedSkeleton;
