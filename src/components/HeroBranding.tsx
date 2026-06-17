import { TriondaBall, WorldCupLogo } from './BrandAssets';
import { TEAM_FLAG_MAP } from '../data/flagMap';

const HOST_CHIPS = [
  {
    label: 'USA',
    flagKey: 'United States',
    className: 'border-host-usa/30 bg-host-usa/15 text-host-ice',
  },
  {
    label: 'Mexico',
    flagKey: 'Mexico',
    className: 'border-host-mexico/30 bg-host-mexico/15 text-host-ice',
  },
  {
    label: 'Canada',
    flagKey: 'Canada',
    className: 'border-host-canada/30 bg-host-canada/15 text-host-ice',
  },
] as const;

export const HeroBranding = () => {
  return (
    <div className="brand-shell isolate overflow-hidden p-5 sm:p-6 w-full min-w-0">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,89,161,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(24,115,91,0.16),transparent_32%)]" />

      <div className="relative flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="block sm:hidden shrink-0">
            <WorldCupLogo size={48} />
          </div>
          <div className="hidden sm:block shrink-0">
            <WorldCupLogo size={108} />
          </div>
          <h2 className="text-sm sm:text-2xl font-bold text-white text-center flex-1 leading-tight min-w-0">
            FIFA WORLD CUP 2026
          </h2>
          <div className="block sm:hidden shrink-0 animate-ball-float">
            <TriondaBall size={44} />
          </div>
          <div className="hidden sm:block shrink-0 animate-ball-float">
            <TriondaBall size={96} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {HOST_CHIPS.map((chip) => (
            <div
              key={chip.label}
              className={`rounded-[22px] border px-2 py-2 sm:px-3 sm:py-3 ${chip.className}`}
            >
              <div className="flex items-center justify-center sm:justify-start gap-1 sm:gap-2 text-[9px] sm:text-xs uppercase tracking-[0.1em] sm:tracking-[0.22em]">
                <img
                  src={TEAM_FLAG_MAP[chip.flagKey]}
                  alt={`${chip.label} flag`}
                  className="h-3 w-3 sm:h-4 sm:w-4 rounded-sm object-cover"
                />
                <span className="truncate">{chip.label}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
