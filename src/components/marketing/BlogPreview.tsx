import Link from 'next/link';
import { getFeaturedPosts } from '@/data/blogPosts';

export default function BlogPreview() {
  const featuredPosts = getFeaturedPosts();

  return (
    <section id="blog" className="py-20 bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-harvest-dark mb-4">Latest from the Farm</h2>
          <p className="text-xl text-gray-600">Tips, strategies, and insights for growing specialty crops profitably</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {featuredPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition transform hover:scale-105">
              <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${post.image})` }} />
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold uppercase text-harvest-green bg-harvest-light px-3 py-1 rounded">{post.category}</span>
                  <span className="text-sm text-gray-500">{post.date}</span>
                </div>
                <h3 className="text-xl font-bold text-harvest-dark mb-3">{post.title}</h3>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <p className="font-semibold text-gray-700 mb-1">By {post.author}</p>
                    <p>{post.readTime} min read</p>
                  </div>
                  <Link href={`/blog/${post.slug}`} className="text-harvest-green font-semibold hover:underline">Read →</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="text-center">
          <Link href="/blog" className="inline-block px-8 py-3 border-2 border-harvest-green text-harvest-green rounded-lg hover:bg-harvest-light transition font-semibold">
            View All Articles
          </Link>
        </div>
      </div>
    </section>
  );
}
