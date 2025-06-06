import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Brain, CheckCircle, Heart, Calendar } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-16 md:py-28">
        <div className="flex flex-col items-center justify-between gap-16 md:flex-row">
          {/* Left side content */}
          <div className="max-w-lg">
            <div className="flex items-center gap-2 mb-5">
              <Brain className="h-10 w-10 text-blue-600" />
              <h1 className="text-3xl font-bold">ClarityHQ</h1>
            </div>

            <h2 className="text-4xl font-bold leading-tight mb-8 md:text-5xl">
              Clear your mind,<br />
              not just your todo list.
            </h2>

            <p className="text-xl text-slate-700 dark:text-slate-300 mb-12">
              ClarityHQ helps you organize tasks, build healthy habits, and focus —
              your way.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-blue-500 px-8 py-3 text-lg font-medium text-white shadow-sm hover:bg-blue-600"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-8 py-3 text-lg font-medium text-blue-600 shadow-sm hover:bg-slate-50"
              >
                Take a Tour
              </Link>
            </div>
          </div>

          {/* Right side illustration */}
          <div className="hidden md:block">
            <svg width="350" height="350" viewBox="0 0 350 350" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M200 270C255.228 270 300 225.228 300 170C300 114.772 255.228 70 200 70C144.772 70 100 114.772 100 170C100 225.228 144.772 270 200 270Z" fill="#BFDBFE" />
              <path d="M175 255C182.5 255 200 240 200 190C200 140 175 115 160 110" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
              <path d="M175 255C167.5 255 150 240 150 190C150 140 175 115 190 110" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
              <path d="M140 150C150 140 170 140 175 160C180 180 195 180 205 175" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
              <path d="M210 150C200 140 180 140 175 160C170 180 155 180 145 175" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" />
              <rect x="205" y="130" width="120" height="150" rx="8" fill="white" stroke="#3B82F6" strokeWidth="2" />
              <circle cx="225" cy="160" r="6" fill="#3B82F6" />
              <line x1="240" y1="160" x2="300" y2="160" stroke="#3B82F6" strokeWidth="2" />
              <circle cx="225" cy="185" r="6" fill="#3B82F6" />
              <line x1="240" y1="185" x2="300" y2="185" stroke="#3B82F6" strokeWidth="2" />
              <circle cx="225" cy="210" r="6" fill="#3B82F6" />
              <line x1="240" y1="210" x2="300" y2="210" stroke="#3B82F6" strokeWidth="2" />
              <circle cx="225" cy="235" r="6" stroke="#3B82F6" strokeWidth="2" />
              <line x1="240" y1="235" x2="300" y2="235" stroke="#3B82F6" strokeWidth="2" />
              <circle cx="143" cy="224" r="8" fill="#3B82F6" opacity="0.5" />
              <path d="M255 260C270 280 290 290 320 300" stroke="#3B82F6" strokeWidth="3" />
            </svg>
          </div>
        </div>

        {/* Feature Section */}
        <div className="mt-32 grid grid-cols-1 gap-16 md:grid-cols-3">
          <div className="feature-block hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Designed for Focus</h3>
            </div>
            <p className="text-slate-800 dark:text-slate-300">
              Break down your day into manageable tasks and streak-friendly habits.
            </p>
          </div>

          <div className="feature-block hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600">
                <Heart className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">Gentle Reminders</h3>
            </div>
            <p className="text-slate-800 dark:text-slate-300">
              No guilt, just nudges to keep going at your pace.
            </p>
          </div>

          <div className="feature-block hover:shadow-md transition-shadow duration-300">
            <div className="flex gap-3 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full text-blue-600">
                <Calendar className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-bold">See Your Flow</h3>
            </div>
            <p className="text-slate-800 dark:text-slate-300">
              A clean daily timeline that blends tasks, events, and habits.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
