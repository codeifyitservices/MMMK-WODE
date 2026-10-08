export default function SiteLoading() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        background: '#28120B',
        margin: 0,
        padding: 0,
        position: 'relative',
      }}
    >
      {/* <style>
        {`
          @keyframes pulse {
            0% {
              transform: scale(1);
            }
            100% {
              transform: scale(1.5);
            }
          }
        `}
      </style>
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "rgba(40, 18, 11, 0.8)",
          zIndex: 1,
        }}
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <div
            key={index}
            style={{
              width: "20px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "#fff",
              margin: "5px",
              // animation: `pulse 1s infinite ${index}s`,
            }}
          ></div>
        ))}
      </div> */}
      <img
        src="/Wode Logo.png"
        alt="Loading MMMK Wode"
        width="200"
        height="200"
        decoding="async"
        style={{ width: '200px' }}
      />
    </div>
  );
}
