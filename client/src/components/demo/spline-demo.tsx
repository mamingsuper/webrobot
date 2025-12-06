'use client'

import { SplineScene } from "@/components/ui/spline";
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Twitter, Mail } from "lucide-react";
import { BlurText } from "@/components/ui/BlurText";

export function SplineSceneDemo() {
  return (
      <Card className="mx-auto w-full max-w-[93vw] xl:max-w-[1520px] bg-white relative overflow-hidden shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-center gap-4 lg:gap-6 min-h-[570px] lg:min-h-[780px]">
        {/* Left content */}
            <div className="w-full lg:w-[44%] px-6 sm:px-8 py-10 lg:px-8 lg:py-16 relative z-10 flex flex-col justify-center">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-5">
                <Avatar className="w-20 h-20 lg:w-24 lg:h-24">
                <AvatarImage src="/avatar.JPG" alt="Profile" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
                <h2 className="text-3xl lg:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-700 drop-shadow-sm">
                  Ming Ma
                </h2>
            </div>

              <div className="text-gray-800 space-y-3 leading-relaxed text-lg tracking-tight">
              <BlurText
                text="Hi, Welcome! I am a postdoctoral researcher at Free University Berlin."
                delay={100}
                animateBy="words"
                direction="top"
                className="text-inherit"
              />
              <BlurText
                text="I study computational social science, comparative politics, and AI governance."
                delay={150}
                animateBy="words"
                direction="top"
                className="text-inherit"
              />
              <BlurText
                text="I am particularly interested in how (mis)information about emerging technology both shapes and is shaped by the dynamics of global politics, digital spaces, and everyday life."
                delay={200}
                animateBy="words"
                direction="top"
                className="text-inherit"
              />
              <BlurText
                text="My work has been published in peer-reviewed journals, including Perspectives on Politics, China Review, China Perspectives, among other journals."
                delay={250}
                animateBy="words"
                direction="top"
                className="text-inherit"
              />
              <BlurText
                text="Contact me at ming.ma@fu-berlin.de."
                delay={300}
                animateBy="words"
                direction="top"
                className="text-inherit"
              />
            </div>

              <div className="flex gap-4">
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                aria-label="Follow on X"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="mailto:ming.ma@fu-berlin.de"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-full bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
                aria-label="Email Ming Ma"
              >
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Right content */}
          <div className="mt-12 h-[22.8rem] lg:hidden">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="h-full w-full"
          />
        </div>
          <div className="hidden lg:flex lg:w-[56%] h-full min-h-[780px] items-center lg:justify-start justify-center lg:pl-4">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="h-[114%] w-full"
          />
        </div>
      </div>
    </Card>
  )
}
