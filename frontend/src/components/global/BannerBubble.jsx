import React from 'react';
import { Link } from 'react-router-dom';

const BannerBubble = ({ text, link, enabled }) => {
  if (!enabled || !text || text.trim() === '') return null;

  const isExternal =
    link && (link.startsWith('http://') || link.startsWith('https://'));

  const getLines = (str) => {
    if (!str) return ['', ''];
    const mid = Math.ceil(str.length / 2);
    const breakAt = str.lastIndexOf(' ', mid);
    if (breakAt <= 0) return [str, ''];
    return [str.slice(0, breakAt).trim(), str.slice(breakAt).trim()];
  };
  const [line1, line2] = getLines(text);

  const GOLD = '#B8860B';

  const bubble = (
    <div className="relative inline-block select-none group">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 460 310"
        aria-hidden="true"
        className="w-[240px] sm:w-[280px] md:w-[340px] lg:w-[380px] transition-transform duration-300 group-hover:scale-105"
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Glassmorphism: subtle inner highlight at top */}
          <linearGradient id="glass-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="white" stopOpacity="0.18" />
            <stop offset="40%"  stopColor="white" stopOpacity="0.06" />
            <stop offset="100%" stopColor="black" stopOpacity="0.22" />
          </linearGradient>

          {/* Gold glow on the border */}
          <filter id="gold-glow" x="-25%" y="-25%" width="150%" height="150%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
            <feFlood floodColor={GOLD} floodOpacity="0.7" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="glow" />
            <feMerge>
              <feMergeNode in="glow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <clipPath id="cloud-clip">
            <path d="
              M 230 260 L 196 285 L 210 255
              C 175 258 148 248 132 232
              C 112 248  82 248  64 232
              C  44 248  28 228  30 208
              C  10 204   4 184  14 166
              C   2 152   4 130  20 120
              C   8 102  16  80  36  74
              C  32  52  52  36  76  38
              C  80  18 104   8 128  18
              C 136   4 158   0 178  10
              C 188   2 208   0 224  10
              C 236   0 260   2 272  14
              C 288   4 310  10 320  26
              C 342  16 366  26 374  46
              C 396  44 416  62 416  84
              C 434  90 444 112 438 132
              C 452 144 454 166 442 180
              C 452 196 448 218 432 228
              C 432 250 410 264 388 258
              C 376 272 352 278 330 268
              C 316 278 292 282 270 272
              C 258 276 242 276 230 268 Z
            " />
          </clipPath>
        </defs>

        {/* Dark base layer — deep semi-transparent black */}
        <path
          d="
            M 230 260 L 196 285 L 210 255
            C 175 258 148 248 132 232
            C 112 248  82 248  64 232
            C  44 248  28 228  30 208
            C  10 204   4 184  14 166
            C   2 152   4 130  20 120
            C   8 102  16  80  36  74
            C  32  52  52  36  76  38
            C  80  18 104   8 128  18
            C 136   4 158   0 178  10
            C 188   2 208   0 224  10
            C 236   0 260   2 272  14
            C 288   4 310  10 320  26
            C 342  16 366  26 374  46
            C 396  44 416  62 416  84
            C 434  90 444 112 438 132
            C 452 144 454 166 442 180
            C 452 196 448 218 432 228
            C 432 250 410 264 388 258
            C 376 272 352 278 330 268
            C 316 278 292 282 270 272
            C 258 276 242 276 230 268 Z
          "
          fill="rgba(8, 6, 2, 0.52)"
        />

        {/* Glass gradient overlay clipped to cloud shape */}
        <rect
          x="0" y="0" width="460" height="310"
          fill="url(#glass-grad)"
          clipPath="url(#cloud-clip)"
        />

        {/* Gold border with glow */}
        <path
          d="
            M 230 260 L 196 285 L 210 255
            C 175 258 148 248 132 232
            C 112 248  82 248  64 232
            C  44 248  28 228  30 208
            C  10 204   4 184  14 166
            C   2 152   4 130  20 120
            C   8 102  16  80  36  74
            C  32  52  52  36  76  38
            C  80  18 104   8 128  18
            C 136   4 158   0 178  10
            C 188   2 208   0 224  10
            C 236   0 260   2 272  14
            C 288   4 310  10 320  26
            C 342  16 366  26 374  46
            C 396  44 416  62 416  84
            C 434  90 444 112 438 132
            C 452 144 454 166 442 180
            C 452 196 448 218 432 228
            C 432 250 410 264 388 258
            C 376 272 352 278 330 268
            C 316 278 292 282 270 272
            C 258 276 242 276 230 268 Z
          "
          fill="none"
          stroke={GOLD}
          strokeWidth="10"
          strokeLinejoin="round"
          strokeLinecap="round"
          filter="url(#gold-glow)"
        />

        {/* Inner highlight rim — thin white arc at top for glass depth */}
        <path
          d="
            C  80  18 104   8 128  18
            C 136   4 158   0 178  10
            C 188   2 208   0 224  10
            C 236   0 260   2 272  14
            C 288   4 310  10 320  26
          "
          fill="none"
          stroke="rgba(255,255,255,0.22)"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* White text */}
        {!line2 ? (
          <text
            x="230" y="158"
            textAnchor="middle"
            dominantBaseline="middle"
            fontFamily="inherit"
            fontWeight="600"
            fontSize="26"
            fill="white"
            style={{ letterSpacing: '0.02em' }}
          >
            {line1}
          </text>
        ) : (
          <>
            <text
              x="230" y="138"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="inherit"
              fontWeight="600"
              fontSize="34"
              fill="white"
              style={{ letterSpacing: '0.02em' }}
            >
              {line1}
            </text>
            <text
              x="230" y="172"
              textAnchor="middle"
              dominantBaseline="middle"
              fontFamily="inherit"
              fontWeight="600"
              fontSize="34"
              fill="white"
              style={{ letterSpacing: '0.02em' }}
            >
              {line2}
            </text>
          </>
        )}
      </svg>
    </div>
  );

  const wrapperClass = `
    flex justify-start items-center self-start my-4 md:my-6 select-none pl-2 md:pl-10
    ${link ? 'cursor-pointer active:scale-95 transition-transform duration-200' : ''}
  `;

  if (link && link.trim() !== '') {
    return isExternal ? (
      <a href={link} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
        {bubble}
      </a>
    ) : (
      <Link to={link} className={wrapperClass}>
        {bubble}
      </Link>
    );
  }

  return <div className={wrapperClass}>{bubble}</div>;
};

export default BannerBubble;