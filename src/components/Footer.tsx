import {
  MapPin,
  Calendar,
  Clock,
  Mail,
  Phone,
  ExternalLink,
  Instagram,
} from 'lucide-react';
import { sound } from '../utils/audio';

export function Footer() {
  const eventLeads = [
    { name: 'Trishit Ghosh', phone: '7596026656' },
    { name: 'Saptadip Mukherjee', phone: '8100655418' },
    { name: 'Medimi Nishit', phone: '8910922993' },
  ];

  return (
    <footer
      className="w-full max-w-6xl mx-auto mt-6 sm:mt-10 flex flex-col items-center gap-8 px-4 text-center select-none"
      id="real-world-footer"
    >


      {/* 2. Venue, Event Leads, and Connect Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 w-full pt-6 border-t border-[#1b2650] text-left">
        {/* Column 1: Venue */}
        <div className="space-y-3.5">
          <h3 className="font-condensed text-xl sm:text-2xl font-bold tracking-wide text-white uppercase">
            Venue
          </h3>

          <ul className="space-y-2.5 font-condensed text-[15px] sm:text-[16px] text-[#c0c6e4] tracking-wide">
            <li className="flex items-start gap-2.5">
              <MapPin className="h-4.5 w-4.5 text-[#e53935] shrink-0 mt-0.5" />
              <span>IEM Aegis Building, College More, Salt Lake Sector V, Kolkata</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Calendar className="h-4.5 w-4.5 text-[#6ec0ff] shrink-0" />
              <span>11th-12th September 2026</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Clock className="h-4.5 w-4.5 text-[#a7d38a] shrink-0" />
              <span>24 Hour Hackathon</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail className="h-4.5 w-4.5 text-[#f4c151] shrink-0" />
              <a
                href="mailto:cognitia2026.official@gmail.com"
                onClick={() => sound.playBlip(700)}
                className="hover:text-white transition-colors underline decoration-dotted"
              >
                cognitia2026.official@gmail.com
              </a>
            </li>
          </ul>

          {/* Interactive Map Embed Card */}
          <div className="relative rounded-lg overflow-hidden border border-[#2a3765] bg-[#0d152e] shadow-md group max-w-[340px] mt-2">
            <div className="w-full h-32 relative">
              <iframe
                title="IEM Aegis Building Kolkata Location Map"
                src="https://maps.google.com/maps?q=IEM+Aegis+Building+Y-12+Salt+Lake+Sector+V+Kolkata&t=&z=15&ie=UTF8&iwloc=&output=embed"
                className="w-full h-full border-0 filter brightness-95 contrast-105"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d152e] via-transparent to-transparent pointer-events-none" />
            </div>

            <div className="p-2 bg-[#0d152e] border-t border-[#1b2650] flex items-center justify-between">
              <span className="font-condensed text-[12.5px] tracking-wider text-[#6ec0ff] uppercase font-bold">
                SECTOR V, KOLKATA
              </span>
              <a
                href="https://maps.google.com/?q=IEM+Aegis+Building+College+More+Salt+Lake+Sector+V+Kolkata"
                target="_blank"
                rel="noreferrer"
                onClick={() => sound.playBlip(800)}
                className="inline-flex items-center gap-1 font-condensed text-[12.5px] text-white bg-[#1b274e] hover:bg-[#25366d] px-2.5 py-0.5 rounded border border-[#3b4b80] transition-colors"
              >
                <span>Open in Maps</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Column 2: Event Leads */}
        <div className="space-y-3.5">
          <h3 className="font-condensed text-xl sm:text-2xl font-bold tracking-wide text-white uppercase">
            Event Leads
          </h3>

          <div className="space-y-2.5 pt-1">
            {eventLeads.map((lead, idx) => (
              <a
                key={idx}
                href={`tel:${lead.phone}`}
                onClick={() => sound.playBlip(750)}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-full bg-[#1b121c] hover:bg-[#251828] border border-[#521c2c] hover:border-[#e53935] transition-all group max-w-[360px]"
              >
                <div className="flex items-center gap-2.5 pl-2">
                  <Phone className="h-4 w-4 text-[#e53935]" />
                  <span className="font-condensed text-[15px] sm:text-[16px] text-white font-medium tracking-wide">
                    {lead.name}
                  </span>
                </div>
                <span className="font-condensed text-[13.5px] bg-[#38141f] text-[#ffb4c0] border border-[#6b2539] px-3 py-0.5 rounded-full font-bold tracking-wider group-hover:border-[#e53935] transition-colors">
                  {lead.phone}
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Column 3: Connect */}
        <div className="space-y-3.5">
          <h3 className="font-condensed text-xl sm:text-2xl font-bold tracking-wide text-white uppercase">
            Connect
          </h3>

          <div className="flex items-center gap-3 pt-1">
            <a
              href="https://instagram.com/cognitia2k26"
              target="_blank"
              rel="noreferrer"
              onClick={() => sound.playBlip(650)}
              className="px-3.5 py-2 rounded-lg bg-[#141d38] border border-[#2a3765] hover:border-[#6ec0ff] hover:text-white text-[#9aa0c8] transition-all hover:scale-105 flex items-center gap-2 font-condensed text-[14px] font-bold"
              title="Instagram @cognitia2k26"
              aria-label="Instagram @cognitia2k26"
            >
              <Instagram className="h-5 w-5 text-[#e53935]" />
              <span>@cognitia2k26</span>
            </a>
          </div>
        </div>
      </div>

      {/* 3. Legal and Quick Links */}
      <nav className="flex flex-wrap justify-center items-center gap-x-5 gap-y-1.5 text-[13px] uppercase tracking-wider font-condensed text-[#9aa0c8] pt-4 border-t border-[#1b2650] w-full max-w-3xl">
        <a href="#privacy" className="hover:text-white transition-colors">PRIVACY POLICY</a>
        <span className="text-[#3b4778]">•</span>
        <a href="#terms" className="hover:text-white transition-colors">TERMS OF USE</a>
        <span className="text-[#3b4778]">•</span>
        <a href="#cookies" className="hover:text-white transition-colors">COOKIE CONSENT TOOL</a>
        <span className="text-[#3b4778]">•</span>
        <a href="#credits" className="hover:text-white transition-colors">CREDITS ▲</a>
      </nav>



    </footer>
  );
}
