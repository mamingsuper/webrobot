import { hero } from "@/data/content";

import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function MingLogoIcon(props: IconProps) {
  return (
    <svg width="145" height="48" viewBox="0 0 145 48" fill="none" aria-hidden="true" {...props}>
      <g className="ming-mark">
        <rect x="1" y="5" width="36" height="36" rx="18" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 30V16l9 10 9-10v14" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g className="js-header-logo-text-group" clipPath="url(#ming-logo-clip)">
        <text
          className="js-header-logo-text"
          x="46"
          y="32"
          fill="currentColor"
          fontFamily="PPNeueMontreal, sans-serif"
          fontSize="23"
          fontWeight="400"
          letterSpacing="-1"
        >
          Ming Ma
        </text>
      </g>
      <clipPath id="ming-logo-clip">
        <rect width="106" height="40" x="38.8" y="4" fill="white" />
      </clipPath>
    </svg>
  );
}

function MenuIcon(props: IconProps) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" {...props}>
      <g className="nav-toggle__cross js-nav-toggle-cross">
        <path d="M2.56 2.535 13.4386 13.4136" stroke="currentColor" />
        <path d="m13.4389 2.58871-10.87856 10.87859" stroke="currentColor" />
      </g>
      <g className="nav-toggle__burger js-nav-toggle-burger">
        <path d="M.31 3.35h15.3846M.31 7.96426h15.3846M.31 12.579h15.3846" stroke="currentColor" />
      </g>
    </svg>
  );
}

export function PortfolioHeader() {
  return (
    <>
      <button
        type="button"
        className="nav-toggle js-nav-toggle"
        aria-expanded="false"
        aria-controls="portfolio-navigation"
      >
        <MenuIcon aria-hidden="true" />
        <span className="sr">Toggle mobile navigation</span>
      </button>

      <div className="header-blur-block" />

      <header className="header js-header">
        <div className="header__bg js-header-bg">
          <div className="header__bg-inner" />
        </div>

        <div className="header__inner js-header-inner">
          <button type="button" className="header__logo portfolio-header-logo | js-header-logo" anchor-link="landing">
            <MingLogoIcon />
            <span className="sr">Ming Ma</span>
          </button>

          <h1 className="sr">Ming Ma</h1>

          <nav id="portfolio-navigation" className="nav js-nav" aria-label="Primary navigation">
            <div className="nav__bg js-nav-bg">
              <div className="nav__bg-inner" />
            </div>

            <ul className="nav__list js-nav-list">
              <li className="nav__item | js-nav-item" section-name="landing">
                <a href="#landing" className="nav__link js-nav-link" anchor-link="landing">
                  About
                </a>
              </li>
              <li className="nav__item | js-nav-item" section-name="research">
                <a href="#research" className="nav__link js-nav-link" anchor-link="research">
                  Project
                </a>
              </li>
              <li className="nav__item | js-nav-item" section-name="publications">
                <a href="#publications" className="nav__link js-nav-link" anchor-link="publications">
                  Publication
                </a>
              </li>
              <li className="nav__item | js-nav-item" section-name="cv">
                <a className="nav__link js-nav-link" href={hero.cv} target="_blank" rel="noreferrer">
                  CV
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}
