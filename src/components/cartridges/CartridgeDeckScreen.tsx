import { useState } from 'react';
import { CartridgeId } from '../../types';
import { sound } from '../../utils/audio';
import { awsService } from '../../services/awsService';

interface CartridgeDeckScreenProps {
  currentCartridge: CartridgeId;
  onSelectCartridge: (id: CartridgeId) => void;
  onCloseDeck: () => void;
}

interface MenuPageItem {
  id: CartridgeId;
  name: string;
}

export function CartridgeDeckScreen({
  currentCartridge,
  onSelectCartridge,
  onCloseDeck,
}: CartridgeDeckScreenProps) {
  const [hoveredId, setHoveredId] = useState<CartridgeId | null>(null);
  const activeLeadTeam = awsService.getActiveLeadTeam();
  const isLoggedIn = !!activeLeadTeam;

  const menuPages: MenuPageItem[] = [
    { id: 'dashboard', name: 'DASHBOARD' },
    { id: 'rules', name: 'RULES' },
    { id: 'tracks', name: 'TRACKS' },
    { id: 'timeline', name: 'SCHEDULE' },
    { id: 'sponsors', name: 'SPONSORS' },
    { id: 'members', name: 'MEMBERS' },
    { id: 'prizes', name: 'PRIZES' },
    { id: 'faq', name: 'FAQ' },
  ];

  const handleSelect = (id: CartridgeId) => {
    sound.playBoot();
    onSelectCartridge(id);
    onCloseDeck();
  };

  return (
    <div
      className="flex-1 w-full h-full min-h-[460px] flex flex-col justify-center items-center py-6 px-4 select-none"
      id="console-menu-screen"
    >
      {/* Centered 2-Column Menu Layout */}
      <div className="w-full max-w-xl sm:max-w-2xl flex flex-col justify-center items-center my-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 sm:gap-x-16 md:gap-x-20 gap-y-6 sm:gap-y-8 md:gap-y-9 w-fit mx-auto">
          {menuPages.map((page) => {
            const isHovered = hoveredId === page.id;
            const isCurrent = currentCartridge === page.id || (isLoggedIn && page.id === 'register' && currentCartridge === 'login');
            const showRedPin = isHovered || isCurrent;

            return (
              <button
                key={page.id}
                type="button"
                id={`menu-btn-${page.id}`}
                onClick={() => handleSelect(page.id)}
                onMouseEnter={() => {
                  setHoveredId(page.id);
                  sound.playHover();
                }}
                onMouseLeave={() => setHoveredId(null)}
                className="bg-transparent p-0 border-none outline-none flex items-center gap-4 sm:gap-5 text-left cursor-pointer group transition-transform duration-100 hover:translate-x-2 focus:outline-none"
              >
                {/* Large Pin Image: white_pin.png default, red_pin.png on hover/active */}
                <div className="w-11 h-11 sm:w-13 sm:h-13 md:w-14 md:h-14 shrink-0 flex items-center justify-center drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
                  <img
                    src={showRedPin ? '/red_pin.png' : '/white_pin.png'}
                    alt={showRedPin ? 'Red Pin' : 'White Pin'}
                    className="w-full h-full object-contain pointer-events-none transition-transform duration-100 group-hover:scale-110"
                    style={{ imageRendering: 'pixelated' }}
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Page Name Only */}
                <span
                  className={`font-pixel text-[13px] sm:text-[15px] md:text-[17px] tracking-wider transition-colors duration-100 drop-shadow-[2px_2px_0_#000] whitespace-nowrap
                    ${isHovered || isCurrent ? 'text-[#eb5147]' : 'text-white group-hover:text-[#eb5147]'}`}
                >
                  {page.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
