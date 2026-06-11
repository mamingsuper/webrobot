export type SocialIcon = "Twitter" | "Mail";

export type SocialLink = {
  icon: SocialIcon;
  link: string;
  label: string;
};

export type CivicFlowStep = {
  label: string;
  detail: string;
};

export type HeroContent = {
  name: string;
  role: string;
  affiliation: string;
  project: string;
  projectShort: string;
  tagline: string;
  bio: string[];
  researchThemes: string[];
  methods: string[];
  civicFlow: CivicFlowStep[];
  email: string;
  socials: SocialLink[];
  avatar: string;
  cv: string;
};

export type UpdateItem = {
  title: string;
  content: string;
  date: string;
  category: "Publication" | "Accepted";
};

export type ProjectItem = {
  title: string;
  desc: string;
  img: string;
  sticker?: string;
  stickerAlt?: string;
  link?: string;
  focus: string;
  methods: string[];
};

export type PublicationItem = {
  title: string;
  authors: string;
  journal: string;
  year: string;
  status?: string;
  link?: string;
  abstract?: string;
};

export type BookItem = {
  title: string;
  authors: string;
  chapter: string;
  link: string;
};

export type WorkingPaperItem = {
  title: string;
  authors: string;
  year: string;
  status: string;
  pdf?: string;
};

export const hero: HeroContent = {
  name: "Ming Ma",
  role: "Postdoctoral Researcher",
  affiliation: "Leibniz Universität Hannover",
  project:
    "ERC project BiASE-AI: Biases in Administrative Service Encounters - Transitioning from Human to Artificial Intelligence",
  projectShort: "BiASE-AI",
  tagline:
    "I study how (mis)information about emerging technology shapes global politics, public services, and digital society.",
  bio: [
    "Hi, Welcome! I am a postdoctoral researcher at Leibniz Universität Hannover.",
    "I am particularly interested in how (mis)information about emerging technology both shapes and is shaped by the dynamics of global politics, public services, and digital society.",
    "My work has been published in peer-reviewed journals, including Perspectives on Politics, Political Research Quarterly, Journal of Contemporary China, China Review, China Perspectives, among other journals.",
  ],
  researchThemes: [
    "AI and public service transformation",
    "Administrative service encounters",
    "Computational social science",
    "Comparative politics",
    "Power, wealth, and knowledge distribution",
  ],
  methods: [
    "Computational text analysis",
    "Comparative institutional analysis",
    "Mixed-methods research",
    "Public sector AI studies",
  ],
  civicFlow: [
    {
      label: "Human service encounter",
      detail: "Citizens meet public administration through frontline service interactions.",
    },
    {
      label: "Administrative mandate",
      detail: "Rules, institutional logics, and dispersed responsibilities shape the encounter.",
    },
    {
      label: "Data and model adoption",
      detail: "AI systems enter bureaucratic work through data, expertise, and implementation choices.",
    },
    {
      label: "AI-supported decision",
      detail: "Administrative decisions become partially mediated by models and infrastructures.",
    },
    {
      label: "Bias and accountability",
      detail: "The political question is who gains, who is exposed, and who can contest outcomes.",
    },
  ],
  email: "m.ma@ipw.uni-hannover.de",
  socials: [
    {
      icon: "Twitter",
      link: "https://x.com/Winter62675779",
      label: "Follow on X",
    },
    {
      icon: "Mail",
      link: "mailto:m.ma@ipw.uni-hannover.de",
      label: "Email Ming Ma",
    },
  ],
  avatar: "/image.png",
  cv: "/maming_cv.pdf",
};

