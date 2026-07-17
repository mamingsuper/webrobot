"use client";

import { useId, useState } from "react";

import styles from "./PublicationsSection.module.css";

type AbstractDisclosureProps = {
  abstract: string;
};

export function AbstractDisclosure({ abstract }: AbstractDisclosureProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const abstractId = useId();

  return (
    <div className={styles.disclosure}>
      <button
        aria-controls={abstractId}
        aria-expanded={isExpanded}
        className={styles.abstractButton}
        onClick={() => setIsExpanded((current) => !current)}
        type="button"
      >
        <span>{isExpanded ? "Close abstract" : "Read abstract"}</span>
        <span aria-hidden="true" className={styles.abstractButtonIcon}>
          {isExpanded ? "−" : "+"}
        </span>
      </button>

      <div
        className={styles.abstractPanel}
        hidden={!isExpanded}
        id={abstractId}
      >
        <p>{abstract}</p>
      </div>
    </div>
  );
}
