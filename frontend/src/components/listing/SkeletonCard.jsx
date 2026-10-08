const SkeletonCard = () => {
  return (
    <div className="relative border border-white p-2 text-white sm:p-4">
      <div className="flex h-[290px] w-full flex-col sm:h-[390px] md:h-[350px]">
        <div className="flex-1 bg-gray-700 animate-pulse"></div>
        <div className="mt-4">
          <div className="h-4 bg-gray-700 rounded w-3/4 mx-auto animate-pulse"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2 mx-auto mt-2 animate-pulse"></div>
          <div className="h-10 bg-gray-700 rounded w-1/2 mx-auto mt-4 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
