
import { Home, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {children}
      </main>
      
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-background">
        <div className="flex justify-around items-center h-16">
          <Link to="/" className={`flex flex-col items-center justify-center flex-1 h-full ${location.pathname === '/' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Home size={24} />
            <span className="text-xs mt-1">Explore</span>
          </Link>
          <Link to="/favorites" className={`flex flex-col items-center justify-center flex-1 h-full ${location.pathname === '/favorites' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Heart size={24} />
            <span className="text-xs mt-1">Favorites</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
