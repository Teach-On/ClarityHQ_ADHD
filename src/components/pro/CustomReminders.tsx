import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Volume2, Zap, Sliders, Moon, Sun, AlertCircle } from 'lucide-react';
import { useSubscriptionStore } from '../../stores/subscriptionStore';

const CustomReminders = () => {
  const { isProUser } = useSubscriptionStore();
  const [volume, setVolume] = useState(70);
  const [vibration, setVibration] = useState(true);
  const [animation, setAnimation] = useState(true);
  const [reminderTime, setReminderTime] = useState<'morning' | 'afternoon' | 'evening'>('morning');
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseInt(e.target.value));
  };
  
  const playTestSound = () => {
    const audio = new Audio();
    audio.src = 'data:audio/mp3;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFzb25pY1N0dWRpb3MuY29tAFRYWFgAAAASAAADVGl0bGUAVGltZXIgRW5kZWQAVFlFUgAAAAUAAARUaW1lcgBUQ09NAAAAAQAACUNyZWF0ZWQgYnkATGFzb25pYyBTdHVkaW9zAENPTU0AAAAPAAADWWVHAGF1ZGlvIGNsaXAAAP/7kGQAAFIxhVvRmDABD5h6PzHgAFyGFX9IHzcEGgGswMeAAcqX/Tz8lbmPBIHZkMhmQqGYzIZn/o0YSDv8EwiP+EwTCZkORaQP85DMiYJ/8owTCfmQz/lkWTP8zPmf8v/mZEwn5f/8yGY8P/mZE8X/zGZEwTBMRP8pmQyGZE8X/yxERP//MEwTERP//LERMJkMyGZ/+X/l//+WIiJ//iIiJ/+WIiJ///mIiIiIiIiIiIiIiP///iIiIiIiJ/////mIieIiIv///8piIif/KYiIiXCIiIiIiIiIiIiIiIiJ//lMRERERERERERERERETE////////8RMRE////8iBBQVQqCoNFioKixUVBUYKioVBYqDQUFRUFQaKioVmg0FRYaKiqFRmaLDQUFRaZmopExMTExMTEA/AAAA7Mn/N7UzepN6lQaCoKgqCoKgqCoKgqCoKgqCoKgqCoKgqCoKgqCoKgqCoKgqCoKg2Z8zZkEAAAACAe+S0cg';
    audio.volume = volume / 100;
    audio.play().catch(e => console.log('Error playing sound:', e));
    
    // Trigger vibration if enabled
    if (vibration && 'vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
    
    // Trigger animation if enabled
    if (animation) {
      // Show a pulsing notification in the UI
      const notificationElement = document.createElement('div');
      notificationElement.className = 'fixed top-5 right-5 z-50 rounded-lg bg-teal-500 p-4 text-white shadow-lg';
      notificationElement.innerHTML = `
        <div class="flex items-center">
          <Bell class="mr-2 h-5 w-5" />
          <div>
            <h3 class="font-medium">Test Notification</h3>
            <p class="text-sm text-teal-100">This is how your reminders will appear</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(notificationElement);
      
      // Remove after 3 seconds
      setTimeout(() => {
        notificationElement.classList.add('opacity-0', 'transition-opacity', 'duration-500');
        setTimeout(() => {
          document.body.removeChild(notificationElement);
        }, 500);
      }, 3000);
    }
  };
  
  if (!isProUser) {
    return (
      <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 dark:border-teal-800 dark:bg-teal-900/20">
        <h3 className="flex items-center font-medium text-teal-800 dark:text-teal-300">
          <Bell className="mr-2 h-5 w-5" />
          Custom Reminders
        </h3>
        <p className="mt-2 text-sm text-teal-700 dark:text-teal-400">
          Personalize your reminder experience with sound, vibration, and animation options with ClarityHQ Pro.
        </p>
      </div>
    );
  }
  
  return (
    <div className="rounded-lg border border-teal-200 bg-teal-50 p-5 dark:border-teal-800 dark:bg-teal-900/20">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center font-medium text-teal-700 dark:text-teal-300">
          <Bell className="mr-2 h-5 w-5" />
          Custom Reminders
        </h3>
        
        <button
          onClick={playTestSound}
          className="rounded-md bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700 hover:bg-teal-200 dark:bg-teal-900/40 dark:text-teal-300 dark:hover:bg-teal-800"
        >
          Test Reminder
        </button>
      </div>
      
      <div className="space-y-5">
        <div>
          <label className="mb-2 flex items-center text-sm font-medium text-teal-700 dark:text-teal-400">
            <Volume2 className="mr-2 h-4 w-4" />
            Sound Volume
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              className="flex-1 accent-teal-500"
            />
            <span className="w-10 text-right text-sm text-teal-700 dark:text-teal-400">{volume}%</span>
          </div>
        </div>
        
        <div>
          <label className="mb-2 flex items-center text-sm font-medium text-teal-700 dark:text-teal-400">
            <Zap className="mr-2 h-4 w-4" />
            Vibration
          </label>
          <div className="flex items-center">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={vibration}
                onChange={() => setVibration(!vibration)}
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-100 dark:bg-slate-700 dark:peer-focus:ring-teal-900/30"></div>
            </label>
            <span className="ml-2 text-sm text-teal-700 dark:text-teal-400">
              {vibration ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        
        <div>
          <label className="mb-2 flex items-center text-sm font-medium text-teal-700 dark:text-teal-400">
            <Sliders className="mr-2 h-4 w-4" />
            Visual Animation
          </label>
          <div className="flex items-center">
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                className="peer sr-only"
                checked={animation}
                onChange={() => setAnimation(!animation)}
              />
              <div className="peer h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-teal-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-100 dark:bg-slate-700 dark:peer-focus:ring-teal-900/30"></div>
            </label>
            <span className="ml-2 text-sm text-teal-700 dark:text-teal-400">
              {animation ? 'Enabled' : 'Disabled'}
            </span>
          </div>
        </div>
        
        <div>
          <label className="mb-2 flex items-center text-sm font-medium text-teal-700 dark:text-teal-400">
            <AlertCircle className="mr-2 h-4 w-4" />
            Reminder Time Preference
          </label>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setReminderTime('morning')}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                reminderTime === 'morning'
                  ? 'border-teal-500 bg-teal-500 text-white dark:border-teal-400 dark:bg-teal-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Sun className="mb-1 mx-auto h-4 w-4" />
              <div>Morning</div>
            </button>
            
            <button
              onClick={() => setReminderTime('afternoon')}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                reminderTime === 'afternoon'
                  ? 'border-teal-500 bg-teal-500 text-white dark:border-teal-400 dark:bg-teal-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Sun className="mb-1 mx-auto h-4 w-4" />
              <div>Afternoon</div>
            </button>
            
            <button
              onClick={() => setReminderTime('evening')}
              className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                reminderTime === 'evening'
                  ? 'border-teal-500 bg-teal-500 text-white dark:border-teal-400 dark:bg-teal-600'
                  : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              <Moon className="mb-1 mx-auto h-4 w-4" />
              <div>Evening</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomReminders;