'use client';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-bgLight dark:bg-bgDark font-sans">
      {/* Navbar */}
      <header className="flex w-full items-center justify-between px-16 py-6 shadow-md dark:shadow-black/50 bg-cardLight dark:bg-cardDark">
        <h1 className="text-2xl font-bold text-primary dark:text-accent">Lexora</h1>
        <nav className="flex items-center gap-6">
          <Link href="/login" className="btn btn-primary">
            Login
          </Link>
          <Link href="/signup" className="btn btn-secondary">
            Signup
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex flex-1 flex-col items-center justify-center px-16 text-center sm:px-8">
        <h2 className="text-4xl font-extrabold text-primary dark:text-accent mb-4">
          Think. Organize. Collaborate. Publish.
        </h2>
        <p className="max-w-xl text-lg text-gray-700 dark:text-gray-300 mb-8">
          Lexora is your true knowledge platform — create, collaborate with teams, and publish SEO-ready content with ease.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/dashboard"
            className="btn btn-primary transition-all hover:scale-105"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/blog"
            className="btn btn-secondary transition-all hover:scale-105"
          >
            Explore Blogs
          </Link>
        </div>

        
      </main>

      {/* Footer */}
      <footer className="flex w-full justify-center px-16 py-6 text-gray-600 dark:text-gray-400 bg-cardLight dark:bg-cardDark">
        <p>© 2026 Lexora. All rights reserved.</p>
      </footer>
    </div>
  );
}