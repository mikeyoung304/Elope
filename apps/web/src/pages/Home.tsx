import { Container } from "../ui/Container";
import { CatalogGrid } from "../features/catalog/CatalogGrid";
import { Button } from "../ui/Button";

export function Home() {
  const scrollToPackages = () => {
    document.getElementById('packages')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-pink-50 py-20 md:py-32">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-pink-600 bg-clip-text text-transparent">
              Your Perfect Day, Simplified
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8 leading-relaxed">
              Intimate, stress-free weddings and elopements designed just for you.
              From simple ceremonies to luxury experiences, we handle every detail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                onClick={scrollToPackages}
                className="px-8 py-4 text-lg"
              >
                View Packages
              </Button>
              <a
                href="#about"
                className="px-8 py-4 text-lg text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Learn More
              </a>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
                <div className="text-gray-600">Happy Couples</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-pink-600 mb-2">24hr</div>
                <div className="text-gray-600">Quick Booking</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-600 mb-2">100%</div>
                <div className="text-gray-600">Satisfaction</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Packages Section */}
      <section id="packages" className="py-16 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Packages</h2>
            <p className="text-xl text-gray-600">
              Choose the perfect experience for your special day
            </p>
          </div>
          <CatalogGrid />
        </Container>
      </section>

      {/* About Section */}
      <section id="about" className="py-16 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-4xl font-bold mb-6">Why Choose Elope?</h2>
            <p className="text-lg text-gray-700 mb-8 leading-relaxed">
              We believe your wedding day should be about you—not stress, not excessive costs,
              not months of planning. Whether you're dreaming of an intimate courthouse ceremony
              or a luxurious destination celebration, we make it effortless.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left mt-12">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-2xl mb-3">✨</div>
                <h3 className="text-xl font-semibold mb-2">Curated Experiences</h3>
                <p className="text-gray-600">
                  Every package is thoughtfully designed with everything you need for a memorable day.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-2xl mb-3">⚡</div>
                <h3 className="text-xl font-semibold mb-2">Quick & Easy</h3>
                <p className="text-gray-600">
                  Book in minutes, not months. We handle the details so you can focus on each other.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-2xl mb-3">💝</div>
                <h3 className="text-xl font-semibold mb-2">All-Inclusive</h3>
                <p className="text-gray-600">
                  Photography, venues, officiants—everything you need in one transparent price.
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="text-2xl mb-3">🎯</div>
                <h3 className="text-xl font-semibold mb-2">Personalized</h3>
                <p className="text-gray-600">
                  Customize with add-ons like video, flowers, music, and more to make it uniquely yours.
                </p>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-white">
        <Container>
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">What Our Couples Say</h2>
            <p className="text-xl text-gray-600">
              Real stories from real couples who chose Elope
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="flex mb-4">
                <span className="text-yellow-400">★★★★★</span>
              </div>
              <p className="text-gray-700 mb-6 italic">
                "We wanted something simple and beautiful, and Elope delivered perfectly.
                The process was so easy, and our photographer captured moments we'll treasure forever."
              </p>
              <div className="font-semibold">Sarah & Michael</div>
              <div className="text-sm text-gray-600">Basic Elopement • June 2024</div>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="flex mb-4">
                <span className="text-yellow-400">★★★★★</span>
              </div>
              <p className="text-gray-700 mb-6 italic">
                "From booking to the ceremony, everything was seamless. We loved the garden venue,
                and the coordinator made sure every detail was perfect. Highly recommend!"
              </p>
              <div className="font-semibold">Emma & David</div>
              <div className="text-sm text-gray-600">Garden Romance • August 2024</div>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <div className="flex mb-4">
                <span className="text-yellow-400">★★★★★</span>
              </div>
              <p className="text-gray-700 mb-6 italic">
                "Best decision ever! We didn't want the stress of a big wedding. Elope made it
                stress-free and absolutely magical. Worth every penny."
              </p>
              <div className="font-semibold">Jessica & Ryan</div>
              <div className="text-sm text-gray-600">Luxury Escape • September 2024</div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
