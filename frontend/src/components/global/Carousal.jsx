import { forwardRef, memo } from 'react';

const CustomCarousel = memo(
  forwardRef(function CustomCarousel(
    { items = [], renderItem, onMouseEnter, onMouseLeave, onTouchStart, onTouchEnd, style = {} },
    ref
  ) {
    return (
      <div
        className="relative max-w-full mt-8 mx-4 select-none"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div
          ref={ref}
          className="overflow-x-auto flex items-center my-carousel"
          style={{
            scrollBehavior: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
            scrollSnapType: 'x mandatory',
            ...style
          }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {items.map(renderItem)}
        </div>
      </div>
    );
  })
);

export default CustomCarousel;