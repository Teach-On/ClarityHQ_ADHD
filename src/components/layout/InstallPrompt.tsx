import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

const InstallPrompt = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPromptEvent(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPromptEvent) return;
    
    installPromptEvent.prompt();
    
    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;
  
  return (
    <div className="install-prompt">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-medium">Install ClarityHQ</h3>
        <button 
          onClick={dismissPrompt}
          className="text-slate-500 hover:text-slate-700"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <p className="text-sm mb-3">Install ClarityHQ for the best experience with offline support and quick access from your home screen.</p>
      <div className="flex gap-2">
        <button onClick={dismissPrompt} className="btn btn-outline flex-1">
          Not now
        </button>
        <button onClick={handleInstall} className="btn btn-primary flex-1">
          Install
        </button>
      </div>
    </div>
  );
};

export default InstallPrompt;