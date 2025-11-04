import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { AppContext } from '../context/AppContext';

const Header = () => {
  const { userData } = useContext(AppContext);
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center mt-60 px-4 text-center text-gray-800">
      <div
        className="rounded-full overflow-hidden mb-6"
        style={{ width: "120px", height: "120px" }}
      >
        <img
          src={assets.header_img}
          alt="Header"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      <h1 className="flex items-center gap-2 text-xl sm:text-3xl font-medium mb-2">
        Hey {userData ? userData.name : 'Developer'}!
        <img className="w-8 aspect-square" src={assets.hand_wave} alt="wave" />
      </h1>

      <h2 className="text-3xl sm:text-5xl font-semibold mb-4">
        Welcome to Moodify
      </h2>

      <p className="mb-8 max-w-md">
        Let's start with face detection and get some personalized recommendations.
      </p>

      <button
        onClick={() => navigate('/emotion')} // ✅ Navigate to EmotionPage
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
        Get Started
      </button>
    </div>
  );
};

export default Header;