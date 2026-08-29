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
      className="w-full h-full max-h-full flex flex-col justify-center items-center py-2 sm:py-4 px-2 sm:px-6 select-none overflow-hidden touch-none"
      id="console-menu-screen"
    >
      {/* Responsive Menu Layout:
          - Single column on very small screens (portrait phones)
          - Two columns on sm+ */}
      <div className="w-full flex flex-col justify-center items-center my-auto overflow-hidden select-none">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 sm:gap-x-20 md:gap-x-28 gap-y-5 sm:gap-y-8 md:gap-y-10 w-fit mx-auto overflow-hidden select-none">
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
                className="bg-transparent p-0 border-none outline-none flex items-center gap-4 sm:gap-6 md:gap-8 text-left cursor-pointer group transition-transform duration-100 hover:translate-x-2 focus:outline-none shrink-0 overflow-hidden select-none"
              >
                {/* Pin Icon: non-scrollable & fully visible */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 flex items-center justify-center overflow-hidden pointer-events-none select-none drop-shadow-[2px_2px_0_rgba(0,0,0,0.85)]">
                  <img
                    src={showRedPin ? '/red_pin.png' : '/white_pin.png'}
                    alt={showRedPin ? 'Red Pin' : 'White Pin'}
                    className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-100 group-hover:scale-110"
                    style={{ imageRendering: 'pixelated' }}
                    referrerPolicy="no-referrer"
                    draggable={false}
                  />
                </div>

                {/* Page Name */}
                <span
                  className={`font-pixel text-[28px] sm:text-[36px] md:text-[43px] lg:text-[48px] tracking-wider transition-colors duration-100 drop-shadow-[2px_2px_0_#000] whitespace-nowrap font-bold select-none
                    ${isHovered || isCurrent ? 'text-[#ef4444]' : 'text-white group-hover:text-[#ef4444]'}`}
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
