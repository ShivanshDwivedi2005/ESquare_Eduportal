import { useEffect, useRef, useState } from 'react';


type GoogleCredentialResponse = {
  credential: string;
};

type GoogleIdentity = {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        element: HTMLElement,
        options: Record<string, string | number>,
      ) => void;
    };
  };
};

declare global {
  interface Window {
    google?: GoogleIdentity;
  }
}


interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
}


const SCRIPT_ID = 'google-identity-services';


export function GoogleSignInButton({ onCredential }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [unavailable, setUnavailable] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  callbackRef.current = onCredential;

  useEffect(() => {
    if (!clientId) {
      setUnavailable(true);
      return;
    }

    let cancelled = false;
    const render = () => {
      if (cancelled || !window.google || !containerRef.current) return;
      containerRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: ({ credential }) => callbackRef.current(credential),
      });
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        width: Math.min(containerRef.current.clientWidth || 400, 400),
      });
    };

    if (window.google) {
      render();
      return () => { cancelled = true; };
    }

    let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', render);
    script.addEventListener('error', () => setUnavailable(true), { once: true });

    return () => {
      cancelled = true;
      script?.removeEventListener('load', render);
    };
  }, [clientId]);

  if (unavailable) {
    return (
      <p className="rounded-md border border-border px-3 py-2 text-center text-xs text-muted-foreground">
        Google sign-in is unavailable right now. You can still use your username or email.
      </p>
    );
  }

  return <div ref={containerRef} className="flex min-h-10 w-full justify-center" aria-label="Continue with Google" />;
}
