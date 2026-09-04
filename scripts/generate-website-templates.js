// Generates a working set of Website Builder templates per category, combining
// 3 color palettes x the 6 fetched background photos per category (cycling 3
// content variants for text variety) = 18 templates/category, 108 total.
// Each template is a section-based page (see js/render-website.js) rather than
// a canvas graphic. Usage: node scripts/generate-website-templates.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname + "/..";
const CATEGORIES = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "website-categories.json"), "utf8"));
const BACKGROUNDS = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "website-backgrounds.json"), "utf8"));

const PALETTE_SETS = {
  business: [
    { primary: "#D9A441", secondary: "#FFFFFF", accent: "#0B1A2E", bg: "#0B1A2E", font: "Poppins" },
    { primary: "#2EA8FF", secondary: "#FFFFFF", accent: "#0B2A5B", bg: "#0B2A5B", font: "Inter" },
    { primary: "#34D399", secondary: "#FFFFFF", accent: "#073B32", bg: "#073B32", font: "Montserrat" },
  ],
  portfolio: [
    { primary: "#FF6FA5", secondary: "#FFFFFF", accent: "#1B0942", bg: "#1B0942", font: "Playfair Display" },
    { primary: "#F2C230", secondary: "#FFFFFF", accent: "#111111", bg: "#111111", font: "Montserrat" },
    { primary: "#A855F7", secondary: "#FFFFFF", accent: "#1E0A38", bg: "#1E0A38", font: "Poppins" },
  ],
  "online-store": [
    { primary: "#F5A9B8", secondary: "#FFFFFF", accent: "#3A1826", bg: "#3A1826", font: "Poppins" },
    { primary: "#14D6D6", secondary: "#FFFFFF", accent: "#041F1F", bg: "#041F1F", font: "Inter" },
    { primary: "#FF7A45", secondary: "#FFFFFF", accent: "#331100", bg: "#331100", font: "Montserrat" },
  ],
  personal: [
    { primary: "#C97B3D", secondary: "#FFFFFF", accent: "#241209", bg: "#241209", font: "Playfair Display" },
    { primary: "#6FAE8C", secondary: "#FFFFFF", accent: "#122019", bg: "#122019", font: "Roboto Slab" },
    { primary: "#B0B8C1", secondary: "#FFFFFF", accent: "#10151C", bg: "#10151C", font: "Inter" },
  ],
  "landing-page": [
    { primary: "#6C5CE7", secondary: "#FFFFFF", accent: "#0F0B29", bg: "#0F0B29", font: "Poppins" },
    { primary: "#00C2CB", secondary: "#FFFFFF", accent: "#062B2D", bg: "#062B2D", font: "Montserrat" },
    { primary: "#FF4D8D", secondary: "#FFFFFF", accent: "#2B0617", bg: "#2B0617", font: "Inter" },
  ],
  restaurant: [
    { primary: "#E8A33D", secondary: "#FFFFFF", accent: "#2A1810", bg: "#2A1810", font: "Playfair Display" },
    { primary: "#C97B3D", secondary: "#FDF6EC", accent: "#241209", bg: "#241209", font: "Roboto Slab" },
    { primary: "#E64545", secondary: "#FFFFFF", accent: "#1A0E0A", bg: "#1A0E0A", font: "Playfair Display" },
  ],
};

