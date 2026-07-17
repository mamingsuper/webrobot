import { PortfolioFooter } from "@/components/dala-portfolio/PortfolioFooter";
import { PortfolioHeader } from "@/components/dala-portfolio/PortfolioHeader";
import { PortfolioHero, PortfolioPublications, PortfolioResearch } from "@/components/dala-portfolio/PortfolioSections";
import { SiteLoader } from "@/components/dala-portfolio/SiteLoader";
import { RuntimeSwitch } from "@/components/particle/RuntimeSwitch";

type HomeProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Home({ searchParams }: HomeProps) {
  const runtime = (await searchParams).runtime;
  const useDalaFallback = runtime === "dala";
  const content = (
    <main id="main-content">
      <PortfolioHero />
      <PortfolioResearch />
      <PortfolioPublications />
      <PortfolioFooter />
      <div className="page-tail-spacer" aria-hidden="true" />
    </main>
  );

  return (
    <>
      <PortfolioHeader />
      <SiteLoader legacyFallback={useDalaFallback} />
      {useDalaFallback ? <div asscroll-container="">{content}</div> : <div data-scroll-root="">{content}</div>}
      <RuntimeSwitch useDalaFallback={useDalaFallback} />
    </>
  );
}
