'use client'

import { SplineScene } from "@/components/ui/spline";
import { Card } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Twitter, Mail } from "lucide-react";
import { BlurText } from "@/components/ui/BlurText";

export function SplineSceneDemo() {
  return (
    <Card className="w-full h-[500px] bg-white relative overflow-hidden mb-24">
      <div className="flex flex-col md:flex-row h-full">
        {/* Left content */}
        <div className="flex-1 p-8 relative z-10 flex flex-col justify-center">
          <div className="flex flex-col items-center md:items-start">
            <div className="flex items-center gap-6 mb-6">
              <Avatar className="w-24 h-24">
                <AvatarImage src="/avatar.JPG" alt="Profile" />
                <AvatarFallback>ME</AvatarFallback>
              </Avatar>
              <h2 className="text-3xl md:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-700 drop-shadow-sm">
                Ming Ma
              </h2>
            </div>
            <div className="mt-2 text-gray-800 max-w-2xl mx-auto md:mx-0 space-y-2 leading-relaxed">
              <div className="mb-1">
                <BlurText
                  text="Hi, Welcome! I am a postdoctoral researcher at Free University Berlin."
                  delay={100}
                  animateBy="words"
                  direction="top"
                  className="text-base"
                />
              </div>
              <div className="mb-1">
                <BlurText
                  text="I study computational social science, comparative politics, and AI governance."
                  delay={150}
                  animateBy="words"
                  direction="top"
                  className="text-base"
                />
                <BlurText
                  text="I am particularly interested in how (mis)information about emerging technology both shapes and is shaped by the dynamics of global politics, digital spaces, and everyday life."
                  delay={200}
                  animateBy="words"
                  direction="top"
                  className="text-base mt-1"
                />
              </div>
              <div className="mb-1">
                <BlurText
                  text="My work has been published in peer-reviewed journals, including Perspectives on Politics, China Review, China Perspectives, among other journals."
                  delay={250}
                  animateBy="words"
                  direction="top"
                  className="text-base"
                />
              </div>
              <div>
                <BlurText
                  text="Contact me at ming.ma@fu-berlin.de."
                  delay={300}
                  animateBy="words"
                  direction="top"
                  className="text-base"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-black transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a 
                href="mailto:example@email.com"
                className="text-gray-600 hover:text-black transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Right content */}
        <div className="flex-1 relative">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </Card>
  )
}