const CONTENT = {
  business: [
    {
      brand: "APEX CONSULTING", links: ["Home", "About", "Services", "Work", "Contact"],
      hero: { eyebrow: "Business Consulting", heading: "Grow Your Business With Confidence", sub: "Strategic consulting and hands-on support to help your company scale sustainably.", cta: "Book a Consultation" },
      about: { eyebrow: "Who We Are", heading: "15 Years of Helping Businesses Succeed", body: "We partner with founders and leadership teams to solve their toughest operational and growth challenges." },
      features: { eyebrow: "What We Do", heading: "Our Services", items: [{ icon: "📈", title: "Growth Strategy", text: "Data-driven plans to scale revenue and market share." }, { icon: "🤝", title: "Operations Consulting", text: "Streamline workflows and reduce operational costs." }, { icon: "💡", title: "Business Advisory", text: "Expert guidance for critical business decisions." }] },
      showcase: { eyebrow: "Our Work", heading: "Recent Projects", items: [{ title: "Retail Expansion", subtitle: "Helped a regional retailer expand to 12 new markets." }, { title: "Process Overhaul", subtitle: "Cut operational costs by 30% for a logistics firm." }, { title: "Brand Relaunch", subtitle: "Repositioned a legacy brand for a new generation." }] },
      testimonials: [{ quote: "They transformed how we operate.", name: "Sarah Klein", role: "CEO, Northgate Retail" }, { quote: "Incredible strategic insight.", name: "James Wu", role: "Founder, Wu Logistics" }, { quote: "Worth every dollar.", name: "Maria Torres", role: "COO, Torres Group" }],
      contact: { address: "123 Business Ave, Suite 400", phone: "+1 123 456 7890", email: "hello@yourcompany.com" },
      footer: "All rights reserved.",
    },
    {
      brand: "STERLING PARTNERS", links: ["Home", "About", "Services", "Clients", "Contact"],
      hero: { eyebrow: "Management Consulting", heading: "Smarter Decisions. Stronger Growth.", sub: "We help ambitious companies navigate change and build lasting competitive advantage.", cta: "Start a Project" },
      about: { eyebrow: "Our Story", heading: "Built By Operators, For Operators", body: "Our team has run and scaled companies ourselves — we bring real operating experience, not just frameworks." },
      features: { eyebrow: "Capabilities", heading: "How We Help", items: [{ icon: "🎯", title: "Strategy & Planning", text: "Clear roadmaps built around your goals and market." }, { icon: "⚙️", title: "Execution Support", text: "Hands-on help turning plans into measurable results." }, { icon: "📊", title: "Performance Analytics", text: "Track what matters and course-correct fast." }] },
      showcase: { eyebrow: "Case Studies", heading: "Client Results", items: [{ title: "Series B Readiness", subtitle: "Prepared a SaaS company for a $40M raise." }, { title: "Market Entry", subtitle: "Launched a new product line in 3 new regions." }, { title: "Turnaround", subtitle: "Returned a struggling division to profitability." }] },
      testimonials: [{ quote: "Sterling gave us clarity when we needed it most.", name: "David Chen", role: "CEO, Northbridge" }, { quote: "A true extension of our team.", name: "Priya Anand", role: "VP Ops, Fieldstone" }, { quote: "Results-focused from day one.", name: "Tom Reilly", role: "Founder, Reilly & Co." }],
      contact: { address: "88 Market Street, Floor 12", phone: "+1 212 555 0148", email: "contact@sterlingpartners.com" },
      footer: "All rights reserved.",
    },
    {
      brand: "NORTHGATE ADVISORS", links: ["Home", "About", "Services", "Insights", "Contact"],
      hero: { eyebrow: "Corporate Advisory", heading: "Your Partner In Sustainable Growth", sub: "From strategy to execution, we help businesses build for the long term.", cta: "Get In Touch" },
      about: { eyebrow: "Why Northgate", heading: "Experience Across Every Stage of Growth", body: "We've guided startups through Series A and helped enterprises modernize decades-old operations." },
      features: { eyebrow: "Our Focus", heading: "Where We Add Value", items: [{ icon: "🧭", title: "Strategic Direction", text: "Align your team around a clear, actionable vision." }, { icon: "🔧", title: "Operational Excellence", text: "Remove friction and improve efficiency at scale." }, { icon: "💬", title: "Leadership Coaching", text: "Develop the leaders your growth demands." }] },
      showcase: { eyebrow: "Track Record", heading: "Featured Engagements", items: [{ title: "Supply Chain Redesign", subtitle: "Reduced delivery times by 40% for a manufacturer." }, { title: "Merger Integration", subtitle: "Unified two companies into one operating model." }, { title: "Digital Transformation", subtitle: "Modernized legacy systems for a 200-person firm." }] },
      testimonials: [{ quote: "Northgate consistently delivers.", name: "Elena Marsh", role: "COO, Bright Manufacturing" }, { quote: "Strategic partners in every sense.", name: "Ravi Shah", role: "CEO, Shah Holdings" }, { quote: "They just get it done.", name: "Lucy Bennett", role: "Founder, Bennett & Co." }],
      contact: { address: "500 Corporate Drive", phone: "+1 415 555 0199", email: "info@northgateadvisors.com" },
      footer: "All rights reserved.",
    },
  ],
  portfolio: [
    {
      brand: "MAYA CROSS", links: ["Home", "Work", "About", "Contact"],
      hero: { eyebrow: "Visual Designer", heading: "I Design Brands People Remember", sub: "Freelance graphic & brand designer based in Austin, working with startups worldwide.", cta: "View My Work" },
      about: { eyebrow: "About Me", heading: "Hi, I'm Maya", body: "I'm a brand and visual designer with 8 years of experience helping startups tell their story through design." },
      features: { eyebrow: "Skills", heading: "What I Do", items: [{ icon: "🎨", title: "Brand Identity", text: "Logos, color systems and visual guidelines." }, { icon: "🖼️", title: "Print & Packaging", text: "Beautiful, tactile design for physical products." }, { icon: "📱", title: "Digital Design", text: "Websites and app interfaces that feel effortless." }] },
      showcase: { eyebrow: "Selected Work", heading: "Recent Projects", items: [{ title: "Fernweh Coffee Rebrand", subtitle: "Brand identity & packaging" }, { title: "Lumen App", subtitle: "Product design" }, { title: "Solstice Festival", subtitle: "Event branding" }] },
      testimonials: [{ quote: "Maya nailed our brand on the first try.", name: "Alex Rivera", role: "Founder, Fernweh" }, { quote: "A joy to work with, incredibly talented.", name: "Jenna Cole", role: "PM, Lumen" }, { quote: "Elevated our entire event.", name: "Sam Okafor", role: "Director, Solstice" }],
      contact: { address: "Austin, TX", phone: "+1 512 555 0132", email: "hello@mayacross.design" },
      footer: "All rights reserved.",
    },
    {
      brand: "STUDIO NINE", links: ["Home", "Portfolio", "Services", "Contact"],
      hero: { eyebrow: "Creative Studio", heading: "Design That Moves People", sub: "An independent creative studio crafting brands, campaigns and digital experiences.", cta: "See Our Work" },
      about: { eyebrow: "The Studio", heading: "Small Team, Big Ideas", body: "We're a tight-knit studio of designers and strategists who believe great work comes from real collaboration." },
      features: { eyebrow: "Services", heading: "What We Offer", items: [{ icon: "✏️", title: "Brand Strategy", text: "Positioning that sets you apart from day one." }, { icon: "🎬", title: "Art Direction", text: "Cohesive visual direction across every touchpoint." }, { icon: "💻", title: "Web Design", text: "Sites built to convert and built to last." }] },
      showcase: { eyebrow: "Case Studies", heading: "Featured Work", items: [{ title: "Nomad Coffee Co.", subtitle: "Full brand identity" }, { title: "Aster Skincare", subtitle: "Packaging & campaign" }, { title: "Verve Fitness", subtitle: "App & brand design" }] },
      testimonials: [{ quote: "Studio Nine exceeded every expectation.", name: "Nina Patel", role: "CMO, Aster" }, { quote: "True creative partners.", name: "Leo Grant", role: "Founder, Nomad Coffee" }, { quote: "Fast, sharp, and original.", name: "Dana Cruz", role: "Marketing Lead, Verve" }],
      contact: { address: "Brooklyn, NY", phone: "+1 718 555 0176", email: "studio@studionine.co" },
      footer: "All rights reserved.",
    },
    {
      brand: "ETHAN BLAKE", links: ["Home", "Work", "About", "Contact"],
      hero: { eyebrow: "Photographer & Director", heading: "Stories Told Through Light", sub: "Commercial and editorial photographer working with brands across fashion and lifestyle.", cta: "Explore Portfolio" },
      about: { eyebrow: "About", heading: "Behind the Lens", body: "For over a decade I've captured campaigns for brands who want their work to feel honest and alive." },
      features: { eyebrow: "Specialties", heading: "What I Shoot", items: [{ icon: "📷", title: "Editorial", text: "Story-driven imagery for magazines and campaigns." }, { icon: "🛍️", title: "Product & Lifestyle", text: "Clean, compelling visuals for brands and e-commerce." }, { icon: "🎞️", title: "Motion", text: "Short-form video and brand films." }] },
      showcase: { eyebrow: "Recent Work", heading: "Selected Shoots", items: [{ title: "Wildflower Editorial", subtitle: "Fashion campaign" }, { title: "Ember Coffee", subtitle: "Product photography" }, { title: "Coastal Living", subtitle: "Lifestyle series" }] },
      testimonials: [{ quote: "Ethan has an incredible eye.", name: "Chloe Reyes", role: "Creative Director, Wildflower" }, { quote: "Every shoot exceeds the brief.", name: "Marcus Lee", role: "Founder, Ember Coffee" }, { quote: "Simply the best in the business.", name: "Isla Moore", role: "Editor, Coastal Living" }],
      contact: { address: "Los Angeles, CA", phone: "+1 310 555 0184", email: "ethan@ethanblake.com" },
      footer: "All rights reserved.",
    },
  ],
  "online-store": [
    {
      brand: "LUNAR GOODS", links: ["Home", "Shop", "About", "Contact"],
      hero: { eyebrow: "New Season", heading: "Everyday Essentials, Elevated", sub: "Thoughtfully designed goods for a simpler, more beautiful everyday.", cta: "Shop Now" },
      about: { eyebrow: "Our Story", heading: "Made With Intention", body: "Lunar Goods creates timeless essentials using sustainable materials and honest craftsmanship." },
      features: { eyebrow: "Why Shop With Us", heading: "The Lunar Difference", items: [{ icon: "🌿", title: "Sustainably Made", text: "Responsibly sourced materials, always." }, { icon: "🚚", title: "Free Shipping", text: "On every order over $50, no exceptions." }, { icon: "↩️", title: "Easy Returns", text: "30-day hassle-free returns." }] },
      showcase: { eyebrow: "Shop", heading: "Best Sellers", variant: "products", items: [{ title: "Ceramic Mug Set", subtitle: "Set of 2", price: "$38" }, { title: "Linen Throw", subtitle: "Natural", price: "$64" }, { title: "Woven Basket", subtitle: "Medium", price: "$45" }] },
      testimonials: [{ quote: "Every piece feels special.", name: "Grace Kim", role: "Verified Buyer" }, { quote: "Shipping was fast, quality is amazing.", name: "Owen Clarke", role: "Verified Buyer" }, { quote: "My whole home is Lunar Goods now.", name: "Ana Silva", role: "Verified Buyer" }],
      contact: { address: "Ships worldwide", phone: "+1 800 555 0122", email: "support@lunargoods.com" },
      footer: "All rights reserved.",
    },
    {
      brand: "BLOOM & CO", links: ["Home", "Shop", "About", "Contact"],
      hero: { eyebrow: "Spring Collection", heading: "Beauty, Simplified", sub: "Clean, effective skincare made from ingredients you can actually pronounce.", cta: "Shop the Collection" },
      about: { eyebrow: "Our Mission", heading: "Skincare You Can Trust", body: "We formulate every product with dermatologists to be gentle, effective, and genuinely good for your skin." },
      features: { eyebrow: "Why Bloom", heading: "Clean By Design", items: [{ icon: "🧴", title: "Clean Formulas", text: "No parabens, sulfates or synthetic fragrance." }, { icon: "🐰", title: "Cruelty-Free", text: "Never tested on animals, ever." }, { icon: "♻️", title: "Recyclable Packaging", text: "Every bottle designed to be reused or recycled." }] },
      showcase: { eyebrow: "Shop", heading: "Customer Favorites", variant: "products", items: [{ title: "Hydrating Serum", subtitle: "30ml", price: "$42" }, { title: "Gentle Cleanser", subtitle: "150ml", price: "$28" }, { title: "Daily Moisturizer", subtitle: "50ml", price: "$36" }] },
      testimonials: [{ quote: "My skin has never looked better.", name: "Ruby Adams", role: "Verified Buyer" }, { quote: "Finally a brand that delivers.", name: "Mia Torres", role: "Verified Buyer" }, { quote: "Worth every penny.", name: "Sofia Reyes", role: "Verified Buyer" }],
      contact: { address: "Ships worldwide", phone: "+1 800 555 0147", email: "hello@bloomandco.com" },
      footer: "All rights reserved.",
    },
    {
      brand: "FIELDCRAFT", links: ["Home", "Shop", "About", "Contact"],
      hero: { eyebrow: "New Arrivals", heading: "Gear Built To Last", sub: "Durable outdoor essentials designed for everyday adventure.", cta: "Shop New Arrivals" },
      about: { eyebrow: "Our Craft", heading: "Built By People Who Use It", body: "Every product is tested by our own team on real trails before it ever reaches the shop." },
      features: { eyebrow: "Why Fieldcraft", heading: "Made To Last", items: [{ icon: "🏔️", title: "Field Tested", text: "Every product tested in real conditions." }, { icon: "🛡️", title: "Lifetime Warranty", text: "We stand behind everything we make." }, { icon: "🚚", title: "Fast Shipping", text: "Orders ship within 24 hours." }] },
      showcase: { eyebrow: "Shop", heading: "Top Picks", variant: "products", items: [{ title: "Trail Backpack", subtitle: "28L", price: "$120" }, { title: "Insulated Bottle", subtitle: "750ml", price: "$34" }, { title: "Camp Blanket", subtitle: "Wool blend", price: "$58" }] },
      testimonials: [{ quote: "This gear just works.", name: "Jack Turner", role: "Verified Buyer" }, { quote: "Quality is unmatched.", name: "Wyatt Ross", role: "Verified Buyer" }, { quote: "My go-to for every trip.", name: "Ella Brooks", role: "Verified Buyer" }],
      contact: { address: "Ships worldwide", phone: "+1 800 555 0165", email: "support@fieldcraft.com" },
      footer: "All rights reserved.",
    },
  ],
  personal: [
    {
      brand: "JORDAN LEE", links: ["Home", "About", "Blog", "Contact"],
      hero: { eyebrow: "Writer & Consultant", heading: "Hi, I'm Jordan.", sub: "I write about design, technology and building a thoughtful career.", cta: "Get In Touch" },
      about: { eyebrow: "About Me", heading: "A Little About Me", body: "I'm a product consultant and writer based in Seattle, sharing what I learn along the way." },
      features: { eyebrow: "What I Do", heading: "Where I Spend My Time", items: [{ icon: "✍️", title: "Writing", text: "Essays on design, work and life." }, { icon: "🎤", title: "Speaking", text: "Talks on product thinking and creative process." }, { icon: "💼", title: "Consulting", text: "Helping teams build better products." }] },
      showcase: { eyebrow: "Latest", heading: "Recent Posts", items: [{ title: "On Making Better Decisions", subtitle: "5 min read" }, { title: "The Case for Slow Work", subtitle: "7 min read" }, { title: "What I Learned This Year", subtitle: "4 min read" }] },
      testimonials: [{ quote: "Jordan's writing always makes me think.", name: "Reader", role: "Newsletter Subscriber" }, { quote: "Genuinely useful perspective.", name: "Reader", role: "Newsletter Subscriber" }, { quote: "One of my favorite follows.", name: "Reader", role: "Newsletter Subscriber" }],
      contact: { address: "Seattle, WA", phone: "+1 206 555 0113", email: "hi@jordanlee.com" },
      footer: "All rights reserved.",
    },
    {
      brand: "AVERY MORGAN", links: ["Home", "About", "Work", "Contact"],
      hero: { eyebrow: "Product Designer", heading: "I'm Avery — Nice To Meet You", sub: "Product designer focused on thoughtful, human-centered digital experiences.", cta: "Say Hello" },
      about: { eyebrow: "About", heading: "A Bit About Me", body: "I've spent the last 7 years designing products at startups, always chasing simple, honest design." },
      features: { eyebrow: "Focus Areas", heading: "What I Care About", items: [{ icon: "🎨", title: "Product Design", text: "End-to-end design for web and mobile apps." }, { icon: "🧩", title: "Design Systems", text: "Scalable systems that keep teams moving fast." }, { icon: "🗣️", title: "Mentorship", text: "Helping early-career designers grow." }] },
      showcase: { eyebrow: "Work", heading: "Selected Projects", items: [{ title: "Health App Redesign", subtitle: "Product design" }, { title: "Fintech Onboarding", subtitle: "UX research & design" }, { title: "Design System v2", subtitle: "Systems design" }] },
      testimonials: [{ quote: "Avery brings clarity to complex problems.", name: "Colleague", role: "Product Manager" }, { quote: "One of the best designers I've worked with.", name: "Colleague", role: "Engineering Lead" }, { quote: "A true craftsperson.", name: "Colleague", role: "Design Director" }],
      contact: { address: "Portland, OR", phone: "+1 503 555 0159", email: "avery@averymorgan.com" },
      footer: "All rights reserved.",
    },
    {
      brand: "RILEY CHEN", links: ["Home", "About", "Portfolio", "Contact"],
      hero: { eyebrow: "Freelance Illustrator", heading: "Hello, I'm Riley", sub: "Illustrator creating warm, playful artwork for brands and publications.", cta: "View My Work" },
      about: { eyebrow: "My Story", heading: "About Me", body: "I've been drawing since I could hold a pencil — now I get to do it for a living, working with clients worldwide." },
      features: { eyebrow: "What I Offer", heading: "Services", items: [{ icon: "🖊️", title: "Editorial Illustration", text: "Artwork for magazines, books and articles." }, { icon: "🎁", title: "Brand Illustration", text: "Custom illustration for brand campaigns." }, { icon: "🐾", title: "Pet Portraits", text: "Custom hand-drawn portraits of your pet." }] },
      showcase: { eyebrow: "Portfolio", heading: "Recent Work", items: [{ title: "Wildwood Magazine", subtitle: "Editorial series" }, { title: "Home & Hearth Brand", subtitle: "Illustration campaign" }, { title: "Custom Portrait Series", subtitle: "Client commissions" }] },
      testimonials: [{ quote: "Riley captured exactly what I imagined.", name: "Client", role: "Wildwood Magazine" }, { quote: "So talented and easy to work with.", name: "Client", role: "Home & Hearth" }, { quote: "I cried when I saw my portrait.", name: "Client", role: "Commission" }],
      contact: { address: "Chicago, IL", phone: "+1 312 555 0171", email: "riley@rileychen.art" },
      footer: "All rights reserved.",
    },
  ],
  "landing-page": [
    {
      brand: "FLOWSTATE", links: ["Features", "Pricing", "About"],
      hero: { eyebrow: "Introducing Flowstate", heading: "Focus Deeper. Ship Faster.", sub: "The productivity app that helps teams cut through noise and get real work done.", cta: "Start Free Trial", secondaryCta: "Watch Demo" },
      features: { eyebrow: "Features", heading: "Everything You Need To Focus", items: [{ icon: "⚡", title: "Instant Setup", text: "Get your team running in under 5 minutes." }, { icon: "🔒", title: "Private By Design", text: "Your data stays yours, always encrypted." }, { icon: "📊", title: "Real Insights", text: "See exactly where your time goes." }] },
      showcase: { eyebrow: "Loved By Teams", heading: "Why Teams Switch", items: [{ title: "3x Faster Delivery", subtitle: "Average across customer teams" }, { title: "40% Fewer Meetings", subtitle: "Reported by active users" }, { title: "98% Retention", subtitle: "Teams that stick with Flowstate" }] },
      testimonials: [{ quote: "Flowstate changed how our team works.", name: "Priya Nair", role: "Head of Product, Vela" }, { quote: "We shipped 2x faster in month one.", name: "Marcus Bell", role: "CTO, Ridgeline" }, { quote: "Simple, fast, and it just works.", name: "Tara Kim", role: "Founder, Northlight" }],
      ctaBand: { heading: "Ready To Get Started?", sub: "Join thousands of teams already using Flowstate.", cta: "Start Free Trial" },
      contact: { address: "San Francisco, CA", phone: "+1 415 555 0190", email: "hello@flowstate.app" },
      footer: "All rights reserved.",
    },
    {
      brand: "ORBIT", links: ["Features", "Pricing", "About"],
      hero: { eyebrow: "Meet Orbit", heading: "One Platform For Your Whole Team", sub: "Plan, track and ship your best work — all in one beautifully simple tool.", cta: "Get Started Free", secondaryCta: "See How It Works" },
      features: { eyebrow: "Why Orbit", heading: "Built For Modern Teams", items: [{ icon: "🚀", title: "Fast By Default", text: "Built for speed, from day one." }, { icon: "🧩", title: "Fits Your Workflow", text: "Flexible enough for any team, any process." }, { icon: "🔔", title: "Smart Notifications", text: "Only get pinged when it actually matters." }] },
      showcase: { eyebrow: "Results", heading: "What Teams See", items: [{ title: "50% Less Busywork", subtitle: "Reported by customers" }, { title: "10,000+ Teams", subtitle: "Using Orbit daily" }, { title: "4.9/5 Rating", subtitle: "Average customer review" }] },
      testimonials: [{ quote: "Orbit is the tool we didn't know we needed.", name: "Hannah Fox", role: "Ops Lead, Brightline" }, { quote: "Our whole team adopted it in a week.", name: "Carlos Diaz", role: "Founder, Vantage" }, { quote: "Genuinely delightful to use.", name: "Noah Park", role: "PM, Fieldnote" }],
      ctaBand: { heading: "Bring Your Team Into Orbit", sub: "Free for teams up to 10 — no credit card required.", cta: "Get Started Free" },
      contact: { address: "New York, NY", phone: "+1 212 555 0166", email: "hello@orbit.app" },
      footer: "All rights reserved.",
    },
    {
      brand: "PULSE", links: ["Features", "Pricing", "About"],
      hero: { eyebrow: "Introducing Pulse", heading: "Know Your Metrics. Grow Faster.", sub: "Real-time analytics built for founders who want answers, not dashboards to decode.", cta: "Try Pulse Free", secondaryCta: "Book a Demo" },
      features: { eyebrow: "Capabilities", heading: "See What Matters", items: [{ icon: "📈", title: "Live Dashboards", text: "Every metric updated in real time." }, { icon: "🎯", title: "Goal Tracking", text: "Set targets and track progress automatically." }, { icon: "🤖", title: "Smart Alerts", text: "Get notified the moment something changes." }] },
      showcase: { eyebrow: "Impact", heading: "By The Numbers", items: [{ title: "5 Min Setup", subtitle: "From signup to first dashboard" }, { title: "2,000+ Companies", subtitle: "Trust Pulse with their data" }, { title: "99.9% Uptime", subtitle: "Enterprise-grade reliability" }] },
      testimonials: [{ quote: "Pulse gave us clarity overnight.", name: "Zoe Bennett", role: "CEO, Lightwell" }, { quote: "The only dashboard our team actually uses.", name: "Ibrahim Khan", role: "Head of Growth, Metric" }, { quote: "Setup took five minutes, seriously.", name: "Claire Dubois", role: "Founder, Parallel" }],
      ctaBand: { heading: "Start Tracking What Matters", sub: "Free 14-day trial, no credit card needed.", cta: "Try Pulse Free" },
      contact: { address: "Austin, TX", phone: "+1 512 555 0188", email: "hello@pulse.app" },
      footer: "All rights reserved.",
    },
  ],
  restaurant: [
    {
      brand: "THE OAK TABLE", links: ["Home", "Menu", "About", "Reservations"],
      hero: { eyebrow: "Est. 2012", heading: "Seasonal Cooking, Warm Hospitality", sub: "A neighborhood restaurant serving thoughtful, seasonal dishes in the heart of the city.", cta: "Reserve a Table" },
      about: { eyebrow: "Our Story", heading: "A Table Worth Gathering Around", body: "The Oak Table was built on one idea: honest food, sourced locally, served with genuine warmth." },
      features: { eyebrow: "Why Visit", heading: "The Oak Table Experience", items: [{ icon: "🌾", title: "Local Sourcing", text: "Ingredients from farms within 50 miles." }, { icon: "🍷", title: "Curated Wine List", text: "Small-batch wines chosen to match the menu." }, { icon: "🕯️", title: "Warm Atmosphere", text: "A cozy dining room built for slow evenings." }] },
      showcase: { eyebrow: "Menu", heading: "Chef's Favorites", variant: "menu", items: [{ title: "Roasted Chicken", subtitle: "Herb butter, root vegetables", price: "$28" }, { title: "Pan-Seared Salmon", subtitle: "Lemon, asparagus, farro", price: "$32" }, { title: "Wild Mushroom Risotto", subtitle: "Parmesan, truffle oil", price: "$24" }] },
      testimonials: [{ quote: "Best meal we've had all year.", name: "Local Guide", role: "Regular Guest" }, { quote: "Cozy, delicious, unforgettable.", name: "Food Critic", role: "City Weekly" }, { quote: "Our go-to for every celebration.", name: "Regular Guest", role: "Neighborhood Local" }],
      contact: { address: "214 Maple Street", phone: "+1 555 234 8890", email: "reservations@theoaktable.com" },
      footer: "All rights reserved.",
    },
    {
      brand: "HARVEST KITCHEN", links: ["Home", "Menu", "About", "Reservations"],
      hero: { eyebrow: "Farm To Table", heading: "Fresh Ingredients, Honest Flavor", sub: "A farm-to-table kitchen celebrating the best of every season.", cta: "Book Your Table" },
      about: { eyebrow: "Our Philosophy", heading: "From Field To Fork", body: "We work directly with local farmers to bring the freshest seasonal ingredients straight to your plate." },
      features: { eyebrow: "What Sets Us Apart", heading: "The Harvest Difference", items: [{ icon: "🥕", title: "Farm Partnerships", text: "Direct relationships with 12 local farms." }, { icon: "👨‍🍳", title: "Chef-Driven Menu", text: "A menu that changes with the seasons." }, { icon: "🌱", title: "Sustainable Practice", text: "Zero-waste kitchen, composted daily." }] },
      showcase: { eyebrow: "Menu", heading: "Seasonal Highlights", variant: "menu", items: [{ title: "Heirloom Tomato Salad", subtitle: "Burrata, basil oil", price: "$16" }, { title: "Grilled Ribeye", subtitle: "Roasted potatoes, chimichurri", price: "$38" }, { title: "Butternut Squash Tart", subtitle: "Goat cheese, sage", price: "$18" }] },
      testimonials: [{ quote: "Every dish tastes like it was picked that morning.", name: "Local Guide", role: "Regular Guest" }, { quote: "A true farm-to-table experience.", name: "Food Critic", role: "Dining Monthly" }, { quote: "Our favorite spot for date night.", name: "Regular Guest", role: "Neighborhood Local" }],
      contact: { address: "77 Harvest Lane", phone: "+1 555 349 7712", email: "hello@harvestkitchen.com" },
      footer: "All rights reserved.",
    },
    {
      brand: "COPPER SPOON", links: ["Home", "Menu", "About", "Reservations"],
      hero: { eyebrow: "Modern Bistro", heading: "Comfort Food, Elevated", sub: "A modern bistro reimagining classic comfort food with a chef's touch.", cta: "Make a Reservation" },
      about: { eyebrow: "About Us", heading: "Classic Dishes, Modern Craft", body: "Copper Spoon takes the comfort food you grew up with and elevates it with technique and top ingredients." },
      features: { eyebrow: "Highlights", heading: "Why Guests Return", items: [{ icon: "🔥", title: "Wood-Fired Kitchen", text: "Every dish touched by real fire." }, { icon: "🍸", title: "Craft Cocktails", text: "Original cocktails made with house-made syrups." }, { icon: "🎶", title: "Live Music Nights", text: "Local musicians every Friday evening." }] },
      showcase: { eyebrow: "Menu", heading: "Guest Favorites", variant: "menu", items: [{ title: "Short Rib", subtitle: "Wood-fired, red wine jus", price: "$34" }, { title: "Truffle Mac & Cheese", subtitle: "Four cheese blend", price: "$19" }, { title: "Charred Octopus", subtitle: "Smoked paprika, lemon", price: "$26" }] },
      testimonials: [{ quote: "Comfort food done right.", name: "Local Guide", role: "Regular Guest" }, { quote: "The short rib alone is worth the visit.", name: "Food Critic", role: "Taste & Table" }, { quote: "Best cocktails in the neighborhood.", name: "Regular Guest", role: "Neighborhood Local" }],
      contact: { address: "9 Copper Row", phone: "+1 555 402 6631", email: "reservations@copperspoon.com" },
      footer: "All rights reserved.",
    },
  ],
};

