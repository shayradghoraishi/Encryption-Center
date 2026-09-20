import { useLocation, Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1) || "unknown";

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-muted-foreground/40">404</h1>
          <div className="h-0.5 w-16 bg-border mx-auto" />
        </div>

        <div className="space-y-3">
          <h2 className="text-2xl font-medium">Page Not Found</h2>
          <p className="text-muted-foreground leading-relaxed">
            The page <span className="font-medium text-foreground">"{pageName}"</span> could not be found.
          </p>
        </div>

        <div className="pt-4">
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
