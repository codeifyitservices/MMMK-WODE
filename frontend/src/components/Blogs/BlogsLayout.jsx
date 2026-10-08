/* eslint-disable no-unused-vars */
import { Link } from 'react-router-dom';
import Banner from '../global/Banner';
import bg from '../../assets/bg.png';
import { FaCaretRight, FaSearch } from 'react-icons/fa';
import product1 from '../../assets/Home/pro1.png';
import product2 from '../../assets/Home/pro2.png';
import product3 from '../../assets/Home/pro3.png';
import product4 from '../../assets/Home/pro4.png';
import { useState } from 'react';

export default function BlogsLayout() {
  const articles = [
    {
      title: 'Perfumes',
      subtitle:
        'Explore the Best Fragrances for Every Occasion: Perfumes for You',
      description:
        'Discover a variety of perfumes for every mood and occasion, ranging from fresh floral notes to musky deep scents.',
      image: product1,
      category: 'PERFUMES',
      date: 'NOVEMBER 25, 2024',
    },
    {
      title: 'Swimwear',
      subtitle: 'Dive Into Style: Best Swimwear for the Summer',
      description:
        "Whether you're hitting the beach or the pool, find the best swimwear styles that combine comfort and style.",
      image: product2,
      category: 'SWIMWEAR',
      date: 'NOVEMBER 25, 2024',
    },
    {
      title: 'Jewelry',
      subtitle:
        'Sparkle and Shine: Must-Have Jewelry Pieces for Every Wardrobe',
      description:
        'Jewelry is the perfect finishing touch to any outfit. Explore the best pieces to complement your unique style.',
      image: product3,
      category: 'JEWELRY',
      date: 'NOVEMBER 25, 2024',
    },
    {
      title: 'Sandals',
      subtitle: 'Step Into Comfort: The Best Sandals for Summer Adventures',
      description:
        'From casual to chic, discover the best sandals for all your outdoor activities and sunny days.',
      image: product4,
      category: 'SANDALS',
      date: 'NOVEMBER 25, 2024',
    },
    {
      title: 'Dresses',
      subtitle: 'Elegant and Versatile: Dresses for Every Occasion',
      description:
        'Dresses are a wardrobe essential. Explore styles that fit every occasion from casual to formal events.',
      image: product1,
      category: 'DRESSES',
      date: 'NOVEMBER 25, 2024',
    },
    {
      title: 'Fitness & Yoga',
      subtitle: 'Fitness & Yoga: Achieve Balance and Wellness with These Tips',
      description:
        'Improve your flexibility, strength, and overall health with a mix of yoga practices and fitness routines.',
      image: product2,
      category: 'FITNESS & YOGA',
      date: 'NOVEMBER 25, 2024',
    },
  ];

  // Pagination logic
  const itemsPerPage = 4;
  const totalPages = Math.ceil(articles.length / itemsPerPage);

  const [currentPage, setCurrentPage] = useState(1);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const currentArticles = articles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  return (
    <div className="w-full">
      <Banner bg={bg}>
        <div className="container px-4 py-8 mx-auto">
          <div className="flex flex-wrap items-center justify-center w-full px-4 py-6 border-t border-b md:mt-12 sm:py-8 md:py-1 sm:px-10 md:px-20">
            <button className="px-4 py-1 text-3xl font-semibold text-white duration-300 sm:px-5 md:px-6 sm:py-2">
              Blogs
            </button>
          </div>
          <div className="grid grid-cols-1 gap-8 py-12 px-36 lg:grid-cols-12">
            {/* Main Content */}
            <main className="lg:col-span-9 sm:col-span-12">
              <div className="grid gap-8 md:grid-cols-2 sm:grid-cols-1">
                {articles.map((article, index) => (
                  <article key={index} className="space-y-4">
                    <div className="relative">
                      <span className="absolute top-4 left-4 bg-[#E85C2C] text-white px-4 py-2 rounded-md text-sm font-medium z-10">
                        {article.category}
                      </span>
                      <img
                        src={article.image}
                        alt={article.title}
                        width={600}
                        height={400}
                        className="object-contain w-full md:h-[300px] rounded-lg"
                      />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold hover:text-[#E85C2C] transition-colors">
                        <Link to="#">{article.subtitle}</Link>
                      </h2>
                      <p className="text-gray-600">{article.description}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span className="font-medium"> MMMK</span>
                        <span>—</span>
                        <span>{article.date}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              {/* Pagination */}
              <div className="flex justify-center mt-8 space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-1 text-white bg-gray-500 hover:bg-gray-600"
                >
                  Previous
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index}
                    onClick={() => handlePageChange(index + 1)}
                    className={`px-3 py-1 border border-gray-950 ${
                      currentPage === index + 1
                        ? 'bg-[#E85C2C] text-white'
                        : 'bg-gray-300 text-black'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-1 text-white bg-gray-500 hover:bg-gray-600"
                >
                  Next
                </button>
              </div>
            </main>

            {/* Sidebar */}
            <aside className="px-4 space-y-8 lg:col-span-3 sm:col-span-12">
              {/* Search Section */}
              <div className="px-2 py-2 space-y-4 border border-gray-700 rounded-sm">
                <h2 className="text-xl font-bold">SEARCH</h2>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="search"
                      placeholder="Search ..."
                      className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-md"
                    />
                    <FaSearch className="absolute text-gray-500 transform -translate-y-1/2 right-3 top-1/2" />
                  </div>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="px-2 py-2 space-y-4 border border-gray-700 rounded-sm">
                <h2 className="px-2 text-xl font-bold">RECENT POSTS</h2>
                <div className="space-y-4">
                  {/* Multiple Posts */}
                  {[
                    {
                      title:
                        'The Ultimate Solution for Heavy-Duty Projects: Excavators and Long Boom Excavators',
                      description:
                        'At Kasturi Earthmovers, we offer the best heavy-duty construction solutions for excavation, demolition, and land development.',
                      imageUrl:
                        'https://bellavitaluxury.co.in/cdn/shop/files/1_402bde70-7bac-4e1f-a698-a374f6d5f12a.jpg?v=1714555988&width=750',
                      PostAt: '25 November 2024',
                      link: '#',
                    },
                    {
                      title:
                        'How to Choose the Right Excavator for Your Construction Project',
                      description:
                        'Choosing the right excavator can make a difference in efficiency and cost-effectiveness for your next construction project.',
                      imageUrl:
                        'https://bellavitaluxury.co.in/cdn/shop/files/1_402bde70-7bac-4e1f-a698-a374f6d5f12a.jpg?v=1714555988&width=750',
                      PostAt: '2 October 2024',
                      link: '#',
                    },
                    {
                      title:
                        'Why Long Boom Excavators Are the Future of Demolition',
                      description:
                        'Long boom excavators offer enhanced precision and reach, making them essential for large-scale demolition tasks.',
                      imageUrl:
                        'https://bellavitaluxury.co.in/cdn/shop/files/1_402bde70-7bac-4e1f-a698-a374f6d5f12a.jpg?v=1714555988&width=750',
                      PostAt: '07 July 2024',
                      link: '#',
                    },
                  ].map((post, index) => (
                    <article
                      key={index}
                      className="flex flex-col gap-4 p-4 transition duration-200 "
                    >
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        width={100}
                        height={100}
                        className="object-cover rounded-lg"
                      />
                      <div className="flex flex-col">
                        <h3 className="text-sm font-medium hover:text-[#E85C2C] transition-colors">
                          <Link to={post.link}>{post.title}</Link>
                        </h3>
                        <p className="text-xs text-gray-600">
                          {post.description}
                        </p>
                        <h2 className="text-base ">{post.PostAt}</h2>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
              {/* Categories */}
              <div className="px-2 py-2 space-y-4 border border-gray-700 rounded-sm">
                <h2 className="text-xl font-bold">CATEGORY</h2>
                <div className="space-y-4">
                  {/* Category Items */}
                  <article className="flex flex-col gap-4">
                    {[
                      'Perfumes',
                      'Swimwear',
                      'Jewelry',
                      'Sandals',
                      'Dresses',
                      'Fitness & Yoga',
                    ].map((category, index) => (
                      <div
                        key={index}
                        className="flex items-center transition duration-200 rounded-md "
                      >
                        <FaCaretRight className="w-5 h-5 text-gray-600" />
                        <h3 className="text-base font-medium  hover:text-[#E85C2C] transition-colors">
                          <Link to="#">{category}</Link>
                        </h3>
                      </div>
                    ))}
                  </article>
                </div>
              </div>
              {/* Archives */}
              <div className="px-2 py-2 space-y-4 border border-gray-700 rounded-sm">
                <h2 className="px-2 text-xl font-bold">ARCHIVES</h2>
                <div className="space-y-4">
                  {/* Archive Items */}
                  <article className="flex flex-col gap-4">
                    {[
                      'November 2024',
                      'October 2024',
                      'September 2024',
                      'August 2024',
                      'July 2024',
                      'November 2024',
                      'October 2024',
                      'September 2024',
                      'August 2024',
                      'July 2024',
                    ].map((month, index) => (
                      <div
                        key={index}
                        className="flex items-center transition duration-200 rounded-md "
                      >
                        <FaCaretRight className="w-5 h-5 text-gray-600" />
                        <h3 className="text-base font-medium gap-2 hover:text-[#E85C2C] transition-colors">
                          <Link to="#">{month}</Link>
                        </h3>
                      </div>
                    ))}
                  </article>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </Banner>
    </div>
  );
}
