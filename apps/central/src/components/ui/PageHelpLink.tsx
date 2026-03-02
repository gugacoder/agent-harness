import { HelpCircle } from "lucide-react";
import { Link } from "react-router";

interface PageHelpLinkProps {
  url: string;
}

export function PageHelpLink({ url }: PageHelpLinkProps) {
  return (
    <Link
      to={url}
      title="Ajuda"
      className="text-muted-foreground hover:text-foreground transition-colors"
    >
      <HelpCircle className="h-5 w-5" />
    </Link>
  );
}
