const Section5 = () => {
  return (
    <div className="grid w-full grid-cols-1 overflow-hidden bg-gray-500 md:grid-cols-2">
      {/* Left Section with Background Image */}
      <div
        className="w-full h-[50vh] md:h-[90vh] text-white px-6 md:px-12 lg:px-20"
        style={{
          backgroundImage:
            'url(https://images.unsplash.com/photo-1440589473619-3cde28941638?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fG1vZGVsfGVufDB8fDB8fHww)',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      ></div>

      {/* Right Section with Image */}
      <div className="flex items-center justify-center w-full py-10 md:py-0">
        <img
          src="https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cGVyZnVtZXxlbnwwfHwwfHx8MA%3D%3D"
          alt="Product Image"
          className="object-cover w-[200px] md:w-[250px] lg:w-[300px]"
        />
      </div>
    </div>
  );
};

export default Section5;
