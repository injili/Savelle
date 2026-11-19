/**
 * Site-wide structured content for Savelle Group Africa.
 * Copy is taken verbatim from SAVELLE_BUILD_PROMPT.md PART B.
 * Placeholders are marked [TBC] and listed in LAUNCH_CHECKLIST.md.
 */

export type PatternKind = 'flow' | 'contour' | 'network' | 'orbits' | 'ribbon'

export interface NavLink {
  label: string
  to: string
}

/** Image slot: `src` stays empty until photography is supplied (see LAUNCH_CHECKLIST.md). */
export interface ImageSlot {
  id: string
  src: string
  alt: string
  pattern: PatternKind
  seed: number
  /** Suggested Unsplash search for a placeholder/replacement photo. */
  suggestion: string
}

export const site = {
  name: 'Savelle Group Africa',
  wordmark: 'SAVELLE GROUP AFRICA',
  indexPrefix: 'SGA',

  // B1
  brand: {
    coreIdea: 'Understanding systems. Anticipating change. Shaping what comes next.',
    summary:
      'Savelle Group Africa helps organisations, institutions and businesses make better decisions, strengthen the systems they depend on and prepare for the futures they want to shape.',
    positioning:
      'Savelle Group Africa is a strategy, systems and intelligence advisory firm helping organisations understand complex challenges, make evidence-informed decisions and build the capabilities required for long-term relevance and impact.',
    promise:
      'We help you see the whole system, make sense of the evidence and turn strategic insight into practical action.',
  },

  // A6 / B1
  nav: [
    { label: 'Home', to: '/' },
    { label: 'About', to: '/about' },
    { label: 'What We Do', to: '/what-we-do' },
    { label: 'Our Approach', to: '/our-approach' },
    { label: 'Our Work', to: '/our-work' },
    { label: 'Insights', to: '/insights' },
    { label: 'Contact', to: '/contact' },
  ] satisfies NavLink[],

  // B10
  footerNav: [
    { label: 'About', to: '/about' },
    { label: 'Capabilities', to: '/what-we-do' },
    { label: 'Our Approach', to: '/our-approach' },
    { label: 'Our Work', to: '/our-work' },
    { label: 'Insights', to: '/insights' },
    { label: 'Contact', to: '/contact' },
    { label: 'Privacy', to: '/privacy' },
  ] satisfies NavLink[],

  footerDescription:
    'Savelle Group Africa is a strategy, systems and intelligence advisory firm helping organisations understand complexity, anticipate change and turn evidence into practical action.',

  // B10 calls to action
  ctas: {
    exploreCapabilities: 'Explore our capabilities',
    seeHowWeWork: 'See how we work',
    exploreResearch: 'Explore our research',
    viewEngagements: 'View selected engagements',
    discussChallenge: 'Discuss a strategic challenge',
    requestConversation: 'Request an introductory conversation',
    partner: 'Partner with Savelle',
    submitEnquiry: 'Submit an enquiry',
    // B2 buttons
    startConversation: 'Start a conversation',
    exploreWork: 'Explore our work',
    tellUs: 'Tell us what you are working on',
  },

  // B9 — ALL PLACEHOLDERS. Fill before launch (LAUNCH_CHECKLIST.md, gate 7).
  // Empty strings are hidden in production; '[TBC]' is shown in dev/preview.
  contact: {
    generalEmail: '', // [TBC] e.g. hello@…
    partnershipsEmail: '', // [TBC]
    location: '', // [TBC]
    linkedin: '', // [TBC] full https:// URL
  },

  // Service anchor → enquiry form option (pre-selects the form from "Discuss a strategic challenge")
  serviceEnquiryType: {
    'systems-analysis': 'Systems & institutional strategy',
    'strategy': 'Strategic advisory',
    'foresight': 'Foresight',
    'research': 'Research',
    'data-intelligence': 'Data intelligence',
    'organisational-development': 'Organisational or business development',
  } as Record<string, string>,

  // Home: Featured Work behaviour.
  // 'auto'       → show case cards that are visible (published, or drafts in dev/preview);
  //                if none are visible, show intro + CTA only.
  // 'intro-only' → always intro + CTA only.
  // 'hidden'     → hide the section.
  featuredWork: 'auto' as 'auto' | 'intro-only' | 'hidden',

  // Image slots (no photography supplied yet → procedural halftones)
  images: {
    capabilities: [
      { id: 'cap-systems', src: '', alt: '', pattern: 'network', seed: 3, suggestion: 'African city aerial, transport interchange' },
      { id: 'cap-strategy', src: '', alt: '', pattern: 'contour', seed: 11, suggestion: 'leadership team workshop, Nairobi or Lagos' },
      { id: 'cap-foresight', src: '', alt: '', pattern: 'flow', seed: 7, suggestion: 'African landscape horizon, savanna at dawn' },
      { id: 'cap-research', src: '', alt: '', pattern: 'orbits', seed: 5, suggestion: 'field research interview, community meeting' },
      { id: 'cap-growth', src: '', alt: '', pattern: 'network', seed: 19, suggestion: 'small business owners, African market' },
    ],
    hero: { id: 'hero', src: '/images/hero-hands.jpg', alt: 'A robotic hand reaching down toward an open human hand', pattern: 'ribbon', seed: 1, suggestion: 'client-supplied photo (robotic hand reaching toward a human hand); ribbon pattern is the fallback if it fails to load' },
    insights: { id: 'insights', src: '', alt: '', pattern: 'contour', seed: 23, suggestion: 'library or archive, Dakar/Accra/Kigali' },
    about: { id: 'about', src: '', alt: '', pattern: 'orbits', seed: 31, suggestion: 'institution building facade, Kigali or Addis Ababa' },
    whereWeWork: { id: 'where', src: '', alt: '', pattern: 'contour', seed: 41, suggestion: 'satellite or topographic view of the African continent' },
    contact: { id: 'contact', src: '', alt: '', pattern: 'network', seed: 53, suggestion: 'conversation at a table, hands and notebooks' },
  } satisfies Record<string, ImageSlot | ImageSlot[]>,

  // B2
  home: {
    hero: {
      headlineLines: ['Understanding systems.', 'Anticipating change.'],
      tagline: 'Shaping what comes next.',
      // B2 hero body, verbatim; each paragraph is paired with one of the B2 hero buttons
      body: [
        'Savelle Group Africa is a strategy, systems and intelligence advisory firm. We work with organisations, institutions and businesses to make sense of complex environments, strengthen the systems they depend on and turn evidence into decisions that move them forward.',
        'We bring together systems thinking, strategic advisory, foresight, research and data to help leaders see beyond immediate challenges and build for the long term.',
      ],
    },
    intro: {
      label: 'Complex challenges need more than isolated solutions.',
      paragraphs: [
        'Organisations rarely operate in isolation. Their performance is shaped by policies, markets, institutions, people, technologies, relationships and the wider conditions around them. When these connections are overlooked, even well-designed interventions can produce limited or short-lived results.',
        'Savelle takes a systems view. We examine how the parts connect, identify the constraints that shape outcomes and help clients design strategies that respond to the full picture. Our work connects analysis with implementation so that decisions are informed by evidence and built for real operating conditions.',
      ],
    },
    capabilities: {
      title: 'What we help you do',
      items: [
        {
          title: 'Systems & Institutional Strategy',
          body: 'Understand how your organisation or operating environment works, identify structural constraints and design stronger systems.',
          links: [{ anchor: 'systems-analysis' }],
        },
        {
          title: 'Strategic Planning & Advisory',
          body: 'Set direction, make choices and translate ambition into priorities, operating models and executable roadmaps.',
          links: [{ anchor: 'strategy' }],
        },
        {
          title: 'Foresight & Future Readiness',
          body: 'Explore emerging trends, uncertainties and plausible futures so you can anticipate change rather than simply react to it.',
          links: [{ anchor: 'foresight' }],
        },
        {
          // Maps to two services on What We Do (naming mismatch flagged in LAUNCH_CHECKLIST.md)
          title: 'Research & Data Intelligence',
          body: 'Generate, analyse and translate evidence into insights that support policy, investment, organisational and programme decisions.',
          // Link labels are UI microcopy (short service names)
          links: [{ anchor: 'research', label: 'Research & policy' }, { anchor: 'data-intelligence', label: 'Data intelligence' }],
        },
        {
          title: 'Organisational & Business Growth',
          body: 'Strengthen the structures, capabilities, partnerships and business development systems needed to grow sustainably.',
          links: [{ anchor: 'organisational-development' }],
        },
      ],
    },
    approach: {
      title: 'From understanding to action.',
      intro:
        'We move through four connected stages: understand the system, develop strategic insight, design a response and support the move from plan to practice.',
      steps: [
        { n: '01', title: 'Understand', body: 'We listen, map the context, review available evidence and identify the actors, incentives, relationships and constraints shaping the challenge.' },
        { n: '02', title: 'Anticipate', body: 'We analyse trends, test assumptions and explore plausible futures to understand what may change and what needs to be prepared for.' },
        { n: '03', title: 'Design', body: 'We translate findings into strategic choices, institutional arrangements, operating models, programmes and practical roadmaps.' },
        { n: '04', title: 'Activate & learn', body: 'We support implementation planning, define measures of progress and build feedback loops so that strategies can adapt as conditions change.' },
      ],
    },
    why: {
      title: 'A connected view of the challenge.',
      intro:
        'Our work sits at the intersection of systems, strategy and evidence. We do not treat research as an endpoint or strategy as a document. We connect the two: using evidence to understand the system, strategy to define a direction and practical tools to support action.',
      pillars: [
        { title: 'Systems perspective', body: 'we look at relationships, incentives and root causes—not only visible symptoms.' },
        { title: 'Evidence-led decisions', body: 'we combine research, data and contextual knowledge to make complex issues more understandable.' },
        { title: 'Future readiness', body: 'we help clients prepare for uncertainty, disruption and emerging opportunities.' },
        { title: 'Practical orientation', body: 'we translate insight into clear choices, responsibilities, measures and next steps.' },
      ],
    },
    featuredWork: {
      title: 'Evidence that informs action.',
      intro:
        'Our engagements span organisational growth, resource mobilisation, digital transformation and institutional development. Explore selected examples of how we help organisations clarify challenges, strengthen their approach and build the foundations for progress.',
    },
    closing: {
      title: 'The next decision starts with a better understanding.',
      body: 'Whether you are navigating organisational change, developing a new strategy, entering a market or trying to understand a complex development challenge, Savelle can help you find the signal, define the choices and build a way forward.',
    },
  },

  // B3
  about: {
    headline: 'We help leaders make sense of complexity and build what comes next.',
    paragraphs: [
      'Savelle Group Africa was established around a simple conviction: lasting progress depends on the quality of the systems, decisions and institutions that shape it. Good ideas matter, but they need sound strategy, relevant evidence, capable organisations and an understanding of the environments in which they must work.',
      'We partner with organisations, businesses and institutions to examine complex challenges, identify opportunities and develop practical responses. Our work combines systems thinking, strategic advisory, foresight, research and data intelligence to help clients move from fragmented activity to clearer direction and stronger execution.',
    ],
    mission:
      'To help organisations and institutions make better decisions and deliver sustainable progress through systems thinking, strategic insight, foresight, research and data.',
    vision:
      'A future in which African organisations and institutions are equipped to understand change, act on evidence and build systems that create lasting value.',
    philosophy: {
      title: 'The problem is rarely isolated. Neither should the solution be.',
      body: 'A service delivery challenge may be shaped by policy, infrastructure, incentives, funding and institutional capacity. A business growth challenge may be connected to market structure, customer behaviour, regulation, technology and internal processes. We look at these connections because understanding them leads to better questions—and better decisions.',
    },
    valuesTitle: 'What guides our work',
    values: [
      { title: 'Curiosity', body: 'We ask better questions before rushing to solutions.' },
      { title: 'Evidence', body: 'We value credible data, sound methods and transparent reasoning.' },
      { title: 'Systems thinking', body: 'We examine relationships, feedback loops, incentives and root causes.' },
      { title: 'Foresight', body: 'We take the long view and prepare for more than one possible future.' },
      { title: 'Integrity', body: 'We communicate clearly about what the evidence does—and does not—show.' },
      { title: 'Usefulness', body: 'We turn analysis into decisions, tools and actions that clients can apply.' },
    ],
    // DRAFT — gate 6. Attribution only renders when founderName is filled, or in dev/preview.
    founder: {
      paragraphs: [
        'At Savelle, we believe that the quality of our decisions is shaped by the quality of our understanding. Across Africa, organisations are navigating interconnected challenges: shifting markets, changing technologies, institutional constraints, resource pressures and new expectations from the people they serve. These challenges cannot be addressed through isolated interventions or plans that sit on a shelf.',
        'Our work is to help make complexity more navigable. We bring together systems thinking, strategy, foresight, research and data so that leaders can understand where they are, see what may lie ahead and make deliberate choices about what to do next.',
        'We approach every engagement as a partnership—grounded in context, informed by evidence and focused on building capabilities that last.',
      ],
      founderName: '', // [TBC]
      role: 'Founder, Savelle Group Africa',
    },
  },

  // B6 (rendered on /about#who-we-work-with)
  audiences: {
    title: 'For organisations making decisions in complex environments.',
    intro:
      'We work with teams that need to understand a challenge, make a strategic choice, strengthen an institution or prepare for change. Our methods are adaptable across sectors and organisational stages.',
    items: [
      { title: 'Public institutions & government agencies', body: 'We support institutional analysis, policy research, service-system diagnostics, strategic planning and evidence-informed decision-making.' },
      { title: 'Development organisations, NGOs & foundations', body: 'We help strengthen organisational systems, theories of change, research and learning approaches, resource mobilisation strategies and programme design.' },
      { title: 'Businesses & growing enterprises', body: 'We support market and operating-environment analysis, strategic positioning, business development systems and future-readiness.' },
      { title: 'Research, innovation & ecosystem actors', body: 'We help map ecosystems, analyse stakeholder relationships, develop evidence products and translate research into decisions.' },
      { title: 'Regional and international partners', body: 'We provide contextual analysis, stakeholder intelligence and strategy support for organisations working across African markets and institutions.' },
    ],
    whereWeWork: {
      title: 'Where we work',
      body: "Savelle is based in Africa and works across African contexts through locally grounded research, remote collaboration and partnerships. Our geographic scope for each assignment is defined by the client's needs, the research question and the available delivery capacity.",
    },
  },

  // B4 intro (services themselves live in content/services)
  whatWeDo: {
    headline: 'Insight for better decisions. Strategy for meaningful progress.',
    intro:
      'Savelle brings together complementary capabilities to help clients understand complex environments, set direction and strengthen the systems required to deliver. Our services can be commissioned individually or combined into a broader engagement.',
  },

  // B5
  approach: {
    headline: 'A disciplined process. A response built around your context.',
    intro:
      'Every challenge is different, but our process is consistent: understand before prescribing, test assumptions before committing, and connect recommendations to the realities of implementation. We work collaboratively with clients and adapt the depth of each stage to the scale and complexity of the assignment.',
    stages: [
      {
        n: '01',
        title: 'Diagnose',
        subhead: 'Understand the context and define the real question.',
        body: 'We begin by clarifying the decision or challenge the client needs to address. We review existing information, engage relevant stakeholders and map the system, organisation or market. We identify what is known, what remains uncertain and where further evidence is needed.',
        activities: ['Discovery discussions', 'document review', 'stakeholder mapping', 'baseline assessment', 'problem definition'],
      },
      {
        n: '02',
        title: 'Analyse & anticipate',
        subhead: 'Make sense of the evidence and explore what may change.',
        body: 'We analyse the drivers shaping the issue, test assumptions and identify patterns, constraints and opportunities. Where the future is uncertain, we use foresight tools to explore plausible scenarios and stress-test current plans.',
        activities: ['Research and data analysis', 'systems mapping', 'trend scanning', 'scenario analysis', 'options assessment'],
      },
      {
        n: '03',
        title: 'Design the response',
        subhead: 'Translate insight into strategy and practical choices.',
        body: 'We work with the client to identify priorities and design a response that fits the context. This may include a strategy, operating model, institutional roadmap, measurement framework, research agenda or resource mobilisation plan.',
        activities: ['Strategic options', 'recommendations', 'roadmap', 'governance and accountability arrangements', 'indicators and responsibilities'],
      },
      {
        n: '04',
        title: 'Activate, measure & adapt',
        subhead: 'Support implementation and build learning into the system.',
        body: 'A strategy becomes valuable when it informs action. We help define implementation steps, decision rights, milestones and measures. We encourage regular review so that the approach can adapt as new evidence and conditions emerge.',
        activities: ['Implementation plan', 'performance measures', 'learning loops', 'review cadence', 'adaptation recommendations'],
      },
    ],
    howWeEngage: {
      title: 'How we engage',
      body: 'We offer scoped advisory assignments, research projects, strategy development, facilitated workshops and longer-term support. The scope, timeline, team and deliverables are agreed with each client before work begins. Where a challenge requires specialist expertise, we work with relevant collaborators and make roles clear.',
    },
  },

  // B7
  work: {
    headline: 'Turning complex questions into practical frameworks.',
    intro:
      'Our work is shaped by the questions organisations need to answer: How do we grow sustainably? What is preventing our systems from working? Where should we focus resources? What is changing around us? What evidence do we need to make a better decision?',
    evidenceStandard: {
      title: 'Our evidence standard',
      body: 'We aim to communicate our work responsibly. Client names and logos are used only with permission. Results are described with clear definitions and time periods. Targets, proposals and projected outcomes are never presented as completed results.',
    },
    headings: {
      challenge: 'The challenge',
      contribution: "Savelle's contribution",
      proposedContribution: "Savelle's proposed contribution",
      strategicFocus: 'The strategic focus',
      whatThisDemonstrates: 'What this demonstrates',
    },
    // UI microcopy (not in brief)
    emptyState: 'Selected engagements will be published here once client permissions are confirmed.',
  },

  // B8
  insights: {
    headline: 'Our thinking.',
    intro:
      'Ideas, evidence and perspectives on the systems shaping organisations, institutions and economies across Africa. We publish to make complex issues more understandable and to support better decisions.',
    categories: [
      { id: 'research-analysis', title: 'Research & analysis', body: 'Evidence reviews, policy analysis, institutional research and data-led perspectives on the issues shaping our operating environments.' },
      { id: 'strategy-systems', title: 'Strategy & systems', body: 'Practical thinking on systems change, organisational performance, governance, institutional capacity and strategic execution.' },
      { id: 'foresight-futures', title: 'Foresight & futures', body: 'Signals, trends, uncertainties and scenarios that help organisations prepare for emerging risks and opportunities.' },
      { id: 'data-intelligence', title: 'Data & intelligence', body: 'Methods, measurement approaches and insights that turn information into useful decisions.' },
    ],
    // UI microcopy (not in brief)
    forthcoming: 'Forthcoming',
    allLabel: 'All',
  },

  // B9
  contactPage: {
    headline: 'Start with the question you are trying to answer.',
    intro:
      'Whether you are working through a complex institutional challenge, developing a new strategy, exploring an uncertain future or trying to make better use of your data, we would be glad to understand what you are working on.',
    formTitle: 'Tell us about your challenge.',
    formIntro:
      'Share a little about your organisation, the issue you are navigating and the kind of support you are looking for. A member of the Savelle team will review your enquiry and follow up to explore whether and how we can help.',
    fields: {
      fullName: 'Full name',
      organisation: 'Organisation',
      email: 'Work email',
      location: 'Country / location',
      enquiryType: 'What best describes your enquiry?',
      challenge: 'What challenge or opportunity are you working on?',
      timeframe: 'Expected timeframe (if known)',
    },
    enquiryTypes: [
      'Systems & institutional strategy',
      'Strategic advisory',
      'Foresight',
      'Research',
      'Data intelligence',
      'Organisational or business development',
      'Partnership',
      'Other',
    ],
    submit: 'Submit enquiry',
    // Brief: "Information submitted through this form will be used to respond to your enquiry. [Link to Savelle's privacy notice.]"
    privacyNote: 'Information submitted through this form will be used to respond to your enquiry.',
    privacyLinkText: 'Read our privacy notice.',
    detailsLabels: {
      general: 'General enquiries',
      partnerships: 'Partnerships',
      location: 'Location',
      linkedin: 'LinkedIn',
    },
    // UI microcopy (not in brief)
    messages: {
      sending: 'Sending your enquiry…',
      success: 'Thank you. Your enquiry has been received and a member of the Savelle team will follow up.',
      error: 'Your enquiry could not be sent. Please try again in a moment.',
      rateLimited: 'Too many enquiries have been sent from this connection. Please try again later.',
      invalid: 'Please check the highlighted fields.',
      required: 'Required',
      optional: 'Optional',
      selectPlaceholder: 'Select an option',
      fieldErrors: {
        fullName: 'Please enter your full name.',
        email: 'Please enter a valid email address.',
        enquiryType: 'Please choose what best describes your enquiry.',
        challenge: 'Please tell us briefly what you are working on.',
      },
    },
  },

  privacy: {
    headline: 'Privacy notice',
    // UI placeholder (gate 8): replace with Savelle's privacy notice before launch.
    placeholder:
      "Savelle Group Africa's privacy notice will be published here. Information submitted through the enquiry form is used to respond to your enquiry.",
  },

  // B11
  seo: {
    home: { title: 'Savelle Group Africa | Systems, Strategy, Foresight & Research', description: 'Savelle helps organisations across Africa understand complex systems, develop strategy, anticipate change and turn research and data into better decisions.' },
    about: { title: 'About Savelle Group Africa | Systems and Strategy Advisory', description: 'Learn about Savelle Group Africa, a strategy, systems and intelligence advisory firm focused on evidence-informed decisions and sustainable progress.' },
    whatWeDo: { title: 'Capabilities | Systems Strategy, Foresight, Research & Data', description: "Explore Savelle's capabilities in systems analysis, strategic advisory, foresight, research, data intelligence and organisational development." },
    approach: { title: 'Our Approach | From Systems Diagnosis to Strategic Action', description: "Discover Savelle's approach: diagnose the system, analyse evidence and future change, design a response, and support implementation and learning." },
    // NOTE: names all three engagements; review while case studies are unpublished (see LAUNCH_CHECKLIST.md).
    work: { title: 'Our Work | Savelle Group Africa', description: 'Explore selected Savelle engagements in fundraising strategy, NGO business development and digital transformation.' },
    insights: { title: 'Insights | Research, Strategy, Foresight & Data', description: "Read Savelle's perspectives on systems, institutions, strategy, foresight, research and data intelligence across Africa." },
    contact: { title: 'Contact Savelle Group Africa | Start a Conversation', description: 'Contact Savelle to discuss a systems challenge, strategic assignment, research project or partnership.' },
    // Not in B11 (derived; flagged in checklist)
    privacy: { title: 'Privacy | Savelle Group Africa', description: 'How Savelle Group Africa handles information submitted through this website.' },
  },
}

export type Site = typeof site
