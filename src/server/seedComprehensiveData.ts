import { db } from './db.js';

export function seedComprehensiveCareersAndSkills() {
  console.log('[Seed] Ensuring all 20 professional career options and 40 standard skills exist...');

  // 1. Ensure columns exist on profiles table
  try {
    const profileColumns = db.prepare("PRAGMA table_info(profiles)").all() as { name: string }[];
    const colNames = new Set(profileColumns.map(c => c.name));

    if (!colNames.has('learning_preference')) {
      db.exec("ALTER TABLE profiles ADD COLUMN learning_preference TEXT DEFAULT 'mixed'");
    }
    if (!colNames.has('career_priorities')) {
      db.exec("ALTER TABLE profiles ADD COLUMN career_priorities TEXT");
    }
    if (!colNames.has('certifications_json')) {
      db.exec("ALTER TABLE profiles ADD COLUMN certifications_json TEXT");
    }
    if (!colNames.has('experiences_json')) {
      db.exec("ALTER TABLE profiles ADD COLUMN experiences_json TEXT");
    }
    if (!colNames.has('custom_projects_json')) {
      db.exec("ALTER TABLE profiles ADD COLUMN custom_projects_json TEXT");
    }
  } catch (err) {
    console.error('Error migrating profiles columns:', err);
  }

  // 2. The 20 Professional Career Options
  const careersList = [
    {
      title: 'Full Stack Developer',
      slug: 'full-stack-developer',
      description: 'Build complete web applications spanning responsive frontends, backend APIs, authentication, and databases.',
      icon: 'Layers',
      category: 'Software Engineering',
      market_demand: 'Very High',
      avg_salary: '$95,000 - $145,000 / yr'
    },
    {
      title: 'Frontend Developer',
      slug: 'frontend-developer',
      description: 'Craft responsive, accessible, interactive web interfaces and client experiences with modern UI component architectures.',
      icon: 'Layout',
      category: 'Frontend Engineering',
      market_demand: 'High',
      avg_salary: '$90,000 - $135,000 / yr'
    },
    {
      title: 'Backend Developer',
      slug: 'backend-developer',
      description: 'Design robust server architectures, scalable microservices, REST APIs, database models, and secure authentication.',
      icon: 'Server',
      category: 'Backend Engineering',
      market_demand: 'Very High',
      avg_salary: '$105,000 - $155,000 / yr'
    },
    {
      title: 'Software Engineer',
      slug: 'software-engineer',
      description: 'Engineer high-quality software systems, algorithmic problem solving, clean system design, and production codebases.',
      icon: 'Terminal',
      category: 'Software Engineering',
      market_demand: 'Very High',
      avg_salary: '$110,000 - $160,000 / yr'
    },
    {
      title: 'AI / ML Engineer',
      slug: 'ai-ml-engineer',
      description: 'Train machine learning models, fine-tune neural networks, build generative AI workflows, and deploy inference pipelines.',
      icon: 'Cpu',
      category: 'Artificial Intelligence',
      market_demand: 'Exceptional',
      avg_salary: '$120,000 - $175,000 / yr'
    },
    {
      title: 'Data Scientist',
      slug: 'data-scientist',
      description: 'Analyze complex multi-dimensional datasets, build statistical prediction models, and derive strategic business value.',
      icon: 'TrendingUp',
      category: 'Data Science',
      market_demand: 'High',
      avg_salary: '$100,000 - $150,000 / yr'
    },
    {
      title: 'Data Analyst',
      slug: 'data-analyst',
      description: 'Extract business metrics, query relational databases with SQL, build visualizations, and deliver actionable insights.',
      icon: 'BarChart3',
      category: 'Data Science',
      market_demand: 'High',
      avg_salary: '$80,000 - $115,000 / yr'
    },
    {
      title: 'Data Engineer',
      slug: 'data-engineer',
      description: 'Construct resilient data pipelines, scalable ETL processes, data warehouses, and streaming infrastructure.',
      icon: 'Database',
      category: 'Data Engineering',
      market_demand: 'Very High',
      avg_salary: '$110,000 - $160,000 / yr'
    },
    {
      title: 'Cloud Engineer',
      slug: 'cloud-engineer',
      description: 'Architect, provision, and maintain reliable, secure multi-cloud environments across AWS, GCP, and Azure.',
      icon: 'Cloud',
      category: 'Cloud Engineering',
      market_demand: 'Very High',
      avg_salary: '$105,000 - $155,000 / yr'
    },
    {
      title: 'DevOps Engineer',
      slug: 'devops-engineer',
      description: 'Automate continuous integration and deployment pipelines, container orchestration, monitoring, and release reliability.',
      icon: 'GitBranch',
      category: 'DevOps & Infrastructure',
      market_demand: 'Very High',
      avg_salary: '$110,000 - $160,000 / yr'
    },
    {
      title: 'Cybersecurity Engineer',
      slug: 'cybersecurity-engineer',
      description: 'Protect computer networks, servers, and software systems from vulnerabilities, intrusion, and security threats.',
      icon: 'Shield',
      category: 'Cybersecurity',
      market_demand: 'Very High',
      avg_salary: '$105,000 - $155,000 / yr'
    },
    {
      title: 'Mobile App Developer',
      slug: 'mobile-developer',
      description: 'Build native and cross-platform mobile experiences for iOS and Android with responsive touch gestures and offline storage.',
      icon: 'Smartphone',
      category: 'Mobile Engineering',
      market_demand: 'High',
      avg_salary: '$95,000 - $140,000 / yr'
    },
    {
      title: 'Android Developer',
      slug: 'android-developer',
      description: 'Create modern Android applications using Kotlin, Android Studio, Jetpack Compose, and material UI guidelines.',
      icon: 'Smartphone',
      category: 'Mobile Engineering',
      market_demand: 'High',
      avg_salary: '$95,000 - $140,000 / yr'
    },
    {
      title: 'iOS Developer',
      slug: 'ios-developer',
      description: 'Develop premium iOS and iPadOS applications utilizing Swift, SwiftUI, Xcode, and Apple Human Interface Guidelines.',
      icon: 'Smartphone',
      category: 'Mobile Engineering',
      market_demand: 'High',
      avg_salary: '$100,000 - $145,000 / yr'
    },
    {
      title: 'Game Developer',
      slug: 'game-developer',
      description: 'Design and program 2D and 3D game mechanics, physics calculations, graphics shaders, and interactive player experiences.',
      icon: 'Gamepad2',
      category: 'Game Development',
      market_demand: 'Moderate',
      avg_salary: '$85,000 - $130,000 / yr'
    },
    {
      title: 'UI / UX Developer',
      slug: 'ui-ux-developer',
      description: 'Bridge user experience research, design system tokens, accessible typography, and pixel-perfect interactive frontend code.',
      icon: 'Palette',
      category: 'Design & Engineering',
      market_demand: 'High',
      avg_salary: '$85,000 - $125,000 / yr'
    },
    {
      title: 'Blockchain Developer',
      slug: 'blockchain-developer',
      description: 'Develop decentralized applications (dApps), smart contracts, token standards, and Web3 distributed ledger protocols.',
      icon: 'Coins',
      category: 'Blockchain',
      market_demand: 'Moderate',
      avg_salary: '$110,000 - $165,000 / yr'
    },
    {
      title: 'Embedded Systems Engineer',
      slug: 'embedded-systems-engineer',
      description: 'Program low-level microcontrollers, hardware device drivers, memory-constrained firmware, and real-time operating systems.',
      icon: 'Cpu',
      category: 'Hardware & Systems',
      market_demand: 'High',
      avg_salary: '$95,000 - $140,000 / yr'
    },
    {
      title: 'IoT Engineer',
      slug: 'iot-engineer',
      description: 'Connect sensor hardware, edge gateway devices, network communication protocols (MQTT), and cloud telemetry dashboards.',
      icon: 'Wifi',
      category: 'Internet of Things',
      market_demand: 'High',
      avg_salary: '$95,000 - $140,000 / yr'
    },
    {
      title: 'QA / Test Automation Engineer',
      slug: 'qa-automation-engineer',
      description: 'Guarantee software quality with automated test suites, end-to-end integration tests, regression pipelines, and performance audits.',
      icon: 'CheckSquare',
      category: 'Quality Assurance',
      market_demand: 'High',
      avg_salary: '$85,000 - $120,000 / yr'
    }
  ];

  const upsertCareer = db.prepare(`
    INSERT INTO careers (title, slug, description, icon, category, market_demand, avg_salary)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      description = excluded.description,
      icon = excluded.icon,
      category = excluded.category,
      market_demand = excluded.market_demand,
      avg_salary = excluded.avg_salary
  `);

  for (const c of careersList) {
    upsertCareer.run(c.title, c.slug, c.description, c.icon, c.category, c.market_demand, c.avg_salary);
  }

  // 3. The 40 Standard Skills across 6 Categories
  const skillsList = [
    // Programming
    { name: 'Python', slug: 'python', category: 'Programming', difficulty: 'Beginner', desc: 'Core language for scripting, automation, backend development, and AI/ML.', relevance: 'Primary language for AI/ML, data science, and modern scripting.' },
    { name: 'C', slug: 'c', category: 'Programming', difficulty: 'Intermediate', desc: 'Low-level procedural language teaching pointers, memory management, and hardware interactions.', relevance: 'Fundamental understanding of computer architecture and systems.' },
    { name: 'C++', slug: 'cpp', category: 'Programming', difficulty: 'Intermediate', desc: 'High-performance object-oriented language for systems, game engines, and competitive programming.', relevance: 'Standard for high-throughput systems, gaming, and DSA coding interviews.' },
    { name: 'Java', slug: 'java', category: 'Programming', difficulty: 'Intermediate', desc: 'Enterprise-grade object-oriented language for scalable backends and Android development.', relevance: 'Widespread corporate backend enterprise and mobile standard.' },
    { name: 'JavaScript', slug: 'javascript', category: 'Programming', difficulty: 'Beginner', desc: 'Essential programming language of the web for interactive client and server applications.', relevance: 'The core language of modern full-stack web engineering.' },
    { name: 'TypeScript', slug: 'typescript', category: 'Programming', difficulty: 'Intermediate', desc: 'Statically typed superset of JavaScript providing type safety and developer productivity.', relevance: 'Industry standard for robust large-scale web applications.' },
    { name: 'Go', slug: 'go', category: 'Programming', difficulty: 'Intermediate', desc: 'Fast, concurrent, statically typed language developed by Google for high-throughput cloud microservices.', relevance: 'Top choice for modern cloud-native backend systems and Kubernetes.' },
    { name: 'Rust', slug: 'rust', category: 'Programming', difficulty: 'Advanced', desc: 'Memory-safe systems language without garbage collection for high-performance concurrent computing.', relevance: 'Rapidly growing for high-performance infrastructure and Web3.' },

    // Web Development
    { name: 'HTML5', slug: 'html5', category: 'Web Development', difficulty: 'Beginner', desc: 'Semantic markup language defining modern web structure, accessibility, and forms.', relevance: 'Essential foundation for any web developer.' },
    { name: 'CSS3', slug: 'css3', category: 'Web Development', difficulty: 'Beginner', desc: 'Styling language for responsive layouts, Flexbox, CSS Grid, animations, and visual presentation.', relevance: 'Crucial for clean, mobile-first user interfaces.' },
    { name: 'Tailwind CSS', slug: 'tailwind', category: 'Web Development', difficulty: 'Beginner', desc: 'Utility-first CSS framework for rapid UI development and design token systems.', relevance: 'High developer velocity and consistent modern styling.' },
    { name: 'React', slug: 'react', category: 'Web Development', difficulty: 'Intermediate', desc: 'Declarative component-based frontend library for dynamic user interfaces and single-page apps.', relevance: 'The most popular frontend library worldwide.' },
    { name: 'Next.js', slug: 'nextjs', category: 'Web Development', difficulty: 'Intermediate', desc: 'Production React framework offering server-side rendering, static site generation, and full-stack API routes.', relevance: 'Standard for modern full-stack React web applications.' },
    { name: 'Node.js', slug: 'nodejs', category: 'Web Development', difficulty: 'Intermediate', desc: 'Asynchronous event-driven JavaScript runtime for scalable backend servers and tooling.', relevance: 'Enables high-performance server-side JavaScript applications.' },
    { name: 'Express.js', slug: 'express', category: 'Web Development', difficulty: 'Intermediate', desc: 'Minimalist and flexible web application framework for building RESTful Node.js APIs.', relevance: 'De-facto lightweight backend framework for Node.js.' },
    { name: 'REST APIs', slug: 'rest-apis', category: 'Web Development', difficulty: 'Intermediate', desc: 'Architectural style for HTTP communication, endpoints, status codes, and JSON serialization.', relevance: 'The communication standard between client and server architectures.' },

    // Database
    { name: 'SQL', slug: 'sql', category: 'Database', difficulty: 'Beginner', desc: 'Standard query language for storing, manipulating, and retrieving structured relational data.', relevance: 'The foundational standard for reliable persistent structured data.' },
    { name: 'PostgreSQL', slug: 'postgresql', category: 'Database', difficulty: 'Intermediate', desc: 'Advanced open-source object-relational database system with robust ACID guarantees and JSON support.', relevance: 'Top relational database choice for production backends.' },
    { name: 'MySQL', slug: 'mysql', category: 'Database', difficulty: 'Intermediate', desc: 'Widely used relational database management system for web applications and enterprise systems.', relevance: 'Ubiquitous relational database in web hosting and industry.' },
    { name: 'MongoDB', slug: 'mongodb', category: 'Database', difficulty: 'Intermediate', desc: 'Document-oriented NoSQL database for flexible JSON-like data models and horizontal scalability.', relevance: 'Popular choice for flexible schema document storage.' },

    // Data & AI
    { name: 'NumPy', slug: 'numpy', category: 'Data & AI', difficulty: 'Beginner', desc: 'Fundamental Python library for numerical computing, multi-dimensional arrays, and vector math.', relevance: 'Foundational bedrock for all scientific Python and AI calculations.' },
    { name: 'Pandas', slug: 'pandas', category: 'Data & AI', difficulty: 'Intermediate', desc: 'Essential Python library for data manipulation, cleaning, aggregation, and tabular DataFrame analysis.', relevance: 'Daily necessity for data analysis, transformation, and feature engineering.' },
    { name: 'Machine Learning', slug: 'machine-learning', category: 'Data & AI', difficulty: 'Intermediate', desc: 'Supervised and unsupervised algorithms, regression, classification, clustering, and model evaluation.', relevance: 'Core engine for data predictions and modern intelligent applications.' },
    { name: 'Deep Learning', slug: 'deep-learning', category: 'Data & AI', difficulty: 'Advanced', desc: 'Artificial neural networks, convolutional networks, transformers, and backpropagation.', relevance: 'Powers computer vision, speech synthesis, and modern generative AI.' },
    { name: 'Generative AI', slug: 'generative-ai', category: 'Data & AI', difficulty: 'Intermediate', desc: 'Large language models, prompting, embeddings, retrieval-augmented generation (RAG), and fine-tuning.', relevance: 'Highest-demand emerging technology for automated reasoning and software.' },
    { name: 'Data Visualization', slug: 'data-visualization', category: 'Data & AI', difficulty: 'Beginner', desc: 'Communicating data patterns visually using charts, dashboards, Matplotlib, Seaborn, or Plotly.', relevance: 'Crucial for conveying analytical conclusions to stakeholders.' },

    // Core CS / DSA
    { name: 'Data Structures', slug: 'data-structures', category: 'Core CS / DSA', difficulty: 'Intermediate', desc: 'Foundational memory organizations for efficient data access, insertion, and traversal.', relevance: 'Fundamental building block for engineering interviews and performant code.' },
    { name: 'Algorithms', slug: 'algorithms', category: 'Core CS / DSA', difficulty: 'Intermediate', desc: 'Step-by-step computational procedures, asymptotic time/space complexity analysis (Big-O).', relevance: 'Core benchmark for technical problem solving and software efficiency.' },
    { name: 'Arrays & Strings', slug: 'arrays-strings', category: 'Core CS / DSA', difficulty: 'Beginner', desc: 'Two pointers, sliding window, prefix sums, string matching, and array manipulations.', relevance: 'Most frequent topic in coding assessments and technical screenings.' },
    { name: 'Linked Lists', slug: 'linked-lists', category: 'Core CS / DSA', difficulty: 'Intermediate', desc: 'Singly/doubly linked chains, pointer operations, cycle detection, and list reversals.', relevance: 'Deepens understanding of pointers, memory references, and linked structures.' },
    { name: 'Stacks & Queues', slug: 'stacks-queues', category: 'Core CS / DSA', difficulty: 'Intermediate', desc: 'LIFO/FIFO linear structures, monotonic stacks, expression parsing, and sliding window maximums.', relevance: 'Essential for parser design, task queues, and graph traversals.' },
    { name: 'Trees & Graphs', slug: 'trees-graphs', category: 'Core CS / DSA', difficulty: 'Advanced', desc: 'Binary search trees, DFS/BFS traversals, shortest path algorithms, and topological sorting.', relevance: 'Ubiquitous in hierarchical data management, dependency tracking, and routing.' },
    { name: 'Object-Oriented Programming', slug: 'oop', category: 'Core CS / DSA', difficulty: 'Beginner', desc: 'Encapsulation, inheritance, polymorphism, abstraction, and software design principles.', relevance: 'Key structural paradigm for clean, maintainable software architectures.' },

    // DevOps / Cloud
    { name: 'Git & GitHub', slug: 'git-github', category: 'DevOps / Cloud', difficulty: 'Beginner', desc: 'Distributed version control, branches, pull requests, commits, and collaborative workflows.', relevance: 'Universal requirement for all collaborative software development.' },
    { name: 'Docker', slug: 'docker', category: 'DevOps / Cloud', difficulty: 'Intermediate', desc: 'Container platform packaging applications and dependencies into reproducible container images.', relevance: 'Standardizes environments from local development through production deployment.' },
    { name: 'Linux', slug: 'linux', category: 'DevOps / Cloud', difficulty: 'Beginner', desc: 'Core terminal commands, bash scripting, file permissions, process management, and server administration.', relevance: 'The operating system running the vast majority of cloud servers worldwide.' },
    { name: 'CI/CD', slug: 'ci-cd', category: 'DevOps / Cloud', difficulty: 'Intermediate', desc: 'Continuous integration and automated deployment pipelines using GitHub Actions or automated runners.', relevance: 'Automates testing, linting, building, and delivering software updates safely.' },
    { name: 'Cloud Fundamentals', slug: 'cloud-fundamentals', category: 'DevOps / Cloud', difficulty: 'Beginner', desc: 'Core cloud computing concepts, virtualization, storage, serverless, and IAM security.', relevance: 'Foundation for deploying applications to AWS, GCP, and Azure.' }
  ];

  const upsertSkill = db.prepare(`
    INSERT INTO skills (name, slug, category, difficulty, description, career_relevance)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      category = excluded.category,
      difficulty = excluded.difficulty,
      description = excluded.description,
      career_relevance = excluded.career_relevance
  `);

  for (const s of skillsList) {
    upsertSkill.run(s.name, s.slug, s.category, s.difficulty, s.desc, s.relevance);
  }

  // 4. Connect Core Career Skills for the 20 Careers
  const careerSkillMappings: Record<string, string[]> = {
    'full-stack-developer': ['HTML5', 'CSS3', 'Tailwind CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'Node.js', 'Express.js', 'REST APIs', 'SQL', 'PostgreSQL', 'Git & GitHub', 'Docker', 'Data Structures'],
    'frontend-developer': ['HTML5', 'CSS3', 'Tailwind CSS', 'JavaScript', 'TypeScript', 'React', 'Next.js', 'REST APIs', 'Git & GitHub', 'Data Structures', 'Algorithms'],
    'backend-developer': ['Python', 'Java', 'JavaScript', 'TypeScript', 'Node.js', 'Express.js', 'Go', 'REST APIs', 'SQL', 'PostgreSQL', 'MongoDB', 'Docker', 'Git & GitHub', 'Data Structures'],
    'software-engineer': ['C++', 'Java', 'Python', 'Data Structures', 'Algorithms', 'Arrays & Strings', 'Trees & Graphs', 'Object-Oriented Programming', 'SQL', 'Git & GitHub', 'Linux'],
    'ai-ml-engineer': ['Python', 'NumPy', 'Pandas', 'Machine Learning', 'Deep Learning', 'Generative AI', 'Data Visualization', 'SQL', 'Git & GitHub', 'Algorithms'],
    'data-scientist': ['Python', 'SQL', 'NumPy', 'Pandas', 'Data Visualization', 'Machine Learning', 'Deep Learning', 'Algorithms', 'Git & GitHub'],
    'data-analyst': ['SQL', 'Python', 'Pandas', 'NumPy', 'Data Visualization', 'PostgreSQL', 'MySQL', 'Git & GitHub'],
    'data-engineer': ['Python', 'SQL', 'PostgreSQL', 'MySQL', 'MongoDB', 'Docker', 'Linux', 'CI/CD', 'Git & GitHub', 'Data Structures'],
    'cloud-engineer': ['Linux', 'Cloud Fundamentals', 'Docker', 'CI/CD', 'Git & GitHub', 'Python', 'Go', 'REST APIs', 'SQL'],
    'devops-engineer': ['Linux', 'Docker', 'CI/CD', 'Git & GitHub', 'Cloud Fundamentals', 'Python', 'Go', 'REST APIs'],
    'cloud-devops': ['Linux', 'Cloud Fundamentals', 'Docker', 'CI/CD', 'Git & GitHub', 'Python', 'Go', 'REST APIs', 'SQL'],
    'cybersecurity-engineer': ['Linux', 'Python', 'Cloud Fundamentals', 'SQL', 'Git & GitHub', 'C', 'REST APIs'],
    'mobile-developer': ['JavaScript', 'TypeScript', 'React', 'REST APIs', 'Git & GitHub', 'HTML5', 'CSS3', 'Tailwind CSS'],
    'android-developer': ['Java', 'Object-Oriented Programming', 'Data Structures', 'REST APIs', 'Git & GitHub', 'SQL'],
    'ios-developer': ['Object-Oriented Programming', 'Data Structures', 'Algorithms', 'REST APIs', 'Git & GitHub'],
    'game-developer': ['C++', 'C', 'Object-Oriented Programming', 'Data Structures', 'Algorithms', 'Git & GitHub'],
    'ui-ux-developer': ['HTML5', 'CSS3', 'Tailwind CSS', 'JavaScript', 'React', 'TypeScript', 'Git & GitHub'],
    'blockchain-developer': ['Rust', 'Go', 'JavaScript', 'TypeScript', 'Data Structures', 'Algorithms', 'Git & GitHub'],
    'embedded-systems-engineer': ['C', 'C++', 'Linux', 'Data Structures', 'Git & GitHub'],
    'iot-engineer': ['C', 'Python', 'Linux', 'REST APIs', 'Cloud Fundamentals', 'Git & GitHub'],
    'qa-automation-engineer': ['Python', 'JavaScript', 'TypeScript', 'REST APIs', 'Git & GitHub', 'CI/CD', 'SQL', 'Docker']
  };

  const insertCareerSkill = db.prepare(`
    INSERT INTO career_skills (career_id, skill_id, required_level, is_optional, order_index)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const [careerSlug, skillNames] of Object.entries(careerSkillMappings)) {
    const career = db.prepare('SELECT id FROM careers WHERE slug = ?').get(careerSlug) as { id: number } | undefined;
    if (!career) continue;

    // Check existing count for this career
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM career_skills WHERE career_id = ?').get(career.id) as { count: number };
    if (existingCount.count < 3) {
      db.prepare('DELETE FROM career_skills WHERE career_id = ?').run(career.id);
      let order = 1;
      for (const sName of skillNames) {
        const skill = db.prepare('SELECT id FROM skills WHERE name = ?').get(sName) as { id: number } | undefined;
        if (skill) {
          insertCareerSkill.run(career.id, skill.id, 80, 0, order++);
        }
      }
    }
  }

  console.log('[Seed] All 20 careers and 40 standard skills verified and configured.');
}