export const updates: UpdateItem[] = [
  {
    title: "Accepted in Journal of Contemporary China",
    content:
      "Centralized Control and Dispersed Mandates: The Multiple Institutional Logics Behind Lenient Local Discipline in China",
    date: "Dec 2025",
    category: "Accepted",
  },
  {
    title: "New Publication in Political Research Quarterly",
    content:
      "Listening to an Authoritarian Neighbor: Russian Propaganda on Chinese Social Media after the Ukraine Invasion",
    date: "Nov 2025",
    category: "Publication",
  },
  {
    title: "New Publication in Humanities and Social Sciences Communications",
    content:
      "Panacea or Pandora's Box: Diverse Governance Strategies for Conspiracy Theories and Their Consequences in China",
    date: "May 2025",
    category: "Publication",
  },
  {
    title: "New Publication in Perspectives on Politics",
    content:
      "Mirrors and Mosaics: Deciphering Bloc-Building Narratives in Chinese and Russian Mass Media",
    date: "Jan 2025",
    category: "Publication",
  },
];

export const projects: ProjectItem[] = [
  {
    title: "BiASE-AI: Biases in Administrative Service Encounters",
    desc:
      "As a postdoctoral researcher at Leibniz Universität Hannover, I contribute to the ERC project BiASE-AI, which examines how administrative service encounters change as public services transition from human decision-making to artificial intelligence.",
    img: "/project-3.jpg",
    sticker: "/illustrations/project-bias-ai-dialogue.svg",
    stickerAlt: "Illustrated sticker of a citizen speaking with an AI bureaucratic service interface",
    focus: "AI, public services, and administrative encounters",
    methods: ["Public sector AI", "Institutional analysis", "Bias and accountability"],
  },
  {
    title:
      "SCRIPTS: Reinterpreting the Alternative Script? War in Ukraine, State-Sponsored Narratives of Bloc Building in Authoritarian Countries and Their Public Perception",
    desc:
      "This project analyzes how authoritarian governments construct alternative narratives that compete with the liberal script, and how these narratives are perceived by publics in authoritarian contexts.",
    img: "/project-1.jpg",
    sticker: "/illustrations/project-narratives.png",
    stickerAlt: "Illustrated sticker of media narratives, speech bubbles, broadcast signals, and networked maps",
    link:
      "https://www.scripts-berlin.eu/research/research-projects/General-Research-Projects/Reinterpreting-the-alternative-script/index.html",
    focus: "Authoritarian narratives and public perception",
    methods: ["Media narratives", "Comparative politics", "Computational analysis"],
  },
  {
    title: "Generative AI and Politics",
    desc:
      "This project investigates the use of generative AI in political communication and its implications for non-democratic regimes, using mixed methods to examine how AI is adopted and governed.",
    img: "/project-2.jpg",
    sticker: "/illustrations/project-genai-politics.png",
    stickerAlt: "Illustrated sticker of generative AI, political communication, public institutions, and governance guardrails",
    focus: "Generative AI in political communication",
    methods: ["Generative AI", "Political communication", "Mixed methods"],
  },
];