function buildSections(cfg, content, bgSrc, aboutSrc) {
  const sections = [
    { id: "nav", type: "nav", brand: cfg.label === "Landing Page" ? content.brand : content.brand, links: content.links, ctaText: "Contact", ctaTarget: "contact" },
    { id: "hero", type: "hero", eyebrow: content.hero.eyebrow, heading: content.hero.heading, subheading: content.hero.sub, ctaText: content.hero.cta, secondaryCtaText: content.hero.secondaryCta, background: { type: "image", src: bgSrc } },
  ];
  if (content.about) {
    sections.push({ id: "about", type: "about", eyebrow: content.about.eyebrow, heading: content.about.heading, body: content.about.body, image: { type: "image", src: aboutSrc } });
  }
  sections.push({ id: "features", type: "features", eyebrow: content.features.eyebrow, heading: content.features.heading, items: content.features.items });
  sections.push({ id: "showcase", type: "showcase", eyebrow: content.showcase.eyebrow, heading: content.showcase.heading, variant: content.showcase.variant || "gallery", items: content.showcase.items.map((it) => ({ ...it, image: { type: "image", src: aboutSrc } })) });
  sections.push({ id: "testimonials", type: "testimonials", eyebrow: "Testimonials", heading: "What People Say", items: content.testimonials });
  if (content.ctaBand) {
    sections.push({ id: "cta-band", type: "cta-band", heading: content.ctaBand.heading, subheading: content.ctaBand.sub, ctaText: content.ctaBand.cta, background: { type: "solid" } });
  }
  sections.push({ id: "contact", type: "contact", eyebrow: "Get In Touch", heading: "Contact Us", address: content.contact.address, phone: content.contact.phone, email: content.contact.email });
  sections.push({ id: "footer", type: "footer", brand: content.brand, text: `© 2026 ${content.brand}. ${content.footer}` });
  return sections;
}

