import { SplineSceneDemo } from "@/components/demo/spline-demo";
import { Navigation } from "@/components/ui/navigation";
import { motion } from "framer-motion";
import { NeuralNetBackground } from "@/components/ui/neural-net-bg";
import { DataFlow } from "@/components/ui/data-flow";
import { DatawrapperChart } from "@/components/ui/DatawrapperChart";
import {
  Brain,
  Network,
  GitBranch,
  Cpu,
  GitPullRequest,
  FileCode2,
} from "lucide-react";
import { Spotlight } from "@/components/ui/spotlight";

export default function Home() {
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
      <Navigation />
      <Spotlight 
        particleSize={25}
        trailLength={25}
        colors={['#FF1CF7', '#00FFE0', '#00FF85', '#FFF500', '#FF8E00']}
        className="!fixed"
      />

      {/* Hero Section */}
      <div className="pt-32 pb-32 px-4 md:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <SplineSceneDemo />
        </div>
      </div>

      {/* Recent Updates Section */}
      <section id="updates" className="py-32 px-4 md:px-8 relative bg-white">
        <div className="max-w-3xl mx-auto relative">
          <motion.h2
            className="section-title flex items-center justify-center gap-3 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Brain className="w-8 h-8 text-black pulse-glow" />
            <span className="text-black font-bold text-3xl">
              Recent Updates
            </span>
          </motion.h2>
          <motion.div
            className="relative border-l-2 border-gray-200 pl-6 space-y-8 ml-4"
            variants={staggerChildren}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {[
              {
                title: "New Publication in Perspectives on Politics",
                content: (
                  <>
                    Mirrors and Mosaics: Deciphering Bloc-Building Narratives in Chinese and Russian Mass Media
                  </>
                ),
                date: "Jan 2025"
              },
              {
                title: "New Publication in Humanities and Social Sciences Communications",
                content: (
                  <>
                    Panacea or Pandora's Box: Diverse Governance Strategies to Conspiracy Theories
                  </>
                ),
                date: "Feb 2025"
              },
              {
                title: "New Working Paper",
                content: "Bureaucrat-Expert Collaboration in LLM Adoption: An Institutional Logic Perspective on China's Public Sector",
                date: "Feb 2025"
              },
            ].map((update, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white p-4 rounded-lg shadow-lg relative"
                whileHover={{
                  scale: 1.02,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                }}
              >
                <div className="absolute -left-10 w-4 h-4 bg-amber-500 rounded-full border-4 border-white" />
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-black">
                        {update.title}
                      </h3>
                      <span className="text-sm text-gray-500">{update.date}</span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed">{update.content}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Projects Section */}
      <section id="projects" className="py-32 px-4 md:px-8 relative bg-gray-50">
        <div className="max-w-4xl mx-auto relative">
          <motion.h2
            className="section-title flex items-center justify-center gap-3 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Network className="w-8 h-8 text-black pulse-glow" />
            <span className="text-black font-bold text-3xl">
              Projects
            </span>
          </motion.h2>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
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
              <motion.div
                key={i}
                variants={fadeInUp}
                className="bg-white p-4 rounded-2xl shadow-lg overflow-hidden"
                whileHover={{ 
                  scale: 1.03,
                  boxShadow: "0 10px 30px rgba(0, 0, 0, 0.12)"
                }}
              >
                <div className="aspect-[3/2] bg-white rounded-lg overflow-hidden mb-4">
                  <img 
                    src={project.img} 
                    alt={project.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                </div>
                <div className="p-2">
                  <div className="flex items-center gap-2 mb-2">
                    <GitPullRequest className="w-5 h-5 text-amber-500" />
                    <h3 className="text-xl font-bold text-black">
                      {project.link ? (
                        <a 
                          href={project.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-amber-600 transition-colors"
                        >
                          {project.title}
                        </a>
                      ) : (
                        project.title
                      )}
                    </h3>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed line-clamp-4">
                    {project.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Publications Section */}
      <section id="publications" className="py-32 px-4 md:px-8 relative bg-white">
        <div className="max-w-4xl mx-auto relative">
          <motion.h2
            className="section-title flex items-center justify-center gap-3 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <FileCode2 className="w-8 h-8 text-black pulse-glow" />
            <span className="text-black font-bold text-3xl">
              Publications
            </span>
          </motion.h2>

          {/* Books */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Books
            </h3>
            <motion.div
              className="space-y-4"
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              <motion.div
                variants={fadeInUp}
                className="bg-white p-5 rounded-lg shadow-lg border-l-4 border-amber-500"
                whileHover={{
                  scale: 1.01,
                  y: -2,
                  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                }}
              >
                <h4 className="text-lg font-medium text-black mb-2">
                  <a 
                    href="https://www.amazon.de/-/en/Government-Information-Technology-Management-Practices/dp/0999235958"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-amber-600 transition-colors"
                  >
                    E-Government and Information Technology Management: Concepts and Best Practices
                  </a>
                </h4>
                <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                  Zheng, Y., Zheng, Z., Ma, M., & Zu, Z. (2018)
                </p>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Chapter: Improving Usability
                </p>
              </motion.div>
            </motion.div>
          </div>

          {/* Articles */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
              Articles
            </h3>
            <motion.div
              className="space-y-4"
              variants={staggerChildren}
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
            >
              {[
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
                  year: "2024",
                  status: "(Accepted)",
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
                  className="bg-white p-5 rounded-lg shadow-lg border-l-4 border-amber-500"
                  whileHover={{
                    scale: 1.01,
                    y: -2,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h4 className="text-lg font-medium text-black mb-2">
                    {article.link || article.doi ? (
                      <a 
                        href={article.link || article.doi}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-amber-600 transition-colors"
                      >
                        {article.title}
                      </a>
                    ) : (
                      article.title
                    )}
                  </h4>
                  <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                    {article.authors}, {article.journal}, {article.year} {article.status && `${article.status}`}
                  </p>
                  {article.doi && (
                    <p className="text-sm text-gray-600 mb-2">
                      DOI: <a href={article.doi} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:text-amber-700">{article.doi}</a>
                    </p>
                  )}
                  {article.abstract && (
                    <div className="mt-2">
                      <details className="text-sm">
                        <summary className="cursor-pointer text-amber-600 hover:text-amber-700 font-medium">
                          Abstract
                        </summary>
                        <p className="mt-2 text-gray-700 leading-relaxed">
                          {article.abstract}
                        </p>
                      </details>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Working Papers */}
          <div>
            <h3 className="text-xl font-bold text-black mb-6 flex items-center gap-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Working Papers
            </h3>
            <motion.div
              className="space-y-4"
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
                  className="bg-white p-5 rounded-lg shadow-lg border-l-4 border-amber-500"
                  whileHover={{
                    scale: 1.01,
                    y: -2,
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h4 className="text-lg font-medium text-black mb-2">
                    {paper.title}
                  </h4>
                  <div className="flex flex-col">
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                      {paper.authors}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                        ({paper.year}). {paper.status}
                      </p>
                      {paper.pdf && (
                        <a
                          href={paper.pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-amber-600 hover:text-amber-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}