export const publications = {
  books: [
    {
      title: "E-Government and Information Technology Management: Concepts and Best Practices",
      authors: "Zheng, Y., Zheng, Z., Ma, M., & Zu, Z. (2018)",
      chapter: "Chapter: Improving Usability",
      link:
        "https://www.amazon.de/-/en/Government-Information-Technology-Management-Practices/dp/0999235958",
    },
  ] satisfies BookItem[],
  articles: [
    {
      title:
        "Centralized Control and Dispersed Mandates: The Multiple Institutional Logics Behind Lenient Local Discipline in China",
      authors: "Ma Ming",
      journal: "Journal of Contemporary China",
      year: "2025",
      status: "Accepted",
      abstract:
        "The literature on China's anti-corruption and disciplinary system has primarily focused on the overarching power structure and internal political struggles to explain its nature and effectiveness. We contend, however, that the complexities of frontline operations are equally crucial. Drawing on extensive fieldwork conducted in county-level jurisdictions in Guangdong and Jiangsu Provinces from 2020 to 2022, we examine lenient disciplinary practices within local Discipline Inspection and Supervision Committees (DISCs) and the rationales behind them. Our findings indicate that the combination of DISCs' consolidated control over personnel and information, coupled with their diverse roles in local governance, creates greater capacity and, more importantly, multiple institutional logics that incentivize lenient disciplinary practices at the local level. This study underscores the deepening structural contradictions within the evolving disciplinary system.",
    },
    {
      title:
        "Listening to an Authoritarian Neighbor: Russian Propaganda on Chinese Social Media after the Ukraine Invasion",
      authors: "Ma Ming, Daniil Romanov, Genia Kostka and Alexander Libman",
      journal: "Political Research Quarterly",
      year: "2025",
      link: "https://doi.org/10.1177/10659129251395307",
      abstract:
        "Authoritarian states actively engage in cross-border propaganda. While the effects and the narratives of this propaganda targeting democracies have been studied in the past, little attention has been paid to how sudden and significant geopolitical events influence the engagement of authoritarian propaganda in other like-minded states. This study closes the gap by looking at Russia's propaganda in Chinese social media platform Weibo. We look at how users of the platform reacted to messages spread by Russia Today (RT) and Sputnik after the full-scale invasion against Ukraine. Applying computational text analysis and regression analysis we show that although the outbreak of the war led to a surge in Russian propaganda - especially anti-Western and war-related narratives - Chinese audiences exhibited a pronounced tendency to engage primarily with narratives highlighting non-Western cooperation, reflecting a strong alignment with the Chinese government's domestic propaganda.",
    },
    {
      title: "Mirrors and Mosaics: Deciphering Bloc-Building Narratives in Chinese and Russian Mass Media",
      authors: "Ma Ming, Daniil Romanov, Genia Kostka and Alexander Libman",
      journal: "Perspectives on Politics",
      year: "2025",
      link: "https://doi.org/10.1017/S1537592724002202",
      abstract:
        "Authoritarian states are intensifying bloc-building efforts. While the authoritarian regionalism literature suggests that membership in these \"clubs of autocrats\" can bolster domestic support for authoritarian leaders, such external recognition can also pose challenges, especially when aligning with \"toxic\" authoritarian partners. We argue that authoritarian regimes attempt to solve this problem by crafting strategic narratives and communicating them through regime-loyal media to the general public. The study examines strategic narratives of bloc building used by Russia and China in the first year after the start of the full-scale war in Ukraine in 2022. Using \"text-as-data\" methods and qualitative analysis, we find important similarities and differences in the narratives of these two countries. Both use narratives highly critical of the United States and NATO. However, while Russia has crafted a more coherent bloc-building narrative centered on anti-Western confrontation, China communicates a more fragmented and ambivalent set of narratives, reflecting the different risks these regimes face when presenting authoritarian cooperation to domestic audiences.",
    },
    {
      title:
        "Panacea or Pandora's Box: Diverse Governance Strategies for Conspiracy Theories and Their Consequences in China",
      authors: "Ma Ming, Han Feng and Wang Chuyao",
      journal: "Humanities and Social Sciences Communications",
      year: "2025",
      link: "https://doi.org/10.1057/s41599-024-04350-1",
      abstract:
        "This study examines the Chinese government's strategies for managing conspiracy theories (CTs) on social media. While previous research has primarily considered how authoritarian regimes disseminate CTs for political purposes and has often viewed the public as fully receptive to propaganda and easily manipulated, our research explores a broader spectrum of state strategies including propagation, tolerance, and partial rebuttal. Based on social network analysis, topic modeling, and qualitative analysis of 46,387 Weibo posts from 3 cases, we argue that the Chinese government's manipulation of CTs is multifaceted and carries significant audience costs. Our findings indicate that state-led CTs can indeed mobilize public opinion, but they also risk expanding beyond state control, which can lead to unintended consequences that may undermine state interests and limit policy flexibility. This research contributes to our understanding of the tactical and operational complexities authoritarian regimes face when leveraging CTs, while highlighting the intricate balance between state control and public agency.",
    },
    {
      title: "Weaving the Social Fabric: Party-Led Community Social Capital Building in Rural Guangdong",
      authors: "Ma Ming & Kang Yi",
      journal: "China Review",
      year: "2023",
      status: "23(3), 1-29",
      link: "https://www.jstor.org/stable/48740205",
      abstract:
        "By examining the case of rural Guangdong, this research elaborates on the practice of Party-led social capital building (PSCB), which provides a Janus-faced mechanism for creating synergies between the local Party-state and society: the Primary Party Organizations (PPOs) cultivate bonding, bridging, and linking social capital to enhance community engagement while deliberately limiting the democratizing potential of this process by selecting vetted nonstate actors, including social workers, private entrepreneurs, and official delegates from higher administrative levels, to serve as key nodes in the community networks. These delegates are tasked with gathering information, building trust and reciprocity, and influencing public opinion to ensure that mass participation in community affairs produces the results desired by the local Party-state. The state-vetted key players are mobilized and controlled by the grassroots cadres through well-targeted actions, including Party discipline and various carrot-and-stick incentives in the private and tertiary sectors. Reinvigorating the mass line by integrating Party-building with the control of the nonstate sector, grid management, and cultural governance, PSCB calls for our reimagination of the governance nexus in grassroots China.",
    },
    {
      title:
        "Conflict Management through Controlled Elections: 'Harmonizing Interventions' by Party Work Teams in Chinese Village Elections",
      authors: "Ma Ming & Kang Yi",
      journal: "China Perspectives",
      year: "2022",
      link: "https://journals.openedition.org/chinaperspectives/14214",
      abstract:
        "This study explores a distinct type of electoral intervention, which we call \"harmonising intervention,\" by the Chinese local state to achieve the goal of securing the joint post of the village Party secretary and Village Committee director. It involves mediating conflicts through electoral interventions and using elections to create harmony. The research finds that through such interventions, the local state simultaneously accomplishes the legitimisation, information collection, elite co-optation, and clout demonstration functions of authoritarian elections. \"Harmonising interventions\" have obvious power concentration effects and strengthen local state control rather than village self-governance.",
    },
    {
      title: "Can Cross-Sector Support Help Social Enterprises in Legitimacy Building? The Mixed Effects in Hong Kong",
      authors: "Ma Ming, Kang Yi & Feng Yuyan",
      journal: "Journal of Public and Nonprofit Affairs",
      year: "2022",
      status: "8(3), 1-24",
      link: "https://www.jpna.org/index.php/jpna/article/view/691",
      abstract:
        "Cross-sector collaboration is widely considered beneficial for the sustainable development of social enterprises (SEs). This study provides a nuanced assessment of the impacts of cross-sector collaboration in supporting SE development (cross-sector support; CSS) by highlighting legitimacy building as the crucial goal for SEs in achieving sustainability. Studying Hong Kong, we examine the institutional pressures confronting SEs in their legitimacy building, their efforts to respond, and the role of CSS therein. Data from surveys and in-depth interviews show that the three key types of CSS - venture capital, operational, and promotional - have mixed effects on the efforts of SEs to cope with the various institutional pressures. Our findings suggest the necessity of an integrated blend of governance styles - a metagovernance approach - in shaping and guiding CSS of SEs and an approach that is sensitive to the plural, changing pressures in SE entrepreneurial processes to achieve financial sustainability as well as social legitimacy.",
    },
  ] satisfies PublicationItem[],
  workingPapers: [
    {
      title:
        "Bureaucrat-Expert Collaboration in LLM Adoption: An Institutional Logic Perspective on China's Public Sector",
      authors: "Ma Ming, Chuyao Wang, Han Feng, Tian Zhang, Jiaju Kang",
      year: "2025",
      status: "Under Review",
      pdf: "/llm.pdf",
    },
  ] satisfies WorkingPaperItem[],
};
