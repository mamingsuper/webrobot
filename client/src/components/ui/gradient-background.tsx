
import { motion } from "framer-motion";

export function GradientBackground() {
    return (
        <div className="fixed inset-0 min-h-screen w-full -z-10 overflow-hidden bg-[#fffbf5]">
            {/* Organic blurry orbs imitating the 'Liftoff' style */}

            {/* Warm Orange/Gold Orb */}
            <motion.div
                className="absolute top-[-10%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-[#ff9f1c]/20 blur-[130px]"
                animate={{
                    x: [0, 50, -20, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 0.9, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Soft Blue/Teal Orb */}
            <motion.div
                className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-[#2ec4b6]/20 blur-[130px]"
                animate={{
                    x: [0, -30, 20, 0],
                    y: [0, 60, 20, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 30,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            {/* Deep Purple/Pink Orb */}
            <motion.div
                className="absolute bottom-[-10%] left-[20%] w-[70vw] h-[70vw] rounded-full bg-[#9d4edd]/15 blur-[150px]"
                animate={{
                    x: [0, 40, -40, 0],
                    y: [0, -40, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 35,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />
        </div>
    );
}

