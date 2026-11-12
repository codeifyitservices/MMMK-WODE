import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import bgImg from '../assets/bg.png';
import NewsLetter from '../components/global/NewsLetter';
import PageNotFound from '../layout/PageNotFound';
import { applyPageSeo, removeJsonLd } from '../utils/seoHelper';

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export default function CustomStaticPage({ fallbackSlug }) {
  const params = useParams();
  const rawSlug = fallbackSlug || params.slug;
  const cleanSlug = String(rawSlug || '')
    .trim()
    .toLowerCase()
    .replace(/^\/+/, '');

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!cleanSlug) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setNotFound(false);

    fetch(`${BACKEND_URL}/api/v1/pages/slug/${encodeURIComponent(cleanSlug)}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('Page not found');
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          if (data?.success && data?.page) {
            setPage(data.page);

            // Apply dynamic SEO and JSON-LD schema
            applyPageSeo({
              title: data.page.metaTitle || `${data.page.title} | MMMK WODE`,
              description: data.page.metaDescription,
              keywords: data.page.metaKeywords,
              canonicalUrl: data.page.canonicalUrl,
              ogTitle: data.page.ogTitle || data.page.metaTitle || data.page.title,
              ogDescription: data.page.ogDescription || data.page.metaDescription,
              ogImage: data.page.ogImage,
              schema: data.page.seoSchema,
            });
          } else {
            setNotFound(true);
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
      removeJsonLd('mmmk-page-schema');
    };
  }, [cleanSlug]);

  if (loading) {
    return (
      <div
        className="relative pt-28 min-h-[60vh] flex items-center justify-center"
        style={{
          backgroundImage: `url(${bgImg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 text-center text-white space-y-3">
          <div className="inline-block w-8 h-8 border-2 border-white/20 border-t-[#dfba73] rounded-full animate-spin" />
          <p className="text-xs uppercase tracking-widest text-white/60">Loading Page...</p>
        </div>
      </div>
    );
  }

  if (notFound || !page) {
    return <PageNotFound />;
  }

  return (
    <div
      className="relative pt-28"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <main className="relative z-10 px-5 py-14 text-white md:px-20 md:py-20">
        <div className="mx-auto max-w-4xl">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50 mb-4">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-[#dfba73]">{page.title}</span>
          </nav>

          {/* Page Title */}
          <h1 className="text-3xl font-semibold md:text-5xl tracking-tight text-white mb-8 border-b border-white/10 pb-6">
            {page.title}
          </h1>

          {/* Rich Content Area */}
          <div
            className="ck-content text-base leading-relaxed text-white/85 space-y-4 max-w-none"
            dangerouslySetInnerHTML={{ __html: page.content || '' }}
          />
        </div>
      </main>

      <NewsLetter />
    </div>
  );
}

