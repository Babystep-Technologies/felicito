import { Link } from 'react-router-dom';
import { Github } from 'lucide-react';
import { GITHUB_REPO_URL } from '@/lib/constants';
import Wordmark from '@/components/Wordmark';
import { Bird, WavyEdge } from '@/components/doodles';

const linkClass =
  'decoration-brand-yellow decoration-2 underline-offset-4 transition-colors hover:text-brand-yellow hover:underline';

const Footer: React.FC = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-auto">
      <div className="relative">
        <Bird className="absolute -top-7 right-[12%] w-12 sm:w-14" />
        <WavyEdge className="text-ink" />
      </div>
      <div className="bg-ink">
        <div className="max-w-screen-xl mx-auto px-6 pt-8 pb-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 text-md text-paper/85">
          {/* Column 1: Logo + Rights */}
          <div className="space-y-4">
            <Link to="/" className="inline-block">
              <Wordmark
                width={140}
                className="h-auto [--wordmark-letters:var(--paper)] [--wordmark-sparkle:var(--color-brand-yellow)]"
                animateSparkle={false}
              />
            </Link>
            <p className="text-sm text-paper/60 leading-relaxed">
              &copy; {year} BabyStep Technologies, Inc. <br />
              All rights reserved.
            </p>
          </div>

          {/* Column 2: Explore */}
          <div className="space-y-3">
            <h4 className="font-display text-lg text-paper">Explore</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/for-business" className={linkClass}>
                  For Business
                </Link>
              </li>
              <li>
                <Link to="https://blog.felicito.app" className={linkClass}>
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/buy_credits" className={linkClass}>
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="/careers" className={linkClass}>
                  Careers
                </Link>
              </li>
              <li>
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 ${linkClass}`}
                >
                  <Github className="w-4 h-4" />
                  Open Source
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Legal */}
          <div className="space-y-3">
            <h4 className="font-display text-lg text-paper">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/disclaimer" className={linkClass}>
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link to="/user-policy" className={linkClass}>
                  User Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
