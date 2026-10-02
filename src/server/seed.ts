import { db, hashPassword } from './db.js';
import { seedComprehensiveCareersAndSkills } from './seedComprehensiveData.js';
import { generateAndSaveUserRoadmap } from './engines/roadmapEngine.js';

export function seedDatabase() {
  // Check if admin exists
  const adminEmail = (process.env.ADMIN_EMAIL || 'premthakare986@gmail.com').toLowerCase();
  
  // Explicitly ensure the intended admin credentials (prem&rome625) are active
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  const primaryPassword = (envPassword && envPassword !== 'prem@rome625' && envPassword !== 'prem@rome')
    ? envPassword
    : 'prem&rome625';

  const primaryHash = hashPassword(primaryPassword);
  const secondaryHash = hashPassword('prem&rome625');

  const existingAdmin = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(adminEmail) as any;
  if (!existingAdmin) {
    db.prepare(`
      INSERT INTO users (email, password_hash, secondary_password_hash, role)
      VALUES (?, ?, ?, 'admin')
    `).run(adminEmail, primaryHash, secondaryHash);
    console.log(`[Seed] Seeded admin account: ${adminEmail}`);
  } else {
    db.prepare(`
      UPDATE users
      SET password_hash = ?, secondary_password_hash = ?, role = 'admin'
      WHERE id = ?
    `).run(primaryHash, secondaryHash, existingAdmin.id);
  }

  // Check if careers exist
  const existingCareers = db.prepare('SELECT COUNT(*) as count FROM careers').get() as { count: number };
  if (existingCareers.count === 0) {
    console.log('[Seed] Seeding career tracks and skills...');

    const insertCareer = db.prepare(`
      INSERT INTO careers (title, slug, description, icon, category, market_demand, avg_salary)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertCareer.run(
      'Full Stack Developer',
      'full-stack-developer',
      'Build end-to-end web applications, modern frontends, robust REST APIs, secure authentication, and relational databases.',
      'Layers',
      'Software Engineering',
      'Very High',
      '$95,000 - $140,000 / yr'
    );

    insertCareer.run(
      'Software Engineer (Backend)',
      'backend-engineer',
      'Design high-throughput distributed systems, scalable microservices, database schemas, and background job queues.',
      'Server',
      'Software Engineering',
      'High',
      '$105,000 - $155,000 / yr'
    );

    insertCareer.run(
      'AI / Machine Learning Engineer',
      'ai-ml-engineer',
      'Develop machine learning models, train deep neural networks, evaluate generative AI pipelines, and deploy inference systems.',
      'Cpu',
      'Artificial Intelligence',
      'Exceptional',
      '$115,000 - $170,000 / yr'
    );

    insertCareer.run(
      'Data Analyst',
      'data-analyst',
      'Extract actionable business insights through SQL, statistical modeling, data visualization dashboards, and Python analysis.',
      'BarChart3',
      'Data Science',
      'High',
      '$80,000 - $115,000 / yr'
    );

    insertCareer.run(
      'Cloud & DevOps Engineer',
      'cloud-devops',
      'Automate CI/CD pipelines, containerize architectures with Docker and Kubernetes, and orchestrate cloud infrastructure.',
      'Cloud',
      'Infrastructure',
      'Very High',
      '$105,000 - $150,000 / yr'
    );

    insertCareer.run(
      'Mobile App Developer',
      'mobile-developer',
      'Develop smooth cross-platform and native mobile apps using React Native, TypeScript, device APIs, and offline synchronization.',
      'Smartphone',
      'Mobile Engineering',
      'High',
      '$90,000 - $135,000 / yr'
    );

    // Seed Skills
    const skillsList = [
      { name: 'HTML5 & Semantic Markup', slug: 'html', category: 'Frontend', difficulty: 'Beginner', desc: 'Core web document structuring, accessibility (WCAG), forms and SEO standards.', relevance: 'Essential foundation for any web developer.' },
      { name: 'CSS3 & Modern Layouts', slug: 'css', category: 'Frontend', difficulty: 'Beginner', desc: 'Flexbox, CSS Grid, media queries, CSS custom properties, responsive design.', relevance: 'Crucial for clean, mobile-first user interfaces.' },
      { name: 'JavaScript Fundamentals', slug: 'javascript', category: 'Frontend', difficulty: 'Beginner', desc: 'ES6+ syntax, functions, closures, prototypes, DOM manipulation, promises, async/await.', relevance: 'The core language of modern client-side and full-stack web development.' },
      { name: 'TypeScript', slug: 'typescript', category: 'Frontend', difficulty: 'Intermediate', desc: 'Static typing, interfaces, generics, type guards, strict compilation.', relevance: 'Industry standard for robust large-scale web applications.' },
      { name: 'Git & GitHub Version Control', slug: 'git-github', category: 'Core CS', difficulty: 'Beginner', desc: 'Branching, commits, pull requests, resolving merge conflicts, CI collaboration.', relevance: 'Non-negotiable requirement for every engineering role.' },
      { name: 'React & Component Architecture', slug: 'react', category: 'Frontend', difficulty: 'Intermediate', desc: 'JSX, hooks (useState, useEffect, useMemo), state lifting, component lifecycle, virtual DOM.', relevance: 'The most popular frontend library worldwide.' },
      { name: 'Tailwind CSS', slug: 'tailwind', category: 'Frontend', difficulty: 'Beginner', desc: 'Utility-first styling, responsive prefixes, dark mode design tokens.', relevance: 'High developer velocity and consistent design systems.' },
      { name: 'REST APIs & HTTP Protocols', slug: 'rest-apis', category: 'Backend', difficulty: 'Intermediate', desc: 'HTTP methods, status codes, headers, JSON serialization, query params, pagination.', relevance: 'The glue between client and server architectures.' },
      { name: 'Node.js Runtime', slug: 'nodejs', category: 'Backend', difficulty: 'Intermediate', desc: 'Event loop, asynchronous I/O, npm packages, file streams, module system.', relevance: 'Enables high-performance server-side JavaScript applications.' },
      { name: 'Express.js Framework', slug: 'express', category: 'Backend', difficulty: 'Intermediate', desc: 'Middleware pipelines, routing, request validation, error handling, CORS.', relevance: 'Minimalist web framework for building backend services.' },
      { name: 'Authentication & Security', slug: 'auth-security', category: 'Backend', difficulty: 'Intermediate', desc: 'Password hashing (scrypt/bcrypt), JWTs, sessions, CSRF, CORS, RBAC authorization.', relevance: 'Essential to prevent data breaches and secure user profiles.' },
      { name: 'SQL & Relational Databases', slug: 'sql-databases', category: 'Database', difficulty: 'Intermediate', desc: 'PostgreSQL/SQLite, schema normalization, joins, indexes, ACID transactions.', relevance: 'The foundational standard for reliable persistent structured data.' },
      { name: 'Docker & Containerization', slug: 'docker', category: 'DevOps', difficulty: 'Intermediate', desc: 'Dockerfiles, container images, volumes, port mapping, compose files.', relevance: 'Guarantees consistent environments from local machine to production.' },
      { name: 'Data Structures: Arrays & Strings', slug: 'dsa-arrays-strings', category: 'DSA', difficulty: 'Beginner', desc: 'Two pointers, sliding window, prefix sums, in-place manipulation, string hashing.', relevance: 'Fundamental building blocks for technical interviews.' },
      { name: 'Data Structures: Linked Lists', slug: 'dsa-linked-lists', category: 'DSA', difficulty: 'Intermediate', desc: 'Singly/doubly linked lists, cycle detection (Floyd’s algorithm), reversing, merging.', relevance: 'Pointer manipulation and memory layout fundamentals.' },
      { name: 'Data Structures: Stacks & Queues', slug: 'dsa-stacks-queues', category: 'DSA', difficulty: 'Intermediate', desc: 'LIFO & FIFO mechanics, monotonic stacks, BFS traversal queues, expression evaluation.', relevance: 'Crucial for parser designs and graph traversals.' },
      { name: 'Data Structures: Trees & BST', slug: 'dsa-trees', category: 'DSA', difficulty: 'Intermediate', desc: 'Binary search trees, DFS pre/in/post-order, tree heights, lowest common ancestor.', relevance: 'Ubiquitous in hierarchical data management and indexing.' },
      { name: 'Algorithms: Graphs & Traversals', slug: 'dsa-graphs', category: 'DSA', difficulty: 'Advanced', desc: 'Adjacency lists, BFS, DFS, Dijkstra shortest path, topological sorting, union-find.', relevance: 'Critical for network routing, social graphs, and dependency managers.' },
      { name: 'Python Programming', slug: 'python', category: 'Core CS', difficulty: 'Beginner', desc: 'Data structures, list comprehensions, decorators, generators, packages.', relevance: 'Primary language for AI/ML, data science, and scripting.' },
      { name: 'Machine Learning Foundations', slug: 'ml-foundations', category: 'AI/ML', difficulty: 'Intermediate', desc: 'Supervised vs unsupervised learning, loss functions, gradient descent, overfitting.', relevance: 'Core theoretical foundation for modern AI systems.' }
    ];

    const insertSkill = db.prepare(`
      INSERT INTO skills (name, slug, category, difficulty, description, career_relevance)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const s of skillsList) {
      insertSkill.run(s.name, s.slug, s.category, s.difficulty, s.desc, s.relevance);
    }

    // Connect skills to Full Stack Developer (Career 1)
    const fsCareer = db.prepare("SELECT id FROM careers WHERE slug = 'full-stack-developer'").get() as { id: number };
    const allSkills = db.prepare('SELECT id, slug FROM skills').all() as { id: number; slug: string }[];
    const skillMap = new Map(allSkills.map(s => [s.slug, s.id]));

    const fullStackRequirements = [
      { slug: 'html', level: 90, optional: 0, order: 1 },
      { slug: 'css', level: 85, optional: 0, order: 2 },
      { slug: 'javascript', level: 85, optional: 0, order: 3 },
      { slug: 'git-github', level: 80, optional: 0, order: 4 },
      { slug: 'react', level: 80, optional: 0, order: 5 },
      { slug: 'tailwind', level: 75, optional: 1, order: 6 },
      { slug: 'rest-apis', level: 80, optional: 0, order: 7 },
      { slug: 'nodejs', level: 75, optional: 0, order: 8 },
      { slug: 'express', level: 75, optional: 0, order: 9 },
      { slug: 'auth-security', level: 75, optional: 0, order: 10 },
      { slug: 'sql-databases', level: 75, optional: 0, order: 11 },
      { slug: 'docker', level: 60, optional: 1, order: 12 },
      { slug: 'dsa-arrays-strings', level: 70, optional: 0, order: 13 }
    ];

    const insertCareerSkill = db.prepare(`
      INSERT INTO career_skills (career_id, skill_id, required_level, is_optional, order_index)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (const req of fullStackRequirements) {
      const skillId = skillMap.get(req.slug);
      if (skillId && fsCareer) {
        insertCareerSkill.run(fsCareer.id, skillId, req.level, req.optional, req.order);
      }
    }

    // Connect skills to Backend Engineer (Career 2)
    const backendCareer = db.prepare("SELECT id FROM careers WHERE slug = 'backend-engineer'").get() as { id: number };
    if (backendCareer) {
      const backendReqs = [
        { slug: 'javascript', level: 80, optional: 0, order: 1 },
        { slug: 'nodejs', level: 85, optional: 0, order: 2 },
        { slug: 'express', level: 80, optional: 0, order: 3 },
        { slug: 'rest-apis', level: 85, optional: 0, order: 4 },
        { slug: 'sql-databases', level: 85, optional: 0, order: 5 },
        { slug: 'auth-security', level: 85, optional: 0, order: 6 },
        { slug: 'docker', level: 75, optional: 0, order: 7 },
        { slug: 'dsa-arrays-strings', level: 80, optional: 0, order: 8 },
        { slug: 'dsa-trees', level: 75, optional: 0, order: 9 },
        { slug: 'dsa-graphs', level: 70, optional: 0, order: 10 }
      ];
      for (const req of backendReqs) {
        const skillId = skillMap.get(req.slug);
        if (skillId) {
          insertCareerSkill.run(backendCareer.id, skillId, req.level, req.optional, req.order);
        }
      }
    }

    // Seed Skill Dependencies
    const dependencies = [
      { skill: 'css', dependsOn: 'html', reason: 'CSS styles HTML elements and layout structures.' },
      { skill: 'javascript', dependsOn: 'html', reason: 'JavaScript interacts with the HTML Document Object Model.' },
      { skill: 'typescript', dependsOn: 'javascript', reason: 'TypeScript is a typed superset of JavaScript.' },
      { skill: 'react', dependsOn: 'javascript', reason: 'React requires strong mastery of ES6+, functions, and closures.' },
      { skill: 'react', dependsOn: 'css', reason: 'Styling component trees requires CSS fundamentals.' },
      { skill: 'express', dependsOn: 'nodejs', reason: 'Express runs on top of the Node.js runtime.' },
      { skill: 'rest-apis', dependsOn: 'javascript', reason: 'APIs serialize and parse JSON and asynchronous promises.' },
      { skill: 'auth-security', dependsOn: 'express', reason: 'Authentication relies on server middleware and sessions.' },
      { skill: 'auth-security', dependsOn: 'sql-databases', reason: 'User credentials and tokens are persisted in databases.' },
      { skill: 'dsa-linked-lists', dependsOn: 'dsa-arrays-strings', reason: 'Understanding pointers and sequential access builds upon array foundations.' },
      { skill: 'dsa-trees', dependsOn: 'dsa-linked-lists', reason: 'Tree nodes rely on non-linear pointer linked references.' },
      { skill: 'dsa-graphs', dependsOn: 'dsa-trees', reason: 'Graphs generalize tree structures to cyclic non-hierarchical topologies.' }
    ];

    const insertDep = db.prepare(`
      INSERT INTO skill_dependencies (skill_id, depends_on_skill_id, reason)
      VALUES (?, ?, ?)
    `);

    for (const dep of dependencies) {
      const sId = skillMap.get(dep.skill);
      const parentId = skillMap.get(dep.dependsOn);
      if (sId && parentId) {
        insertDep.run(sId, parentId, dep.reason);
      }
    }

    // Seed Learning Resources (Official, verified URLs only)
    const insertResource = db.prepare(`
      INSERT INTO resources (skill_id, topic, title, resource_type, platform, url, difficulty, language, duration_minutes, is_free)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const resourceList = [
      { skill: 'html', topic: 'Web Standards', title: 'MDN Web Docs: HTML Basics & Semantic Structure', type: 'Learn', platform: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML', diff: 'Beginner', duration: 120 },
      { skill: 'html', topic: 'Semantic Forms', title: 'W3C / Web.dev: Accessible Forms & Input Validation', type: 'Practice', platform: 'web.dev', url: 'https://web.dev/learn/forms/', diff: 'Beginner', duration: 90 },
      { skill: 'css', topic: 'Modern Layouts', title: 'MDN: CSS Flexbox & Grid Masterclass', type: 'Learn', platform: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout', diff: 'Beginner', duration: 180 },
      { skill: 'css', topic: 'Interactive Exercises', title: 'Flexbox Froggy: Interactive CSS Game', type: 'Practice', platform: 'Flexbox Froggy', url: 'https://flexboxfroggy.com/', diff: 'Beginner', duration: 45 },
      { skill: 'javascript', topic: 'ES6 & Asynchronous JS', title: 'javascript.info: Modern JavaScript Tutorial', type: 'Learn', platform: 'javascript.info', url: 'https://javascript.info/', diff: 'Beginner', duration: 240 },
      { skill: 'javascript', topic: 'Promises & Fetch API', title: 'MDN: How to Use Promises and Async/Await', type: 'Practice', platform: 'MDN', url: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Promises', diff: 'Intermediate', duration: 120 },
      { skill: 'react', topic: 'React Core', title: 'React Official Documentation: Describing the UI & State', type: 'Learn', platform: 'react.dev', url: 'https://react.dev/learn', diff: 'Intermediate', duration: 240 },
      { skill: 'react', topic: 'Managing State', title: 'React.dev: Extracting State Logic into a Reducer', type: 'Practice', platform: 'react.dev', url: 'https://react.dev/learn/extracting-state-logic-into-a-reducer', diff: 'Intermediate', duration: 90 },
      { skill: 'git-github', topic: 'Version Control', title: 'Git Official Documentation & Pro Git Book', type: 'Learn', platform: 'git-scm.com', url: 'https://git-scm.com/book/en/v2', diff: 'Beginner', duration: 150 },
      { skill: 'nodejs', topic: 'Server Runtime', title: 'Node.js Official Documentation: Introduction to Node.js', type: 'Learn', platform: 'nodejs.org', url: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', diff: 'Intermediate', duration: 180 },
      { skill: 'express', topic: 'REST Architecture', title: 'Express.js Official Guide: Routing and Middleware', type: 'Learn', platform: 'expressjs.com', url: 'https://expressjs.com/en/guide/routing.html', diff: 'Intermediate', duration: 120 },
      { skill: 'sql-databases', topic: 'Relational Queries', title: 'PostgreSQL Official Tutorial: SQL Language', type: 'Learn', platform: 'postgresql.org', url: 'https://www.postgresql.org/docs/current/tutorial.html', diff: 'Intermediate', duration: 180 },
      { skill: 'dsa-arrays-strings', topic: 'Two Pointers & Sliding Window', title: 'NeetCode: Arrays & Hashing Roadmap Guide', type: 'Learn', platform: 'NeetCode', url: 'https://neetcode.io/roadmap', diff: 'Beginner', duration: 120 }
    ];

    for (const r of resourceList) {
      const sId = skillMap.get(r.skill);
      if (sId) {
        insertResource.run(sId, r.topic, r.title, r.type, r.platform, r.url, r.diff, 'English', r.duration, 1);
      }
    }

    // Seed Standard Projects
    const insertProject = db.prepare(`
      INSERT INTO projects (career_id, title, slug, difficulty, description, why_this_project, learning_outcomes, technologies_json, checklist_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertProject.run(
      fsCareer.id,
      'Developer Portfolio Website',
      'developer-portfolio',
      'Beginner',
      'Build a modern, accessible, mobile-first personal portfolio showcasing projects, technical skills, resume download, and a contact form.',
      'Demonstrates real mastery of responsive web semantics, CSS layout math, and mobile performance without heavy framework baggage.',
      'Semantic HTML5 structure, responsive CSS Grid/Flexbox, WCAG 2.1 AA accessibility contrast, fast load times.',
      JSON.stringify(['HTML5', 'CSS3', 'JavaScript', 'Git']),
      JSON.stringify([
        'Semantic header, main, and footer layout',
        'Mobile navigation menu with accessible touch targets',
        'Project cards with screenshots and repository links',
        'Contact form with client-side field validation',
        'Deploy on GitHub Pages or Vercel with clean README'
      ])
    );

    insertProject.run(
      fsCareer.id,
      'Dynamic Weather & Geolocation Dashboard',
      'weather-dashboard',
      'Intermediate',
      'Build an interactive weather application that consumes a live REST API, geolocates the user, caches search history, and displays 5-day forecasts.',
      'Bridges the crucial gap between pure DOM manipulation and real-world asynchronous API data fetching with error boundaries.',
      'Asynchronous JavaScript (fetch, async/await), error handling, localStorage caching, responsive chart/forecast cards.',
      JSON.stringify(['JavaScript', 'REST APIs', 'CSS3', 'HTML5']),
      JSON.stringify([
        'Search city weather with autocomplete debounce',
        'Display temperature, humidity, wind speed, and UV index',
        'Graceful loading spinners and error banners for network failure',
        'Persist recent 5 searches in localStorage',
        'Publish on GitHub with setup instructions'
      ])
    );

    insertProject.run(
      fsCareer.id,
      'Full-Stack E-Commerce Product Store',
      'fullstack-ecommerce',
      'Advanced',
      'Create a complete e-commerce experience featuring product listings, category filters, shopping cart management, user authentication, and checkout simulation.',
      'The gold standard project for junior Full Stack engineers; proves competence across React, backend REST endpoints, and database CRUD.',
      'Component state orchestration, RESTful API design, database schema relationships, secure token authentication, cart persistence.',
      JSON.stringify(['React', 'Node.js', 'Express', 'SQL / PostgreSQL', 'Tailwind CSS']),
      JSON.stringify([
        'Product catalog with search, price filters, and pagination',
        'Persistent shopping cart with quantity adjustments',
        'User registration and login with hashed passwords',
        'Backend CRUD endpoints with route authorization',
        'PostgreSQL schema with products, users, and orders tables',
        'Comprehensive README with architecture diagram'
      ])
    );

    insertProject.run(
      fsCareer.id,
      'Cloud Expense & Subscription Tracker',
      'cloud-expense-tracker',
      'Advanced',
      'A multi-tenant personal finance tracker with monthly budget limits, category breakdown analytics, and CSV transaction export.',
      'Shows prospective hiring managers that you understand real business data structures, dates, calculations, and data visualization.',
      'Database indexing, aggregation queries (SUM, GROUP BY), interactive data charts, secure session auth.',
      JSON.stringify(['React', 'TypeScript', 'Node.js', 'Express', 'SQL']),
      JSON.stringify([
        'Add, edit, and delete categorized expense entries',
        'Interactive monthly spending charts and budget alerts',
        'CSV export of filtered transaction histories',
        'Server-side validation with proper HTTP error status codes'
      ])
    );

    // Seed Verified Internship Opportunities
    const insertOpportunity = db.prepare(`
      INSERT INTO opportunities (company, role, description, required_skills_json, degree_eligibility, year_eligibility, location, work_mode, deadline, source, application_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertOpportunity.run(
      'Razorpay',
      'Software Engineer Intern - Frontend',
      'Work with our payment checkout frontend team building blazing-fast, accessible checkout experiences in React and TypeScript.',
      JSON.stringify(['HTML5 & Semantic Markup', 'CSS3 & Modern Layouts', 'JavaScript Fundamentals', 'React & Component Architecture']),
      'B.Tech / B.E. / BCA / MCA',
      '2nd, 3rd, or 4th Year',
      'Bengaluru, Karnataka',
      'Hybrid',
      '2026-11-30',
      'Razorpay Careers Portal',
      'https://razorpay.com/jobs/'
    );

    insertOpportunity.run(
      'Groww',
      'Full Stack Web Development Intern',
      'Build scalable web applications and investment dashboard features using modern JavaScript, React, and Node.js backend services.',
      JSON.stringify(['JavaScript Fundamentals', 'React & Component Architecture', 'Node.js Runtime', 'SQL & Relational Databases']),
      'Computer Science or related discipline',
      '3rd or Final Year',
      'Bengaluru, Karnataka',
      'Hybrid',
      '2026-12-15',
      'Groww Official Careers',
      'https://groww.in/careers'
    );

    insertOpportunity.run(
      'Postman',
      'Backend Engineering Intern',
      'Contribute to core API platform services, microservices routing, performance benchmarking, and developer tool ecosystems.',
      JSON.stringify(['JavaScript Fundamentals', 'Node.js Runtime', 'Express.js Framework', 'REST APIs & HTTP Protocols', 'SQL & Relational Databases']),
      'Engineering / Technology Graduates or Students',
      '2nd, 3rd or 4th Year',
      'Remote / Bengaluru',
      'Remote',
      '2026-12-31',
      'Postman Student Programs',
      'https://www.postman.com/company/careers/'
    );

    insertOpportunity.run(
      'Microsoft',
      'Explore Intern (Software Engineering Track)',
      'A rotational internship designed for university students to gain hands-on experience in software development and technical problem solving.',
      JSON.stringify(['Data Structures: Arrays & Strings', 'JavaScript Fundamentals', 'Git & GitHub Version Control']),
      'B.Tech / B.E. in CS / IT / EE',
      '1st, 2nd, or 3rd Year',
      'Hyderabad / Bengaluru',
      'Hybrid',
      '2026-10-31',
      'Microsoft University Careers',
      'https://careers.microsoft.com/students'
    );

    // Seed Assessments
    const insertAssessment = db.prepare(`
      INSERT INTO assessments (skill_id, title, description, duration_minutes, total_questions, passing_score)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertQuestion = db.prepare(`
      INSERT INTO assessment_questions (assessment_id, question_text, question_type, options_json, correct_answer, explanation)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // JavaScript Assessment
    const jsSkillId = skillMap.get('javascript');
    if (jsSkillId) {
      const jsAss = insertAssessment.run(
        jsSkillId,
        'JavaScript Core Fundamentals Assessment',
        'Test your understanding of JavaScript scopes, closures, async execution, prototypes, and ES6+ features.',
        15,
        5,
        60
      );
      const assId = Number(jsAss.lastInsertRowid);

      insertQuestion.run(
        assId,
        'What will be logged to the console?\n\nconsole.log(typeof NaN);',
        'mcq',
        JSON.stringify(['"undefined"', '"number"', '"NaN"', '"object"']),
        1,
        'In JavaScript, NaN ("Not-a-Number") is a special numeric value defined by the IEEE 754 standard, so typeof NaN evaluates to "number".'
      );

      insertQuestion.run(
        assId,
        'Which method creates a new array populated with the results of calling a provided function on every element in the calling array?',
        'mcq',
        JSON.stringify(['Array.prototype.forEach()', 'Array.prototype.filter()', 'Array.prototype.map()', 'Array.prototype.reduce()']),
        2,
        'Array.prototype.map() returns a new array with the transformed elements without mutating the original array.'
      );

      insertQuestion.run(
        assId,
        'What does Promise.all() do when one of the input promises rejects?',
        'mcq',
        JSON.stringify([
          'It waits for all other promises to resolve and ignores the rejection.',
          'It immediately rejects with the reason of the first promise that rejects.',
          'It returns an array containing error objects for the rejected promises.',
          'It retries the rejected promise up to 3 times.'
        ]),
        1,
        'Promise.all() has "fail-fast" behavior: as soon as any promise in the iterable rejects, the returned promise immediately rejects.'
      );

      insertQuestion.run(
        assId,
        'What is a JavaScript closure?',
        'mcq',
        JSON.stringify([
          'A method to close browser tabs programmatically.',
          'The combination of a function bundled together with references to its surrounding lexical environment.',
          'A way to make an object immutable using Object.freeze().',
          'A syntax error caused by unclosed parentheses.'
        ]),
        1,
        'A closure gives an inner function access to its outer enclosing scope even after the outer function has returned.'
      );

      insertQuestion.run(
        assId,
        'What is the difference between "==" and "===" in JavaScript?',
        'mcq',
        JSON.stringify([
          '"==" checks reference identity, while "===" checks value equality.',
          '"==" performs type coercion before comparison, whereas "===" checks both value and type without coercion.',
          '"===" is deprecated in modern ES6+ standards.',
          'There is no difference in modern JavaScript engines.'
        ]),
        1,
        '"==" converts operands to a common type (abstract equality), while "===" requires identical types without coercion (strict equality).'
      );
    }

    // React Assessment
    const reactSkillId = skillMap.get('react');
    if (reactSkillId) {
      const reactAss = insertAssessment.run(
        reactSkillId,
        'React Architecture & Hooks Assessment',
        'Verify your mastery of React components, state, hooks rules, and rendering optimization.',
        15,
        5,
        60
      );
      const rId = Number(reactAss.lastInsertRowid);

      insertQuestion.run(
        rId,
        'Why should you never call React Hooks inside loops, conditions, or nested functions?',
        'mcq',
        JSON.stringify([
          'Because JavaScript does not support functions inside loops.',
          'To ensure that Hooks are called in the exact same order on every render for stable internal state tracking.',
          'Because it causes immediate memory leaks in the browser V8 engine.',
          'React hooks only work inside class component lifecycle methods.'
        ]),
        1,
        'React relies on the call order of Hooks between renders to correctly associate state cells with individual useState/useEffect calls.'
      );

      insertQuestion.run(
        rId,
        'What is the purpose of the dependency array in useEffect(callback, [deps])?',
        'mcq',
        JSON.stringify([
          'To specify CSS styles that apply to the effect.',
          'To tell React to re-run the effect only when specified values change between renders.',
          'To load external npm packages dynamically.',
          'To bind "this" context to the callback function.'
        ]),
        1,
        'React performs Object.is comparisons on dependency values. If none have changed, React skips running the effect callback.'
      );

      insertQuestion.run(
        rId,
        'When should you use the "key" prop in React lists?',
        'mcq',
        JSON.stringify([
          'Only when rendering input elements.',
          'Whenever rendering a dynamic array of elements to help React identify which items have changed, added, or removed.',
          'Only to add unique CSS classnames to list items.',
          'Keys are optional and provide no performance difference.'
        ]),
        1,
        'Unique and stable keys enable React to perform efficient reconciliation across renders without re-mounting DOM nodes.'
      );

      insertQuestion.run(
        rId,
        'What problem does React Context API primarily solve?',
        'mcq',
        JSON.stringify([
          'Slow database query times.',
          'Prop drilling: passing data through deeply nested component hierarchies.',
          'Converting functional components into Web Workers.',
          'Automatic image compression.'
        ]),
        1,
        'Context provides a way to share values like themes, user authentication, or preferences across the component tree without manually passing props at every level.'
      );

      insertQuestion.run(
        rId,
        'What does React.useMemo() do?',
        'mcq',
        JSON.stringify([
          'It caches a calculated value between re-renders to prevent expensive recalculations.',
          'It saves the entire component tree to localStorage.',
          'It memoizes callback functions to maintain referential equality.',
          'It prevents the component from ever re-rendering.'
        ]),
        0,
        'useMemo caches the result of an expensive calculation and only recalculates it when its dependencies change.'
      );
    }
  }

  // Seed Demo Student (Rohit Sharma)
  const demoEmail = 'rohit.student@skillpath.edu';
  const existingDemo = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail) as { id: number } | undefined;
  let demoUserId: number;

  if (!existingDemo) {
    console.log('[Seed] Creating demo student account (Rohit)...');
    const demoHash = hashPassword('rohit@demo');
    const userRes = db.prepare(`
      INSERT INTO users (email, password_hash, role)
      VALUES (?, ?, 'student')
    `).run(demoEmail, demoHash);
    demoUserId = Number(userRes.lastInsertRowid);

    const fsCareer = db.prepare("SELECT id FROM careers WHERE slug = 'full-stack-developer'").get() as { id: number };

    // Create Profile
    db.prepare(`
      INSERT INTO profiles (
        user_id, full_name, location, degree, branch, college, current_year, current_semester,
        cgpa, sgpa_history, career_goal_id, learning_pace, weekly_hours, preferred_work_mode,
        github_url, linkedin_url, onboarding_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      demoUserId,
      'Rohit Sharma',
      'Bengaluru, India',
      'B.Tech',
      'Computer Science & Engineering',
      'National Institute of Technology',
      '2nd Year',
      '4th Semester',
      7.8,
      JSON.stringify([
        { semester: 'Sem 1', sgpa: 7.4 },
        { semester: 'Sem 2', sgpa: 7.7 },
        { semester: 'Sem 3', sgpa: 8.1 },
        { semester: 'Sem 4', sgpa: 8.0 }
      ]),
      fsCareer.id,
      'moderate',
      18,
      'remote',
      'https://github.com/rohit-sharma-dev',
      'https://linkedin.com/in/rohit-sharma-student'
    );

    // Seed Rohit's Skills
    const allSkills = db.prepare('SELECT id, slug FROM skills').all() as { id: number; slug: string }[];
    const sMap = new Map(allSkills.map(s => [s.slug, s.id]));

    const rohitSkills = [
      { slug: 'html', self: 75, assessed: 80, computed: 78, status: 'completed' },
      { slug: 'css', self: 70, assessed: 72, computed: 71, status: 'completed' },
      { slug: 'javascript', self: 45, assessed: null, computed: 45, status: 'in_progress' },
      { slug: 'git-github', self: 60, assessed: null, computed: 60, status: 'completed' },
      { slug: 'react', self: 25, assessed: null, computed: 25, status: 'not_started' },
      { slug: 'sql-databases', self: 35, assessed: null, computed: 35, status: 'not_started' },
      { slug: 'dsa-arrays-strings', self: 40, assessed: null, computed: 40, status: 'in_progress' }
    ];

    const insertStudentSkill = db.prepare(`
      INSERT INTO student_skills (user_id, skill_id, self_proficiency, assessed_proficiency, computed_proficiency, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const rs of rohitSkills) {
      const sId = sMap.get(rs.slug);
      if (sId) {
        insertStudentSkill.run(demoUserId, sId, rs.self, rs.assessed, rs.computed, rs.status);
      }
    }

    // Seed Rohit's Projects
    const portfolioProj = db.prepare("SELECT id FROM projects WHERE slug = 'developer-portfolio'").get() as { id: number } | undefined;
    if (portfolioProj) {
      db.prepare(`
        INSERT INTO student_projects (user_id, project_id, status, github_repo_url, live_demo_url, completed_checklist_json, completed_at)
        VALUES (?, ?, 'completed', 'https://github.com/rohit-sharma-dev/my-portfolio', 'https://rohit-portfolio-sample.vercel.app', ?, datetime('now', '-7 days'))
      `).run(
        demoUserId,
        portfolioProj.id,
        JSON.stringify([
          'Semantic header, main, and footer layout',
          'Mobile navigation menu with accessible touch targets',
          'Project cards with screenshots and repository links',
          'Contact form with client-side field validation',
          'Deploy on GitHub Pages or Vercel with clean README'
        ])
      );
    }

    // Seed DSA Topics for Rohit
    const dsaTopics = [
      { topic: 'Arrays & Two Pointers', solved: 12, total: 15, status: 'in_progress', order: 1 },
      { topic: 'Strings & Hashing', solved: 8, total: 12, status: 'in_progress', order: 2 },
      { topic: 'Searching & Binary Search', solved: 5, total: 10, status: 'not_started', order: 3 },
      { topic: 'Sorting Algorithms', solved: 4, total: 8, status: 'not_started', order: 4 },
      { topic: 'Linked Lists', solved: 0, total: 12, status: 'not_started', order: 5 },
      { topic: 'Stack & Queue', solved: 0, total: 10, status: 'not_started', order: 6 },
      { topic: 'Binary Trees & BST', solved: 0, total: 15, status: 'not_started', order: 7 },
      { topic: 'Graphs & Traversals', solved: 0, total: 15, status: 'not_started', order: 8 }
    ];

    const insertDsa = db.prepare(`
      INSERT INTO dsa_topics (user_id, topic, problems_solved, total_problems, status, order_index)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const dt of dsaTopics) {
      insertDsa.run(demoUserId, dt.topic, dt.solved, dt.total, dt.status, dt.order);
    }

    // Seed tracked applications for Rohit
    const razorpayOpp = db.prepare("SELECT id FROM opportunities WHERE company = 'Razorpay'").get() as { id: number } | undefined;
    const postmanOpp = db.prepare("SELECT id FROM opportunities WHERE company = 'Postman'").get() as { id: number } | undefined;

    if (razorpayOpp) {
      db.prepare(`
        INSERT INTO applications (user_id, opportunity_id, status, applied_date, notes)
        VALUES (?, ?, 'applied', '2026-09-20', 'Applied via official portal with resume updated with portfolio project.')
      `).run(demoUserId, razorpayOpp.id);
    }

    if (postmanOpp) {
      db.prepare(`
        INSERT INTO applications (user_id, opportunity_id, status, applied_date, notes)
        VALUES (?, ?, 'saved', null, 'Bookmarked to apply once REST APIs and Node.js are completed.')
      `).run(demoUserId, postmanOpp.id);
    }

    // Seed Notifications for Rohit
    const insertNotif = db.prepare(`
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `);
    insertNotif.run(demoUserId, 'Welcome to SkillPath AI', 'Your personalized career path for Full Stack Developer has been initialized.', 'info');
    insertNotif.run(demoUserId, 'Next Action Available', 'Strengthen JavaScript fundamentals to unlock React in your roadmap.', 'roadmap');

    // Trigger initial roadmap for demo user
    seedDemoUserRoadmap(demoUserId);
  } else {
    demoUserId = existingDemo.id;
    // Always ensure existing demo user roadmap is verified and populated
    seedDemoUserRoadmap(demoUserId);
  }

  // Ensure all 20 standard careers and 40 skills are always available
  seedComprehensiveCareersAndSkills();
}

function seedDemoUserRoadmap(demoUserId: number) {
  try {
    // Ensure profile has career_goal_id = 1 and onboarding_completed = 1
    db.prepare(`
      UPDATE profiles
      SET career_goal_id = 1, onboarding_completed = 1
      WHERE user_id = ?
    `).run(demoUserId);

    let roadmap = db.prepare('SELECT id FROM roadmaps WHERE user_id = ?').get(demoUserId) as { id: number } | undefined;
    if (!roadmap) {
      const ins = db.prepare(`
        INSERT INTO roadmaps (user_id, career_id, title)
        VALUES (?, 1, 'Full Stack Developer Mastery Roadmap')
      `).run(demoUserId);
      roadmap = { id: Number(ins.lastInsertRowid) };
    }

    const existingCount = db.prepare('SELECT COUNT(*) as cnt FROM roadmap_items WHERE roadmap_id = ?').get(roadmap.id) as { cnt: number };
    if (existingCount.cnt === 0) {
      generateAndSaveUserRoadmap(demoUserId, false, 1);
    }
  } catch (err) {
    console.warn('[Seed] Note during demo roadmap check:', err);
  }
}
