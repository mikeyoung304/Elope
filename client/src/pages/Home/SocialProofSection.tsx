import { Container } from "@/ui/Container";

const stats = [
  { value: "50+", label: "Businesses", highlight: false },
  { value: "$2M+", label: "Revenue Managed", highlight: true },
  { value: "4.9", label: "Member Rating", highlight: false, showStar: true },
];

export function SocialProofSection() {
  return (
    <section id="social-proof" aria-labelledby="social-proof-heading" className="py-16 bg-gradient-to-r from-macon-navy via-macon-navy-light to-macon-navy border-y-4 border-macon-orange relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,107,53,0.08),transparent_70%)]"></div>

      <Container className="relative z-10">
        <div className="text-center">
          <h2 id="social-proof-heading" className="text-2xl text-white/90 mb-10 font-semibold">
            Join businesses already growing with Macon AI
          </h2>
          <div className="flex justify-center items-stretch gap-6 flex-wrap max-w-4xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className={`bg-white/10 backdrop-blur-md ${
                  stat.highlight ? 'border-2 border-macon-orange/40' : 'border-2 border-white/20'
                } px-10 py-6 rounded-2xl hover:bg-white/15 transition-all flex-1 min-w-[200px]`}
              >
                <div className="mb-1">
                  {stat.showStar ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="text-5xl font-extrabold text-white">{stat.value}</div>
                      <svg className="w-10 h-10 text-macon-orange fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                      </svg>
                    </div>
                  ) : stat.highlight ? (
                    <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-macon-orange to-macon-orange-light">
                      {stat.value}
                    </div>
                  ) : (
                    <div className="text-5xl font-extrabold text-white">{stat.value}</div>
                  )}
                </div>
                <div className="text-sm text-white/80 font-medium uppercase tracking-wide">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}