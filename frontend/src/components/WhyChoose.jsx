export default function WhyChoose() {
  const protocols = [
    {
      code: "REG-01",
      title: "Surplus Medicine Waste Reduction",
      description:
        "Households in Pune discard thousands of unexpired medicine strips annually into municipal waste. MEDISAVE establishes a digitally governed protocol to safely redistribute intact surplus packs to local residents in need.",
    },
    {
      code: "REG-02",
      title: "Mandatory Salt & Batch Indexing",
      description:
        "Every listing records the active chemical salt formulation, manufacturer license, physical dosage form, batch number, and printed expiry date for verified pharmaceutical identification.",
    },
    {
      code: "REG-03",
      title: "Physical Packaging Audit",
      description:
        "Only intact, hermetically sealed manufacturer blister strips or unopened bottles with fully legible markings are accepted. Cut strips, opened bottles, or damaged foils are strictly prohibited.",
    },
    {
      code: "REG-04",
      title: "Deterministic 90-Day Expiry Buffer",
      description:
        "Medicines with less than 90 days remaining shelf life are automatically rejected by the engine. Pricing is deterministically calculated between 40% and 65% below printed MRP.",
    },
  ];

  return (
    <section className="bg-[#f8f7f4] border-t-2 border-b-2 border-[#27272a] py-10 sm:py-14 text-left">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-8">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="stamp-box text-[10px]">OPERATIONAL PROTOCOLS</span>
            <span className="stamp-green text-[10px]">VERIFIED SAFETY CRITERIA</span>
          </div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#141416] font-heading tracking-tight">
            Community Pharmaceutical Safety Guidelines
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#4b4d52] leading-relaxed font-mono">
            Standard operating procedures governing medicine moderation, packaging standards, and deterministic pricing in Pune.
          </p>
        </div>

        {/* 4 Clean Value Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {protocols.map((item, index) => (
            <div
              key={index}
              className="bg-white border-2 border-[#27272a] p-4 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-[#d4d4d8] pb-2">
                  <span className="stamp-box text-[10px] text-[#166534] border-[#166534]">
                    {item.code}
                  </span>
                  <span className="text-[10px] font-mono text-[#71737c]">PUNE REGISTRY</span>
                </div>
                <h3 className="text-sm font-bold font-heading text-[#141416] leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-[#4b4d52] leading-relaxed font-sans">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}