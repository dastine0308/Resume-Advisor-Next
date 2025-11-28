"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const [currentBanner, setCurrentBanner] = useState(0);
  const banners = [
    "/banner_1.png",
    "/banner_2.png",
    "/banner_3.png",
    "/banner_4.png",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="px-4 py-12 md:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 md:text-5xl lg:text-6xl">
              Revolutionize Your Resume with{" "}
              <span className="text-indigo-600">LaTeX</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 md:mt-6 md:text-xl">
              Stop fighting with formatting. Resume Advisor translates your
              career details into clean, ATS-optimized LaTeX
              resumes—automatically.
            </p>
            <div className="mt-8">
              <Link href="/login">
                <Button variant="primary" className="px-8 py-3 text-lg">
                  Build My Resume for Free
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image Carousel */}
          <div className="relative mt-12 md:mt-16">
            <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl shadow-2xl">
              {banners.map((banner, index) => (
                <div
                  key={banner}
                  className={`transition-opacity duration-700 ${
                    index === currentBanner ? "opacity-100" : "opacity-0 absolute inset-0"
                  }`}
                >
                  <Image
                    src={banner}
                    alt={`Resume Advisor Feature ${index + 1}`}
                    width={1920}
                    height={1080}
                    className="w-full h-auto"
                    priority={index === 0}
                    quality={90}
                  />
                </div>
              ))}
            </div>
            {/* Carousel Indicators */}
            <div className="mt-4 flex justify-center gap-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentBanner(index)}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentBanner
                      ? "w-6 bg-indigo-600"
                      : "bg-gray-300 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="bg-white px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 md:grid-cols-2 md:gap-12">
            {/* The Hard Way */}
            <div className="rounded-2xl border border-red-100 bg-red-50 p-6 md:p-8">
              <h3 className="text-xl font-bold text-red-700 md:text-2xl">
                The Hard Way
              </h3>
              <ul className="mt-4 space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Spending hours formatting margins in Word
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Getting rejected by ATS bots because your resume isn&apos;t
                  machine-readable
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500">✗</span>
                  Learning complex LaTeX syntax just to look professional
                </li>
              </ul>
            </div>

            {/* The Resume Advisor Way */}
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6 md:p-8">
              <h3 className="text-xl font-bold text-green-700 md:text-2xl">
                The Resume Advisor Way
              </h3>
              <ul className="mt-4 space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <div>
                    <strong>Fill the Form:</strong> Just enter your details. We
                    handle the code.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <div>
                    <strong>Optimize with AI:</strong> We scan your target job
                    description and tell you exactly what keywords to add.
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500">✓</span>
                  <div>
                    <strong>Get Hired:</strong> Download a crisp,
                    typography-perfect PDF that recruiters love.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-4xl">
            Powerful Features
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="🤖"
              title="AI Keyword Extraction"
              description="Paste a job description and our AI identifies the critical skills and phrasing you need to include to pass the ATS scan."
            />
            <FeatureCard
              icon="📄"
              title="Instant LaTeX Compilation"
              description="Get the typographic quality of LaTeX without writing a single line of code. We compile to PDF in real-time."
            />
            <FeatureCard
              icon="✍️"
              title="Smart Content Enrichment"
              description="Stuck on what to write? Our AI helps rewrite your bullet points for maximum impact and clarity."
            />
            <FeatureCard
              icon="✉️"
              title="Custom Cover Letters"
              description="Generate a tailored cover letter that aligns perfectly with your resume and the specific job opening."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-indigo-50 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-4xl">
            How It Works
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <StepCard
              step={1}
              title="Input Your Data"
              description="Use our guided profile builder to add your experience, education, and projects."
            />
            <StepCard
              step={2}
              title="Target the Job"
              description="Paste the job listing URL or text. We analyze it for 'must-have' skills."
            />
            <StepCard
              step={3}
              title="Select Keywords"
              description="Review extracted keywords and verify which ones you possess."
            />
            <StepCard
              step={4}
              title="Download"
              description="Export a production-ready PDF or the raw LaTeX source code."
            />
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-4xl">
            Who is Resume Advisor for?
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <UseCaseCard
              title="Software Engineers"
              description="Highlight technical stacks clearly and make your skills shine."
            />
            <UseCaseCard
              title="Students & Grads"
              description="Create strictly formatted, professional resumes for internships."
            />
            <UseCaseCard
              title="Career Switchers"
              description="Use AI to pivot your experience to match new industry keywords."
            />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 px-4 py-16 md:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-gray-900 md:text-4xl">
            Frequently Asked Questions
          </h2>
          <div className="mt-12 space-y-6">
            <FAQItem
              question="Do I need to know LaTeX?"
              answer="No! You just type into text boxes. We handle all the LaTeX code generation in the background."
            />
            <FAQItem
              question="Is this ATS friendly?"
              answer="Yes. LaTeX generates clean, structured text that Applicant Tracking Systems can parse much easier than complex Word templates."
            />
            <FAQItem
              question="Is it free to start?"
              answer="Yes, you can build your first resume and cover letter for free."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600 px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-white md:text-4xl">
            Ready to Land Your Dream Job?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-indigo-100">
            Join thousands of job seekers who have already improved their
            resumes with Resume Advisor.
          </p>
          <div className="mt-8">
            <Link href="/login">
              <Button
                variant="secondary"
                className="bg-white px-8 py-3 text-lg text-indigo-600 hover:bg-gray-100"
              >
                Get Started Free
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 py-8 text-gray-400">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="text-lg font-bold text-white">Resume Advisor</div>
            <div className="text-sm">Copyright 2025. All rights reserved.</div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-white">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-white">
                Terms of Service
              </a>
              <a href="#" className="hover:text-white">
                Contact Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function StepCard({
  step,
  title,
  description,
}: {
  step: number;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-xl font-bold text-white">
        {step}
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function UseCaseCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <span className="font-medium text-gray-900">{question}</span>
        <span className="ml-4 text-gray-500">{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className="border-t border-gray-200 px-6 py-4 text-gray-600">
          {answer}
        </div>
      )}
    </div>
  );
}
