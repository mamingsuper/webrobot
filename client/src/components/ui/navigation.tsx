"use client";

import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export function Navigation() {
  const [location] = useLocation();
  const [activeSection, setActiveSection] = useState("/");

  const links = [
    { href: "/", label: "About" },
    { href: "#updates", label: "Recent Updates" },
    { href: "#projects", label: "Projects" },
    { href: "#publications", label: "Publications" },
    {
      href: "#",
      label: "CV",
      onClick: () => {
        window.open("/maming_cv.pdf", "_blank");
      },
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["updates", "projects", "publications"].map(id => 
        document.getElementById(id)
      );
      
      const scrollPosition = window.scrollY + window.innerHeight / 3;

      if (scrollPosition < (sections[0]?.offsetTop || Infinity)) {
        setActiveSection("/");
      } else {
        for (let i = 0; i < sections.length; i++) {
          const current = sections[i];
          const next = sections[i + 1];
          
          if (current && (!next || scrollPosition >= current.offsetTop && scrollPosition < next.offsetTop)) {
            setActiveSection(`#${current.id}`);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // 初始化时调用一次

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
      <nav className="max-w-6xl mx-auto px-4 h-16">
        <div className="flex items-center justify-center md:justify-end h-full">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                if (link.onClick) {
                  link.onClick();
                  return;
                }
                if (link.href === "/") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                } else if (link.href.startsWith("#")) {
                  const element = document.querySelector(link.href);
                  element?.scrollIntoView({ behavior: "smooth" });
                }
              }}
              className={cn(
                "nav-link",
                "text-sm font-medium tracking-wide",
                "px-4 py-2 mx-1 rounded-md transition-all duration-200 hover:bg-gray-100",
                activeSection === link.href && "active border-b-2 border-amber-500 pb-1 bg-transparent text-amber-600",
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
