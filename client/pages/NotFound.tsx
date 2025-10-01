import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen grid place-items-center bg-[radial-gradient(800px_400px_at_10%_0%,hsl(var(--brand-start)/0.2),transparent)]">
      <div className="text-center card-glass p-8">
        <h1 className="text-5xl font-extrabold text-gradient mb-3">404</h1>
        <p className="text-foreground/70 mb-5">This page doesn’t exist. Let’s get you back on track.</p>
        <a href="/" className="inline-flex items-center rounded-full px-5 py-2 btn-gradient text-white shadow-lg">Go Home</a>
      </div>
    </div>
  );
};

export default NotFound;
