import { useEffect, useState } from 'react';
import { Builder } from './Builder';
import { LandingPage } from './LandingPage';

type View = 'landing' | 'builder';

function readView(): View {
  return window.location.hash === '#builder' ? 'builder' : 'landing';
}

export function App() {
  const [view, setView] = useState<View>(readView);

  useEffect(() => {
    const handleHashChange = () => setView(readView());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [view]);

  const openBuilder = () => {
    window.location.hash = 'builder';
  };

  const openLanding = () => {
    window.location.hash = '';
  };

  return view === 'builder' ? <Builder onHome={openLanding} /> : <LandingPage onOpenBuilder={openBuilder} />;
}
