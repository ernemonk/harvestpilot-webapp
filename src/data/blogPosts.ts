export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  image: string;
  readTime: number;
  featured: boolean;
}

export const blogPosts: BlogPost[] = [
  {
    id: '1', slug: 'increase-microgreens-yield',
    title: 'How to Increase Microgreens Yield by 40%',
    excerpt: 'Learn the proven strategies our top farmers use to maximize their microgreens production without increasing labor costs.',
    content: `# How to Increase Microgreens Yield by 40%\n\nMicrogreens have become increasingly popular among specialty crop farmers due to their high profit margins and quick turnaround time.\n\n## The Key Factors for Higher Yields\n\n### 1. Seed Selection and Quality\nThe foundation of a successful microgreens harvest starts with selecting high-quality seeds.\n\n- Use seeds with 90%+ germination rates\n- Source from reputable suppliers\n- Test germination before large-scale planting\n\n### 2. Optimal Growing Conditions\n**Temperature**: Maintain 65-75°F for best growth\n**Humidity**: Keep between 50-70%\n**Light**: 12-16 hours of quality lighting daily\n\n### 3. Watering Strategy\n- Bottom water seedlings to prevent mold\n- Water in early morning\n- Use filtered water\n\n## Real-World Results\nOur users report 40% yield increases, 25% fewer crop failures, and faster turnaround times.\n\n---\n\n*Sarah Chen is a certified micro-farming specialist with 8+ years of experience.*`,
    author: 'Sarah Chen', date: 'Mar 15, 2024', category: 'Growing Tips',
    image: 'https://images.unsplash.com/photo-1464226184081-280282c6e601?w=600&h=400&fit=crop',
    readTime: 8, featured: true,
  },
  {
    id: '2', slug: 'crop-rotation-guide',
    title: 'Understanding Crop Rotation for Small Farms',
    excerpt: 'Discover how to implement crop rotation on your 3-5 acre farm to improve soil health and profitability.',
    content: `# Understanding Crop Rotation for Small Farms\n\nCrop rotation is one of the oldest and most effective agricultural practices.\n\n## Why Crop Rotation Matters\n- Breaks pest and disease cycles\n- Improves soil structure\n- Reduces nutrient depletion\n\n## The 3-Year Rotation System\n**Year 1**: Nitrogen-hungry crops (leafy greens, brassicas)\n**Year 2**: Fruiting crops (tomatoes, peppers)\n**Year 3**: Legumes (peas, beans) to restore nitrogen\n\n---\n\n*Mike Johnson manages a 5-acre certified organic farm.*`,
    author: 'Mike Johnson', date: 'Mar 12, 2024', category: 'Farm Management',
    image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop',
    readTime: 10, featured: true,
  },
  {
    id: '3', slug: 'farm-budgeting-guide',
    title: 'The Ultimate Guide to Farm Budgeting',
    excerpt: 'Master your farm finances with our comprehensive guide to crop budgeting, pricing strategy, and profitability analysis.',
    content: `# The Ultimate Guide to Farm Budgeting\n\nFinancial management is just as important as agronomic practices.\n\n## Essential Budget Categories\n- Seeds and seedlings\n- Fertilizers and amendments\n- Labor for specific crops\n- Equipment maintenance\n- Utilities and insurance\n\n## Price Strategy\n### Wholesale: 40-50% of retail, higher volume\n### Direct-to-Consumer: 60-70% margins, lower volume\n\n---\n\n*Emma Rodriguez is a farm business consultant.*`,
    author: 'Emma Rodriguez', date: 'Mar 8, 2024', category: 'Business',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
    readTime: 12, featured: true,
  },
  {
    id: '4', slug: 'pest-management-organic',
    title: 'Organic Pest Management Strategies',
    excerpt: 'Effective techniques for managing common pests without synthetic chemicals.',
    content: `# Organic Pest Management Strategies\n\nOrganic pest management requires creating an ecosystem where pests are managed naturally.\n\n## Integrated Pest Management (IPM)\n1. Prevention\n2. Monitoring\n3. Intervention\n4. Evaluation\n\n## Organic Approved Interventions\n- Neem oil for aphids\n- Spinosad for caterpillars\n- Bacillus thuringiensis (Bt)\n\n---\n\n*Dr. James Patterson is an organic agriculture specialist.*`,
    author: 'Dr. James Patterson', date: 'Mar 5, 2024', category: 'Growing Tips',
    image: 'https://images.unsplash.com/photo-1500382017468-7049fae79ead?w=600&h=400&fit=crop',
    readTime: 9, featured: false,
  },
  {
    id: '5', slug: 'market-trends-specialty-crops',
    title: '2024 Market Trends in Specialty Crops',
    excerpt: 'Analysis of current market demand, pricing trends, and opportunities for specialty crop farmers.',
    content: `# 2024 Market Trends in Specialty Crops\n\n## Demand Trends\n- Microgreens: +25% YoY\n- Heirloom vegetables: +18% YoY\n- Organic produce: Steady growth\n\n## Strategic Opportunities\n1. Diversification\n2. Direct sales\n3. Certification\n4. Value-added products\n\n---\n\n*Lisa Wang is a market research analyst.*`,
    author: 'Lisa Wang', date: 'Mar 1, 2024', category: 'Business',
    image: 'https://images.unsplash.com/photo-1488459716781-6f3ee1fe3e22?w=600&h=400&fit=crop',
    readTime: 7, featured: false,
  },
  {
    id: '6', slug: 'season-planning-timeline',
    title: 'The Complete Season Planning Timeline',
    excerpt: 'A month-by-month guide to planning and executing a successful growing season.',
    content: `# The Complete Season Planning Timeline\n\n## Pre-Season (January - February)\n- Review previous year's records\n- Plan crop rotations\n- Order seeds and supplies\n\n## Early Season (March - April)\n- Start seedlings\n- Prepare beds\n- Set up irrigation\n\n## Mid-Season (May - July)\n- Daily monitoring\n- Regular harvesting\n- Continuous planting\n\n## Post-Season (October - December)\n- Final harvests\n- Year-end analysis\n- Planning next year\n\n---\n\n*Robert Martinez is an agricultural extension agent.*`,
    author: 'Robert Martinez', date: 'Feb 28, 2024', category: 'Farm Management',
    image: 'https://images.unsplash.com/photo-1520763185298-1b434c919eba?w=600&h=400&fit=crop',
    readTime: 11, featured: false,
  },
];

export const getFeaturedPosts = () => blogPosts.filter(post => post.featured).slice(0, 3);
export const getPostBySlug = (slug: string) => blogPosts.find(post => post.slug === slug);
export const getPostsByCategory = (category: string) => blogPosts.filter(post => post.category === category);
export const getCategories = () => Array.from(new Set(blogPosts.map(post => post.category)));
