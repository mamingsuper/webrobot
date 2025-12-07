'use client'

import { Card } from "@/components/ui/card";
import { SplineScene } from "@/components/ui/spline";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Twitter, Mail } from "lucide-react";
import { BlurText } from "@/components/ui/BlurText";
import { Spotlight } from "@/components/ui/spotlight";
import { hero } from "@/data/content";

export function SplineSceneDemo() {
  return (
    <div className="relative w-full flex justify-center mt-12 mb-12">
      <Spotlight
        className="-top-20 -left-20 md:left-0 md:-top-20 opacity-50 transition-opacity duration-500 hover:opacity-100"
        fill="#ff9f1c"
      />
      <Card className="w-full max-w-6xl h-auto min-h-[500px] bg-white/50 backdrop-blur-md border border-white/60 shadow-lg relative overflow-visible flex items-center mx-4 sm:mx-8 rounded-3xl my-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-0 h-full w-full py-10 lg:py-12">
          {/* Left content */}
          <div className="w-full lg:w-1/2 px-8 sm:px-12 relative z-10 flex flex-col justify-center h-full">
            <div className="flex flex-col gap-5">

              {/* Compact Header: Avatar + Name side-by-side */}
              <div className="flex flex-row items-center gap-5">
                <Avatar className="w-48 h-48 lg:w-32 lg:h-32 shadow-xl ring-2 ring-[#fffbf5]">
                  <AvatarImage src={hero.avatar} alt="Profile" />
                  <AvatarFallback>ME</AvatarFallback>
                </Avatar>
                <h2 className="text-3xl lg:text-4xl font-serif font-medium text-neutral-900 tracking-tight leading-[1]">
                  {hero.name}
                </h2>
              </div>

              {/* Bio Text */}
              <div className="text-neutral-800 space-y-3 leading-relaxed text-base lg:text-lg font-light tracking-wide max-w-lg">
                {hero.bio.map((paragraph, index) => (
                  <BlurText
                    key={index}
                    text={paragraph}
                    delay={100 + index * 50}
                    animateBy="words"
                    direction="top"
                    className="text-inherit block font-serif"
                  />
                ))}
              </div>

              {/* Compact Footer: Contact + Icons inline */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
                <BlurText
                  text={`Contact me at ${hero.email}`}
                  delay={300}
                  animateBy="words"
                  direction="top"
                  className="text-neutral-900 font-serif font-medium border-b border-neutral-900 hover:border-transparent transition-all block text-lg"
                />

                <div className="flex gap-3 relative z-20">
                  {hero.socials.map((social, idx) => {
                    const Icon = social.icon === "Twitter" ? Twitter : Mail;
                    return (
                      <a
                        key={idx}
                        href={social.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-neutral-400 text-neutral-800 hover:bg-neutral-900 hover:text-white transition-all duration-300 bg-white/20"
                        aria-label={social.label}
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>

          {/* Right content - Spline Scene with interaction enabled */}
          <div className="mt-8 lg:mt-0 h-[300px] lg:h-full lg:absolute lg:right-[-5%] lg:top-0 lg:bottom-0 lg:w-[60%] pointer-events-auto">
            {/* Mobile Spline */}
            <div className="block lg:hidden h-full w-full">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="h-full w-full transform scale-100"
              />
            </div>
            {/* Desktop Spline - Positioned closer to text */}
            <div className="hidden lg:block h-full w-full">
              <SplineScene
                scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
                className="h-full w-full transform scale-110 -translate-x-10"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
