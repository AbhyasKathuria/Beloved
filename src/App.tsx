import { useState, useEffect } from 'react';
import { BuilderPage } from './pages/BuilderPage';
import { RevealPage } from './pages/RevealPage';
import { DashboardPage } from './pages/DashboardPage';

type Route = 
  | { type: 'builder' }
  | { type: 'reveal'; giftId: string }
  | { type: 'dashboard' };

function App() {
  const [route, setRoute] = useState<Route>({ type: 'builder' });

  // Resolve current route from URL query parameters
  const resolveRoute = () => {
    const params = new URLSearchParams(window.location.search);
    const giftId = params.get('gift');
    const page = params.get('page');

    if (giftId) {
      setRoute({ type: 'reveal', giftId });
    } else if (page === 'dashboard') {
      setRoute({ type: 'dashboard' });
    } else {
      setRoute({ type: 'builder' });
    }
  };

  useEffect(() => {
    // Resolve route on initial load
    resolveRoute();

    // Listen to browser navigation (back/forward)
    const handlePopState = () => {
      resolveRoute();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (params: { gift?: string; page?: string } | null) => {
    const url = new URL(window.location.href);
    url.search = ''; // Clear existing params
    
    if (params) {
      if (params.gift) url.searchParams.set('gift', params.gift);
      if (params.page) url.searchParams.set('page', params.page);
    }

    window.history.pushState({}, '', url.toString());
    resolveRoute();
  };

  const navigateHome = () => {
    // Reset background styles to original when navigating home
    document.body.className = '';
    navigateTo(null);
  };

  const navigateToDashboard = () => {
    // Reset background styles
    document.body.className = '';
    navigateTo({ page: 'dashboard' });
  };

  // Render appropriate view based on route state
  switch (route.type) {
    case 'reveal':
      return <RevealPage giftId={route.giftId} onNavigateHome={navigateHome} />;
    case 'dashboard':
      return <DashboardPage onNavigateHome={navigateHome} />;
    case 'builder':
    default:
      return <BuilderPage onNavigateToDashboard={navigateToDashboard} />;
  }
}

export default App;
