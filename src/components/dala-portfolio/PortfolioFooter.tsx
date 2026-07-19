import { hero } from "@/data/content";

import { MingLogoIcon } from "./PortfolioHeader";

function SocialIcon({ name }: { name: "twitter" | "email" }) {
  const path = name === "twitter"
    ? "M10.7 26c9.8 0 15.2-8.1 15.2-15.1v-.7c1-.7 1.9-1.7 2.7-2.7-1 .4-2 .7-3.1.8 1.1-.7 1.9-1.7 2.3-2.9-1 .6-2.2 1-3.4 1.3-1-1-2.4-1.7-3.9-1.7-2.9 0-5.3 2.4-5.3 5.3 0 .4 0 .8.1 1.2-4.4-.2-8.4-2.3-11-5.5-.4.8-.7 1.7-.7 2.6 0 1.8.9 3.5 2.4 4.4-.9 0-1.7-.3-2.4-.7v.1c0 2.6 1.8 4.7 4.3 5.2-.4.1-.9.2-1.4.2-.3 0-.7 0-1-.1.7 2.1 2.6 3.6 5 3.7-1.8 1.4-4.1 2.3-6.6 2.3-.4 0-.9 0-1.3-.1 2.3 1.5 5.1 2.4 8.1 2.4z"
    : "M15.5 26h-10c-.8 0-1.5-.3-2-.9-.5-.6-.9-1.3-.9-2.1V8.1c0-.7.2-1.3.6-1.8C3.6 5.5 4.4 5 5.4 5h20.2c.7 0 1.3.2 1.8.7.5.4.9 1 1 1.7.1.3.1.6.1.9v13.8c0 .5 0 .9-.1 1.4-.1.7-.5 1.3-1 1.8s-1.2.7-1.8.7H15.5zM5.7 6.9c.2.3.4.5.6.7.7.6 1.3 1.3 2 1.9 1.3 1.3 2.6 2.5 3.9 3.8.8.8 1.7 1.6 2.5 2.5.2.2.5.3.8.3.3 0 .5-.1.8-.3l.9-.9c1.7-1.6 3.3-3.2 5-4.8.6-.6 1.2-1.2 1.8-1.7.5-.4.9-.9 1.4-1.4-.2 0-.4-.1-.6-.1H5.7zM5.6 24h19.7l-7.5-7.2c-1.4 1.6-3.4 1.5-4.8 0L5.6 24zm21-1.4.1-.6V8.8c0-.2 0-.3-.1-.5l-7.4 7.2 7.4 7.1zm-22.2.1 7.4-7.2-.2-.2c-2.4-2.3-4.8-4.6-7.2-7h-.1v14.4z";
  return (
    <svg aria-hidden="true" viewBox="0 0 31 31" className={`footer__social__icon footer__social__icon--${name}`}>
      <path d={path} />
    </svg>
  );
}

export function PortfolioFooter() {
  return (
    <footer className="section footer | js-section" section-name="contact">
      <div className="footer__contact-layout">
        <div className="footer__head" data-contact-copy data-reveal>
          <h2
            className="t-40 t-lh-1 t-48@sm t-lh-1.2@sm t-64@md t-lh-1.1@md -t-ls-0.03 t-400 mb-2"
          >
            Human connection leads to great ideas.
          </h2>
          <div className="footer__cta d-flex justify-center">
            <a
              className="btn t-16 t-14@xs t-16@sm t-ls-0.025 t-600 t-uppercase"
              href={`mailto:${hero.email}`}
            >
              <span className="btn__text pointer-events-none">Contact me.</span>
              <div className="btn__hover pointer-events-none" aria-hidden="true" />
            </a>
          </div>
        </div>
        <div className="footer__planet-safe-zone" data-planet-safe-zone aria-hidden="true" />
      </div>

      <div className="footer__bar">
        <div className="footer__logo portfolio-footer-logo">
          <MingLogoIcon />
          <span className="sr">Ming Ma</span>
        </div>

        <div className="footer__copyright">
          <span className="footer__copyright__item">© {new Date().getFullYear()} Ming Ma.</span>{" "}
          <span className="footer__copyright__item">All rights reserved.</span>
        </div>

        <ul className="footer__nav">
          <li className="footer__nav__item | js-nav-item" section-name="research">
            <button className="footer__nav__link t-16 t-lh-1.2 t-14@xs t-lh-1.4@xs t-16@sm t-lh-1.2@sm -t-ls-0.025 t-600 t-uppercase | js-nav-link" type="button" anchor-link="research">
              Project
            </button>
          </li>
          <li className="footer__nav__item | js-nav-item" section-name="publications">
            <button className="footer__nav__link t-16 t-lh-1.2 t-14@xs t-lh-1.4@xs t-16@sm t-lh-1.2@sm -t-ls-0.025 t-600 t-uppercase | js-nav-link" type="button" anchor-link="publications">
              Publication
            </button>
          </li>
          <li className="footer__nav__item | js-nav-item" section-name="cv">
            <a className="footer__nav__link t-16 t-lh-1.2 t-14@xs t-lh-1.4@xs t-16@sm t-lh-1.2@sm -t-ls-0.025 t-600 t-uppercase | js-nav-link" href={hero.cv} target="_blank" rel="noreferrer">
              CV
            </a>
          </li>
        </ul>

        <div className="footer__social">
          <a className="footer__social__link" href={hero.socials[0].link} target="_blank" rel="noreferrer">
            <span className="sr">X</span>
            <SocialIcon name="twitter" />
          </a>
          <a className="footer__social__link" href={`mailto:${hero.email}`}>
            <span className="sr">Email</span>
            <SocialIcon name="email" />
          </a>
        </div>
      </div>
    </footer>
  );
}
