import React, { useState } from 'react'
import Navbar from '../components/Navbar.jsx'
import Header from '../components/Header.jsx'
import ContactModal from '../components/ContactModal.jsx'
import { ArrowDown } from 'lucide-react'
import axios from 'axios'

const Home = () => {
  const [contactOpen, setContactOpen] = useState(false)

  const scrollToAbout = () => {
    document.getElementById("about").scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="bg-[var(--moodify-bg)] text-[var(--moodify-text)] min-h-screen transition-colors duration-500">
      <Navbar />
      <Header />

      {/* Scroll Down Indicator */}
      <div
        className="flex flex-col items-center justify-center mt-20 animate-bounce cursor-pointer"
        onClick={scrollToAbout}
      >
        <ArrowDown size={28} />
        <p className="text-sm mt-2 text-gray-500">Scroll down</p>
      </div>

      {/* ------------------- About Section ------------------- */}
      <section
        id="about"
        className="min-h-screen flex flex-col justify-center items-center text-center py-24 px-6 bg-[var(--moodify-bg)]"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-blue-500 mb-6">
          What We Do
        </h2>
        <p className="max-w-3xl text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
          <span className="font-semibold text-blue-500">Moodify</span> is an
          intelligent emotion-driven platform that helps you understand your
          current mood and offers tailored recommendations to uplift or balance
          your emotions. Using real-time facial analysis, Moodify provides
          insights, activities, and content suggestions to boost your mental
          well-being.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mt-16 max-w-6xl w-full px-4">
          {/* Card 1 */}
          <div className="rounded-2xl shadow-md p-8 bg-white hover:bg-gray-50 dark:bg-[#131a2a] transition-all duration-300 hover:shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-[#1e3a8a] dark:text-blue-400 flex items-center justify-center gap-2">
              🎭 <span>Mood Detection</span>
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed">
              AI analyzes your facial expressions in real time to detect emotional states with accuracy.
            </p>
          </div>

          {/* Card 2 */}
          <div className="rounded-2xl shadow-md p-8 bg-white hover:bg-gray-50 dark:bg-[#131a2a] transition-all duration-300 hover:shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-[#1e3a8a] dark:text-blue-400 flex items-center justify-center gap-2">
              🎧 <span>Smart Recommendations</span>
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed">
              Get personalized playlists, movies, or quotes that match your current emotion.
            </p>
          </div>

          {/* Card 3 */}
          <div className="rounded-2xl shadow-md p-8 bg-white hover:bg-gray-50 dark:bg-[#131a2a] transition-all duration-300 hover:shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-3 text-[#1e3a8a] dark:text-blue-400 flex items-center justify-center gap-2">
              📊 <span>Mood Insights</span>
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-center leading-relaxed">
              Track your emotional trends and learn what improves your mood over time.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------- Features Section (fixed contrast) ------------------- */}
      <section
        id="features"
        className="min-h-screen py-24 px-6 text-center
                   bg-gradient-to-b from-white to-gray-50 dark:from-[#081220] dark:to-[#0c1424]
                   transition-colors duration-300"
      >
        {/* Title: dark in light mode, light in dark mode */}
        <h2 className="text-3xl sm:text-4xl font-bold text-black dark:text-white mb-12">
          Key Features
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto px-4">
          {[
            {
              icon: "🧠",
              title: "AI Emotion Analysis",
              desc: "Advanced facial recognition powered by deep learning to interpret your emotions accurately.",
            },
            {
              icon: "🎵",
              title: "Mood-Based Music",
              desc: "Instantly play curated playlists that align perfectly with your emotional state and energy level.",
            },
            {
              icon: "🎬",
              title: "Emotion-Aware Movies",
              desc: "Get personalized movie suggestions designed to complement and uplift your current mood.",
            },
            {
              icon: "📝",
              title: "Daily Mood Journal",
              desc: "Track your feelings and reflect on your emotional journey with beautiful visual insights.",
            },
            {
              icon: "💬",
              title: "Smart Chatbot",
              desc: "Have thoughtful conversations with our AI that help you better understand your emotional patterns.",
            },
            {
              icon: "🕊️",
              title: "Wellness Challenges",
              desc: "Engage in activities and mindfulness exercises to improve your mood and mental balance.",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="
                group p-8 rounded-2xl border
                bg-white dark:bg-[#071428]
                text-gray-800 dark:text-gray-100
                border-gray-200 dark:border-gray-700
                shadow-sm
                transition-all duration-300 ease-in-out
                hover:-translate-y-2 hover:scale-[1.02]
                hover:shadow-[0_8px_25px_rgba(59,130,246,0.12)]
                hover:border-blue-500
              "
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {feature.icon}
              </div>

              <h4 className="font-semibold text-lg mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {feature.title}
              </h4>

              <p className="leading-relaxed text-sm">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ------------------- Get Started Section ------------------- */}
      <section
        id="get-started"
        className="min-h-[80vh] flex flex-col justify-center items-center text-center py-20 px-6 bg-blue-600 text-white"
      >
        <h2 className="text-4xl font-bold mb-6">Ready to Understand Your Emotions?</h2>
        <p className="text-lg mb-8 max-w-2xl">
          Join Moodify today and start your journey toward emotional awareness and balance.
        </p>

        {/* OPEN CONTACT MODAL */}
        <button
          onClick={() => setContactOpen(true)}
          className="
            mt-2
            px-8 py-3
            text-base font-medium
            rounded-full
            border border-gray-300
            text-gray-800
            shadow-sm
            transition-all duration-200
            hover:-translate-y-0.5
            hover:shadow-md
            hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-500
            hover:text-white
            active:translate-y-0
          "
        >
          Contact Us
        </button>
      </section>

      {/* ------------------- Footer ------------------- */}
      <footer className="bg-[#0b1120] text-gray-400 text-center py-6 text-sm">
        © {new Date().getFullYear()} Moodify · Built for emotional well-being 💙
      </footer>

      {/* Contact modal (uses your existing component) */}
      <ContactModal
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        onSubmit={async (payload) => {
          try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/contact`, payload);
            alert("Your message has been sent successfully!");
            setContactOpen(false);
          } catch (error) {
            console.error(error);
            alert("Something went wrong. Please try again.");
          }
        }}
      />

    </div>
  )
}

export default Home
