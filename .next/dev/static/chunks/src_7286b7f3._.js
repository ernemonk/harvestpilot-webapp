(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/data/blogPosts.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "blogPosts",
    ()=>blogPosts,
    "getCategories",
    ()=>getCategories,
    "getFeaturedPosts",
    ()=>getFeaturedPosts,
    "getPostBySlug",
    ()=>getPostBySlug,
    "getPostsByCategory",
    ()=>getPostsByCategory
]);
const blogPosts = [
    {
        id: '1',
        slug: 'increase-microgreens-yield',
        title: 'How to Increase Microgreens Yield by 40%',
        excerpt: 'Learn the proven strategies our top farmers use to maximize their microgreens production without increasing labor costs.',
        content: `# How to Increase Microgreens Yield by 40%\n\nMicrogreens have become increasingly popular among specialty crop farmers due to their high profit margins and quick turnaround time.\n\n## The Key Factors for Higher Yields\n\n### 1. Seed Selection and Quality\nThe foundation of a successful microgreens harvest starts with selecting high-quality seeds.\n\n- Use seeds with 90%+ germination rates\n- Source from reputable suppliers\n- Test germination before large-scale planting\n\n### 2. Optimal Growing Conditions\n**Temperature**: Maintain 65-75°F for best growth\n**Humidity**: Keep between 50-70%\n**Light**: 12-16 hours of quality lighting daily\n\n### 3. Watering Strategy\n- Bottom water seedlings to prevent mold\n- Water in early morning\n- Use filtered water\n\n## Real-World Results\nOur users report 40% yield increases, 25% fewer crop failures, and faster turnaround times.\n\n---\n\n*Sarah Chen is a certified micro-farming specialist with 8+ years of experience.*`,
        author: 'Sarah Chen',
        date: 'Mar 15, 2024',
        category: 'Growing Tips',
        image: 'https://images.unsplash.com/photo-1464226184081-280282c6e601?w=600&h=400&fit=crop',
        readTime: 8,
        featured: true
    },
    {
        id: '2',
        slug: 'crop-rotation-guide',
        title: 'Understanding Crop Rotation for Small Farms',
        excerpt: 'Discover how to implement crop rotation on your 3-5 acre farm to improve soil health and profitability.',
        content: `# Understanding Crop Rotation for Small Farms\n\nCrop rotation is one of the oldest and most effective agricultural practices.\n\n## Why Crop Rotation Matters\n- Breaks pest and disease cycles\n- Improves soil structure\n- Reduces nutrient depletion\n\n## The 3-Year Rotation System\n**Year 1**: Nitrogen-hungry crops (leafy greens, brassicas)\n**Year 2**: Fruiting crops (tomatoes, peppers)\n**Year 3**: Legumes (peas, beans) to restore nitrogen\n\n---\n\n*Mike Johnson manages a 5-acre certified organic farm.*`,
        author: 'Mike Johnson',
        date: 'Mar 12, 2024',
        category: 'Farm Management',
        image: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop',
        readTime: 10,
        featured: true
    },
    {
        id: '3',
        slug: 'farm-budgeting-guide',
        title: 'The Ultimate Guide to Farm Budgeting',
        excerpt: 'Master your farm finances with our comprehensive guide to crop budgeting, pricing strategy, and profitability analysis.',
        content: `# The Ultimate Guide to Farm Budgeting\n\nFinancial management is just as important as agronomic practices.\n\n## Essential Budget Categories\n- Seeds and seedlings\n- Fertilizers and amendments\n- Labor for specific crops\n- Equipment maintenance\n- Utilities and insurance\n\n## Price Strategy\n### Wholesale: 40-50% of retail, higher volume\n### Direct-to-Consumer: 60-70% margins, lower volume\n\n---\n\n*Emma Rodriguez is a farm business consultant.*`,
        author: 'Emma Rodriguez',
        date: 'Mar 8, 2024',
        category: 'Business',
        image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop',
        readTime: 12,
        featured: true
    },
    {
        id: '4',
        slug: 'pest-management-organic',
        title: 'Organic Pest Management Strategies',
        excerpt: 'Effective techniques for managing common pests without synthetic chemicals.',
        content: `# Organic Pest Management Strategies\n\nOrganic pest management requires creating an ecosystem where pests are managed naturally.\n\n## Integrated Pest Management (IPM)\n1. Prevention\n2. Monitoring\n3. Intervention\n4. Evaluation\n\n## Organic Approved Interventions\n- Neem oil for aphids\n- Spinosad for caterpillars\n- Bacillus thuringiensis (Bt)\n\n---\n\n*Dr. James Patterson is an organic agriculture specialist.*`,
        author: 'Dr. James Patterson',
        date: 'Mar 5, 2024',
        category: 'Growing Tips',
        image: 'https://images.unsplash.com/photo-1500382017468-7049fae79ead?w=600&h=400&fit=crop',
        readTime: 9,
        featured: false
    },
    {
        id: '5',
        slug: 'market-trends-specialty-crops',
        title: '2024 Market Trends in Specialty Crops',
        excerpt: 'Analysis of current market demand, pricing trends, and opportunities for specialty crop farmers.',
        content: `# 2024 Market Trends in Specialty Crops\n\n## Demand Trends\n- Microgreens: +25% YoY\n- Heirloom vegetables: +18% YoY\n- Organic produce: Steady growth\n\n## Strategic Opportunities\n1. Diversification\n2. Direct sales\n3. Certification\n4. Value-added products\n\n---\n\n*Lisa Wang is a market research analyst.*`,
        author: 'Lisa Wang',
        date: 'Mar 1, 2024',
        category: 'Business',
        image: 'https://images.unsplash.com/photo-1488459716781-6f3ee1fe3e22?w=600&h=400&fit=crop',
        readTime: 7,
        featured: false
    },
    {
        id: '6',
        slug: 'season-planning-timeline',
        title: 'The Complete Season Planning Timeline',
        excerpt: 'A month-by-month guide to planning and executing a successful growing season.',
        content: `# The Complete Season Planning Timeline\n\n## Pre-Season (January - February)\n- Review previous year's records\n- Plan crop rotations\n- Order seeds and supplies\n\n## Early Season (March - April)\n- Start seedlings\n- Prepare beds\n- Set up irrigation\n\n## Mid-Season (May - July)\n- Daily monitoring\n- Regular harvesting\n- Continuous planting\n\n## Post-Season (October - December)\n- Final harvests\n- Year-end analysis\n- Planning next year\n\n---\n\n*Robert Martinez is an agricultural extension agent.*`,
        author: 'Robert Martinez',
        date: 'Feb 28, 2024',
        category: 'Farm Management',
        image: 'https://images.unsplash.com/photo-1520763185298-1b434c919eba?w=600&h=400&fit=crop',
        readTime: 11,
        featured: false
    }
];
const getFeaturedPosts = ()=>blogPosts.filter((post)=>post.featured).slice(0, 3);
const getPostBySlug = (slug)=>blogPosts.find((post)=>post.slug === slug);
const getPostsByCategory = (category)=>blogPosts.filter((post)=>post.category === category);
const getCategories = ()=>Array.from(new Set(blogPosts.map((post)=>post.category)));
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/(marketing)/blog/page.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>BlogPage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$blogPosts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/blogPosts.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function BlogPage() {
    _s();
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [selectedCategory, setSelectedCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('All');
    const categories = [
        'All',
        ...(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$blogPosts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getCategories"])()
    ];
    const filtered = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$blogPosts$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["blogPosts"].filter((post)=>{
        const matchesSearch = post.title.toLowerCase().includes(search.toLowerCase()) || post.excerpt.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "py-24 sm:py-32",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "text-center mb-12",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                            className: "text-4xl font-bold text-gray-900 mb-4",
                            children: "Farm Intelligence Blog"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                            lineNumber: 25,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-lg text-gray-600 max-w-2xl mx-auto",
                            children: "Expert tips, guides, and insights to help you grow smarter."
                        }, void 0, false, {
                            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                            lineNumber: 26,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                    lineNumber: 24,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex flex-col sm:flex-row gap-4 mb-10 max-w-2xl mx-auto",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            type: "text",
                            placeholder: "Search articles…",
                            value: search,
                            onChange: (e)=>setSearch(e.target.value),
                            className: "flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 outline-none"
                        }, void 0, false, {
                            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex gap-2 flex-wrap justify-center",
                            children: categories.map((cat)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    onClick: ()=>setSelectedCategory(cat),
                                    className: `px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`,
                                    children: cat
                                }, cat, false, {
                                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                    lineNumber: 42,
                                    columnNumber: 15
                                }, this))
                        }, void 0, false, {
                            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                    lineNumber: 32,
                    columnNumber: 9
                }, this),
                filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-center text-gray-500 py-12",
                    children: "No articles found."
                }, void 0, false, {
                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                    lineNumber: 59,
                    columnNumber: 11
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid md:grid-cols-2 lg:grid-cols-3 gap-8",
                    children: filtered.map((post)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: `/blog/${post.slug}`,
                            className: "group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative h-48 overflow-hidden",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        src: post.image,
                                        alt: post.title,
                                        fill: true,
                                        className: "object-cover group-hover:scale-105 transition-transform duration-300"
                                    }, void 0, false, {
                                        fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                        lineNumber: 69,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                    lineNumber: 68,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "p-6",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full",
                                            children: post.category
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                            lineNumber: 77,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "mt-3 text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors",
                                            children: post.title
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                            lineNumber: 80,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "mt-2 text-sm text-gray-600 line-clamp-2",
                                            children: post.excerpt
                                        }, void 0, false, {
                                            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                            lineNumber: 83,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "mt-4 flex items-center text-xs text-gray-400",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: post.author
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                                    lineNumber: 85,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "mx-2",
                                                    children: "·"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                                    lineNumber: 86,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: post.date
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                                    lineNumber: 87,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "mx-2",
                                                    children: "·"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                                    lineNumber: 88,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        post.readTime,
                                                        " min read"
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                                    lineNumber: 89,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                            lineNumber: 84,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                                    lineNumber: 76,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, post.id, true, {
                            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                            lineNumber: 63,
                            columnNumber: 15
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/src/app/(marketing)/blog/page.tsx",
                    lineNumber: 61,
                    columnNumber: 11
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/app/(marketing)/blog/page.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/(marketing)/blog/page.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
_s(BlogPage, "oJ6DiQWKfLBPOd6yDjfOBOczTuI=");
_c = BlogPage;
var _c;
__turbopack_context__.k.register(_c, "BlogPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_7286b7f3._.js.map