const OUT_DIR = path.join(ROOT, "data", "website-templates");
fs.mkdirSync(OUT_DIR, { recursive: true });

const PREVIEW_PER_CATEGORY = 2;
const meta = { categories: [], preview: [] };
let grandTotal = 0;

for (const cat of CATEGORIES) {
  const palettes = PALETTE_SETS[cat.slug];
  const contents = CONTENT[cat.slug];
  const images = BACKGROUNDS[cat.assetTheme] || [];
  const templates = [];
  let seq = 1;
  let contentIdx = 0;

  for (const palette of palettes) {
    for (const bgSrc of images) {
      const content = contents[contentIdx % contents.length];
      contentIdx++;
      const aboutSrc = images[(contentIdx + 2) % images.length];
      const id = `website_${cat.slug}_${String(seq).padStart(3, "0")}`;
      templates.push({
        id,
        name: `${cat.label} ${String(seq).padStart(3, "0")}`,
        category: cat.label,
        categorySlug: cat.slug,
        premium: false,
        theme: { ...palette },
        logo: { text: content.brand.charAt(0), image: null },
        sections: buildSections(cat, content, bgSrc, aboutSrc),
      });
      seq++;
    }
  }

  const filePath = path.join(OUT_DIR, `${cat.slug}.json`);
  fs.writeFileSync(filePath, JSON.stringify({ schemaVersion: "1.0", category: cat.label, templates }, null, 2) + "\n");
  meta.categories.push({ slug: cat.slug, label: cat.label, count: templates.length });
  meta.preview.push(...templates.slice(0, PREVIEW_PER_CATEGORY).map((t) => ({ id: t.id, name: t.name, category: t.category, categorySlug: cat.slug, theme: t.theme })));
  grandTotal += templates.length;
  console.log(`${cat.slug}: ${templates.length} templates -> ${filePath}`);
}

meta.totalTemplates = grandTotal;
fs.writeFileSync(path.join(ROOT, "data", "website-templates-meta.json"), JSON.stringify(meta, null, 2) + "\n");
console.log(`Total: ${grandTotal} templates across ${meta.categories.length} categories.`);
