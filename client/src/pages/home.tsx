import { SplineSceneDemo } from "@/components/demo/spline-demo";
import { Navigation } from "@/components/ui/navigation";
import { motion } from "framer-motion";
// import { NeuralNetBackground } from "@/components/ui/neural-net-bg"; // 未使用移除
// import { DataFlow } from "@/components/ui/data-flow"; // 未使用移除
// import { DatawrapperChart } from "@/components/ui/DatawrapperChart"; // 未使用移除
import { Brain, Network, GitPullRequest, FileCode2 } from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";
// import { useSectionSnap } from "@/hooks/useSectionSnap"; // replaced by continuous snap
// import { useContinuousSectionSnap } from "@/hooks/useContinuousSectionSnap";
import { useSectionSnap } from "@/hooks/useSectionSnap";
// Removed Hero component import (reverted as per user request)

export default function Home() {
  // 需求：只在第一次向下浏览时帮助对齐，不要后续强制回弹
  // 使用一次性 snap（session 内只触发一次，可通过清空 sessionStorage 复位）
  useSectionSnap(["about", "updates", "projects", "publications"], {
    threshold: 0.25,
    oncePerSession: true,
    timeoutMs: 1000
  });
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  };

  const staggerChildren = {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  return (
    <div className="min-h-screen w-full bg-white relative">
      <a href="#main" className="skip-link">Skip to main content</a>
      <Navigation />
      <Spotlight 
        particleSize={25}
        trailLength={25}
        colors={['#FF1CF7', '#00FFE0', '#00FF85', '#FFF500', '#FF8E00']}
        className="!fixed"
      />
      <main id="main">
      <header className="pt-24 pb-16 sm:pt-28 sm:pb-20 px-0 md:px-4 lg:px-8 bg-white" id="about" aria-labelledby="about-heading" data-snap>
      <div className="w-full">
          <h1 id="about-heading" className="sr-only">About</h1>
          {/* 顶部可视 3D 模块 */}
          <SplineSceneDemo />
        </div>
      </header>

      {/* Recent Updates Section */}
      <section
        id="updates"
        className="py-20 sm:py-24 px-4 md:px-8 bg-white"
        aria-labelledby="updates-heading"
        data-snap>
        <div className="max-w-3xl mx-auto">
          <motion.h2 id="updates-heading" className="flex items-center justify-center gap-3 mb-10 heading-2" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <Brain className="w-8 h-8 text-amber-600 motion-safe:animate-pulse" />
            <span>Recent Updates</span>
          </motion.h2>
          <motion.ol
            className="relative ml-3 pl-6 border-l border-gray-200 space-y-8"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            aria-label="Recent chronological updates"
          >
            {[
              {
                title: "New Publication in Humanities and Social Sciences Communications",
                content: "Panacea or Pandora’s box: diverse governance strategies for conspiracy theories and their consequences in China",
                date: "May 2025"
              },
              {
                title: "New Publication in Perspectives on Politics",
                content: "Mirrors and Mosaics: Deciphering Bloc-Building Narratives in Chinese and Russian Mass Media",
                date: "Jan 2025"
              },
              {
                title: "New Working Paper",
                content: "Bureaucrat-Expert Collaboration in LLM Adoption: An Institutional Logic Perspective on China's Public Sector",
                date: "Feb 2025"
              },
            ].map((u, i) => (
              <motion.li
                key={i}
                variants={fadeInUp}
                className="relative focus-within:ring-2 focus-within:ring-amber-500 rounded-md outline-none"
              >
                <span className="absolute -left-[30px] top-2 w-4 h-4 rounded-full bg-amber-500 ring-4 ring-white" aria-hidden="true" />
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-lg font-semibold text-neutral-900 leading-snug">{u.title}</h3>
                    <time className="text-sm font-medium tracking-wide uppercase text-neutral-500">{u.date}</time>
                  </div>
                  <p className="text-base text-neutral-600 leading-relaxed max-w-prose">{u.content}</p>
                </div>
              </motion.li>
            ))}
          </motion.ol>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-20 sm:py-24 px-4 md:px-8 bg-gray-50" aria-labelledby="projects-heading" data-snap>
        <div className="max-w-4xl mx-auto relative">
          <motion.h2 id="projects-heading" className="flex items-center justify-center gap-3 mb-10 heading-2" initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
            <Network className="w-8 h-8 text-amber-600 motion-safe:animate-pulse" />
            <span>Projects</span>
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              { 
                title: "SCRIPTS: Reinterpreting the alternative script? War in Ukraine, state-sponsored narratives of block building in authoritarian countries and their public perception", 
                desc: "   The project analyzes the construction of 'alternative' narratives by authoritarian governments competing against the liberal script and the way these narratives are perceived, reinterpreted and negotiated by the population of their countries. We focus at Russia and China and the narratives their regimes supply with respect to the war in Ukraine and the development of new dividing lines, blocks and alliances in the world associated with this war. In both countries, governments construct their own 'story' of the conflict and use state-owned media and other propaganda tools to communicate it to the public.",
                img: "/project-1.jpg",
                link: "https://www.scripts-berlin.eu/research/research-projects/General-Research-Projects/Reinterpreting-the-alternative-script/index.html"
              },
              { title: "Generative AI and Politics", desc: "This project investigates the use of generative AI in political communication and its implications for non-democratic regimes. Mixed mthods are used to investigate how AI is used by the different actors and the power distritution dynamics.",
                 img: "/project-2.jpg" }
            ].map((project, i) => (
              <motion.article
                key={i}
                variants={fadeInUp}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-amber-500 outline-none"
                tabIndex={0}
              >
                <div className="aspect-[3/2] bg-white rounded-lg overflow-hidden mb-4 relative">
                  <img 
                    src={project.img} 
                    alt={project.title}
                    loading="lazy"
                    width={640}
                    height={420}
                    className="w-full h-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-105"
                  />
                </div>
                <div className="p-1">
                  <div className="flex items-start gap-2 mb-2">
                    <GitPullRequest className="w-5 h-5 text-amber-500 mt-0.5" />
                    <h3 className="text-lg font-semibold text-neutral-900 leading-snug">
                      {project.link ? (
                        <a 
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-transparent hover:decoration-amber-500 transition"
                        >
                          {project.title}
                        </a>
                      ) : (
                        project.title
                      )}
                    </h3>
                  </div>
                  <details className="group text-neutral-600 text-base leading-relaxed">
                    <summary className="cursor-pointer list-none select-none text-amber-600 hover:text-amber-700 font-medium mb-1 inline-flex items-center gap-1 after:content-['›'] after:transition-transform group-open:after:rotate-90">
                      Description
                    </summary>
                    <p className="mt-1 whitespace-pre-line">{project.desc.trim()}</p>
                  </details>
                </div>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Publications Section */}
      <section id="publications" className="py-24 sm:py-28 px-4 md:px-8 bg-white" aria-labelledby="pubs-heading" data-snap>
        <div className="max-w-4xl mx-auto relative">
          <motion.h2 id="pubs-heading" className="flex items-center justify-center gap-3 mb-12 heading-2" initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }}>
            <FileCode2 className="w-8 h-8 text-amber-600 motion-safe:animate-pulse" />
            <span>Publications</span>
          </motion.h2>

          {/* Books */}
          <div className="mb-14">
            <h3 className="text-xl font-semibold text-black mb-5 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Books
            </h3>
            <motion.div
              className="space-y-3"
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <motion.div
                variants={fadeInUp}
                className="rounded-xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm"
              >
                <h4 className="text-lg font-semibold text-black leading-snug">
                  <a 
                    href="https://www.amazon.de/-/en/Government-Information-Technology-Management-Practices/dp/0999235958"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-600 transition-colors"
                  >
                    E-Government and Information Technology Management: Concepts and Best Practices
                  </a>
                </h4>
                <p className="mt-3 text-base text-gray-700 leading-relaxed">
                  Zheng, Y., Zheng, Z., Ma, M., & Zu, Z. (2018)
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Chapter: Improving Usability
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Articles */}
          <div className="mb-14">
            <h3 className="text-xl font-semibold text-black mb-5 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Articles
            </h3>
            <motion.div
              className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100"
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
                {
                  title: "Listening to an Authoritarian Neighbor: Russian Propaganda on Chinese Social Media after the Ukraine Invasion",
                  authors: "Ma Ming, Daniil Romanov, Genia Kostka and Alexander Libman",
                  journal: "Political Research Quarterly",
                  year: "Accepted",
                  status: "Accepted",
                  abstract: ' Authoritarian states actively engage in cross-border propaganda. While the effects and the narratives of this propaganda targeting democracies have been studied in the past, little attention has been paid to how sudden and significant geopolitical events influence the engagement of authoritarian propaganda in other like-minded states. This study closes the gap by looking at Russia’s propaganda in Chinese social media platform Weibo. We look at how users of the platform reacted on messages spread by RT and Sputnik after the full-scale invasion against Ukraine. Applying computational text analysis and regression analysis we show that although the outbreak of the war led to a surge in Russian propaganda—especially anti-Western and war-related narratives—Chinese audiences exhibited a pronounced tendency to engage primarily with narratives highlighting non-Western cooperation, reflecting a strong alignment with the Chinese government’s domestic propaganda.'
                },
                {
                  title: "Mirrors and Mosaics: Deciphering Bloc-Building Narratives in Chinese and Russian Mass Media",
                  authors: "Ma Ming, Daniil Romanov, Genia Kostka and Alexander Libman",
                  journal: "Perspectives on Politics",
                  year: "2025",
                  link: "https://doi.org/10.1017/S1537592724002202",
                  abstract: 'Authoritarian states are intensifying bloc-building efforts. While the authoritarian regionalism literature suggests that membership in these "clubs of autocrats" can bolster domestic support for authoritarian leaders, such external recognition can also pose challenges, especially when aligning with "toxic" authoritarian partners. We argue that authoritarian regimes attempt to solve this problem by crafting strategic narratives and communicating them through regime-loyal media to the general public. The study examines strategic narratives of bloc building used by Russia and China in the first year after the start of the full-scale war in Ukraine in 2022. Using "text-as-data" methods and qualitative analysis, we find important similarities and differences in the narratives of these two countries. Both use narratives highly critical of the United States and NATO. However, while Russia has crafted a "fortress narrative" that focuses on external threats and non-Western resilience, China promotes a "bridge narrative," advocating for spanning geopolitical gaps and championing global integration. Both narrative strategies converge in their criticism of shared adversaries but diverge in their portrayals of the blocs they lead.'
                },
                {
                  title: "Panacea or Pandora's Box: Diverse Governance Strategies to Conspiracy Theories and their Consequences in China",
                  authors: "Ma Ming, Han Feng and Wang Chuyao",
                  journal: "Humanities and Social Sciences Communications",
                  year: "2025",
                  link: "https://doi.org/10.1057/s41599-024-04350-1",
                  abstract: 'This study examines the Chinese government\'s strategies for managing conspiracy theories (CTs) on social media. While previous research has primarily considered how authoritarian regimes disseminate CTs for political purposes and has often viewed the public as fully receptive to propaganda and easily manipulated, our research explores a broader spectrum of state strategies including propagation, tolerance, and partial rebuttal. Based on social network analysis, topic modelling, and qualitative analysis of 46,387 Weibo posts from 3 cases, we argue that the Chinese government\'s manipulation of CTs is multifaceted and carries significant audience costs. Our findings indicate that state-led CTs can indeed mobilize public opinion, but they also risk expanding beyond state control, which can lead to unintended consequences that may undermine state interests and limit policy flexibility. This research contributes to our understanding of the tactical and operational complexities authoritarian regimes face when leveraging CTs, while highlighting the intricate balance between state control and public agency.'
                },
                {
                  title: "Weaving the Social Fabric: Party-Led Community Social Capital Building in Rural Guangdong",
                  authors: "Ma Ming & Kang Yi",
                  journal: "China Review",
                  year: "2023",
                  status: "23(3), 1-29",
                  link: "https://www.jstor.org/stable/48740205",
                  abstract: 'By examining the case of rural Guangdong, this research elaborates on the practice of party-led social capital building (PSCB), which provides a Janus-faced mechanism for creating synergies between the local party-state and society: the Primary Party Organizations cultivate bonding, bridging, and linking social capital to enhance community engagement while deliberately limiting the democratizing potential of this process by selecting vetted nonstate actors, including social workers, private entrepreneurs, and official delegates from higher administrative levels, to serve as key nodes in the community networks. These delegates are tasked with gathering information, building trust and reciprocity, and influencing public opinion to ensure that mass participation in community affairs produces the results desired by the local party-state. The state-vetted key players are mobilized and controlled by the grassroots cadres through well-targeted actions, including party discipline and various carrot-and-stick incentives in the private and tertiary sectors. Reinvigorating the mass line by integrating party-building with the control of the nonstate sector, grid management, and cultural governance, PSCB calls for our reimagination of the governance nexus in grassroots China.'
                },
                {
                  title: "Conflict Management through Controlled Elections: 'Harmonizing Interventions' by Party Work Teams in Chinese Village Elections",
                  authors: "Ma Ming & Kang Yi",
                  journal: "China Perspectives",
                  year: "2022",
                  link: "https://journals.openedition.org/chinaperspectives/14214",
                  abstract: 'This study explores a distinct type of electoral intervention, which we call "harmonising intervention," by the Chinese local state to achieve the goal of securing the joint post of the village Party secretary and Village Committee director. It involves mediating conflicts through electoral interventions and using elections to create harmony. The research finds that through such interventions, the local state simultaneously accomplishes the legitimisation, information collection, elite co-optation, and clout demonstration functions of authoritarian elections. "Harmonising interventions" have obvious power concentration effects and strengthen local state control rather than village self-governance.'
                },
                {
                  title: "Can cross-sector support help social enterprises in legitimacy building? The mixed effects in Hong Kong",
                  authors: "Ma Ming, Kang Yi & Feng Yuyan",
                  journal: "Journal of Public and Nonprofit Affairs",
                  year: "2022",
                  status: "8(3), 1–24",
                  link: "https://www.jpna.org/index.php/jpna/article/view/691",
                  abstract: 'Cross-sector collaboration is widely considered beneficial for the sustainable development of social enterprises (SEs). This study provides a nuanced assessment of the impacts of cross-sector collaboration in supporting SE development (cross-sector support; CSS) by highlighting legitimacy building as the crucial goal for SEs in achieving sustainability. Studying Hong Kong, we examine the institutional pressures confronting SEs in their legitimacy building, their efforts to respond, and the role of CSS therein. Data from surveys and in-depth interviews show that the three key types of CSS—venture capital, operational, and promotional—have mixed effects on the efforts of SEs to cope with the various institutional pressures. Our findings suggest the necessity of an integrated blend of governance styles—a metagovernance approach—in shaping and guiding CSS of SEs and an approach that is sensitive to the plural, changing pressures in SE entrepreneurial processes to achieve financial sustainability as well as social legitimacy.'
                }
              ].map((article, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="px-5 md:px-6 py-6"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <h4 className="text-lg font-semibold text-neutral-900 leading-snug max-w-2xl">
                      {article.title}
                    </h4>
                    <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                      {article.year}
                    </span>
                  </div>
                  <p className="mt-2 text-base text-neutral-700 leading-relaxed">
                    {article.authors}
                  </p>
                  <p className="text-sm text-neutral-500">
                    {article.journal} {article.status && `• ${article.status}`}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    {article.link && (
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-200 transition-colors"
                      >
                        Full text
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5h6m0 0v6m0-6L10 14" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19l6-6" />
                        </svg>
                      </a>
                    )}
                    {article.abstract && (
                      <details className="text-sm text-neutral-700">
                        <summary className="cursor-pointer text-amber-600 hover:text-amber-700 font-medium">
                          Abstract
                        </summary>
                        <p className="mt-2 text-neutral-700 leading-relaxed max-w-prose">
                          {article.abstract}
                        </p>
                      </details>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Working Papers */}
          <div className="mt-16">
            <h3 className="text-xl font-semibold text-black mb-5 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Working Papers
            </h3>
            <motion.div
              className="rounded-2xl border border-gray-100 bg-white divide-y divide-gray-100"
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
                {
                  title: "Bureaucrat-Expert Collaboration in LLM Adoption: An Institutional Logic Perspective on China's Public Sector",
                  authors: "Ma Ming, Chuyao Wang, Han Feng, Tian Zhang, Jiaju Kang",
                  year: "2025",
                  status: "Under Review",
                  pdf: "/llm.pdf"
                },
              ].map((paper, i) => (
                <motion.div
                  key={i}
                  variants={fadeInUp}
                  className="px-5 md:px-6 py-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-lg font-semibold text-neutral-900 leading-snug max-w-2xl">
                      {paper.title}
                    </h4>
                    <span className="text-sm font-medium uppercase tracking-wide text-neutral-500">
                      {paper.year}
                    </span>
                  </div>
                  <p className="mt-2 text-base text-neutral-700 leading-relaxed">
                    {paper.authors}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-4">
                    <span className="text-sm text-neutral-500 font-medium">
                      {paper.status}
                    </span>
                    {paper.pdf && (
                      <a
                        href={paper.pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-700 hover:bg-amber-200 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        PDF
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
      </main>
    </div>
  );
}
