import { Navigation2 } from "lucide-react";

interface NavigateButtonProps {
  lat: number;
  lng: number;
  address: string;
}

function getNavigationUrl(lat: number, lng: number): string {
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  const ua = navigator.userAgent;

  if (/android/i.test(ua)) {
    // Try Waze intent on Android, browser will fallback to Google Maps if Waze not installed
    return `intent://ul.waze.com/ul?ll=${lat},${lng}&navigate=yes#Intent;scheme=https;package=com.waze;S.browser_fallback_url=${encodeURIComponent(googleMapsUrl)};end`;
  }

  if (/iphone|ipad|ipod/i.test(ua)) {
    // On iOS, try Google Maps app first, fallback to web
    return `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
  }

  return googleMapsUrl;
}

export function NavigateButton({ lat, lng, address }: NavigateButtonProps) {
  const handleClick = () => {
    const url = getNavigationUrl(lat, lng);
    const w = window.open(url, "_blank");

    // If window.open returned null (blocked) or on iOS where scheme might fail,
    // fallback to Google Maps web URL after a short delay
    if (!w && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
        "_blank",
      );
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex min-h-[40px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      title={`Navegar para ${address}`}
    >
      <Navigation2 className="h-4 w-4" />
      Navegar
    </button>
  );
}
