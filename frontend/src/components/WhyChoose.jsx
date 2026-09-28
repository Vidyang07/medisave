import {
  ShieldCheckIcon,
  PillIcon,
  ClockIcon,
  FileTextIcon,
} from "./common/Icons";

export default function WhyChoose() {
  const values = [
    {
      icon: PillIcon,
      title: "Reduce Medicine Waste",
      description:
        "Every year, thousands of unopened, unexpired medicine strips are discarded. MEDISAVE provides a responsible channel to safely recirculate surplus medications to those in need.",
    },
    {
      icon: FileTextIcon,
      title: "Structured Indexing",
      description:
        "Every listing captures critical pharmaceutical details: active salt formulation, manufacturer, batch number, dosage form, and exact expiry date for complete clarity.",
    },
    {
      icon: ShieldCheckIcon,
      title: "Mandatory Quality Checks",
      description:
        "Only intact, sealed factory blister packs or unopened bottles with clearly legible manufacturer markings are eligible for listing on the platform.",
    },
    {
      icon: ClockIcon,
      title: "Active Expiry Buffer",
      description:
        "Medications near their expiration date are automatically excluded. Listings require an adequate safety window to ensure safe usage before expiry.",
    },
  ];

  return (
    <section className="bg-[#fafaf7] border-t border-b border-[#e4e2dd] py-14 sm:py-18">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-10 text-left">
          <div className="text-xs font-bold text-[#0f4c42] uppercase tracking-wider mb-1.5">
            Responsible Medicine Management
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">
            Why structured medicine recovery matters
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#525252] leading-relaxed">
            Bridging healthcare affordability and environmental responsibility through
            verified, safe, and transparent surplus medicine redistribution.
          </p>
        </div>

        {/* 4 Clean Value Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-[#e4e2dd] p-5 sm:p-6 flex flex-col justify-between hover:border-[#0f4c42] transition shadow-2xs text-left"
              >
                <div>
                  <div className="w-10 h-10 rounded-lg bg-[#e8f3f1] border border-[#c4ded9] text-[#0f4c42] flex items-center justify-center mb-4">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-[#171717] mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#525252] leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}