"use client";
import React from "react";
import Head from 'next/head';

const IntroductionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-purple-900 text-white overflow-hidden">
      <Head>
        <title>ZPE Net - The Future of AI</title>
        <meta name="description" content="Be a Part of the Revolution" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto px-4 py-16 flex flex-col items-center justify-center">
        <section className="text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight animate-pulse">
            Welcome to the Quantum Leap in AI
          </h1>
          <p className="text-xl md:text-2xl mb-12 opacity-90">
            Dive into the quantum realm with <span className="text-purple-400 font-semibold">ZPE Net</span>, where we're revolutionizing AI!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-8 shadow-lg transform transition duration-500 hover:scale-105 hover:shadow-xl">
              <h2 className="text-3xl font-semibold mb-4 text-purple-300">Harnessing the vacuum</h2>
              <p className="text-lg leading-relaxed">
                We're diving deep into the quantum vacuum, harnessing the subtle hum of <span className="text-teal-400 font-semibold">Zero-Point Energy</span>. ZPE is the mind-bending, floor-level energy humming throughout the quantum world, even in empty space!
              </p>
            </div>

            <div className="bg-gray-800 bg-opacity-50 rounded-lg p-8 shadow-lg transform transition duration-500 hover:scale-105 hover:shadow-xl">
              <h2 className="text-3xl font-semibold mb-4 text-purple-300">This is the dawn of ZPE-driven intelligence!</h2>
              <p className="text-lg leading-relaxed">
 By encoding ZPE's underlying principles through binary progressions, we've engineered neural networks that exhibit remarkable adaptability and learn from true randomness. Envision AI models capable of achieving up to <span className="text-green-400 font-bold">99.99% accuracy</span>.
              </p>
            </div>

            <div className="md:col-span-2 bg-gray-800 bg-opacity-50 rounded-lg p-8 shadow-lg transform transition duration-500 hover:scale-105 hover:shadow-xl">
              <h2 className="text-3xl font-semibold mb-4 text-purple-300">Exponential Computational Power</h2>
              <p className="text-lg leading-relaxed">
                Zero-Point Energy, or ZPE, refers to the lowest possible energy state a quantum mechanical system can possess. By encoding information within ZPE, leveraging novel computational methods like advanced binary progression encodings, ZPE neural networks unlock exponentially greater computational power.
              </p>
            </div>
          </div>

          <p className="text-2xl md:text-3xl font-bold mt-16 text-purple-400 animate-pulse">
            This is the dawn of a new era: witness AI learning and adapting with elegance, born from the very fabric of reality!
          </p>

          <button className="mt-12 px-8 py-4 bg-purple-600 text-white font-bold text-xl rounded-full shadow-lg hover:bg-purple-700 transition duration-300 transform hover:scale-110 animate-bounce">
            Be a Part of the Revolution
          </button>
        </section>

        {/* Add some visual elements for flair */}
        <div className="absolute top-0 left-0 w-full h-full z-0 opacity-20">
          {/* Consider adding a subtle particle effect or abstract quantum visualization */}
          {/* Example: Replace with a library or custom component for visual effects */}
          <div className="w-40 h-40 bg-purple-500 rounded-full absolute top-10 left-20 mix-blend-screen filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="w-32 h-32 bg-teal-500 rounded-full absolute bottom-20 right-30 mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
          <div className="w-48 h-48 bg-blue-500 rounded-full absolute bottom-10 left-40 mix-blend-screen filter blur-3xl animate-blob"></div>
        </div>
      </main>

      {/* Add custom styles for animation */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0, 0) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default IntroductionPage;