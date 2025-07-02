import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Camera, 
  Upload, 
  Share2, 
  Zap, 
  Shield, 
  Globe,
  ArrowRight,
  Play,
  Star,
  Users,
  Image,
  Video
} from 'lucide-react';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: Upload,
      title: 'High-Quality Uploads',
      description: 'Upload your photos and videos in their original quality without compression.'
    },
    {
      icon: Share2,
      title: 'Easy Sharing',
      description: 'Generate secure share links for friends and family with customizable permissions.'
    },
    {
      icon: Zap,
      title: 'AI Enhancement',
      description: 'Automatically enhance your images with AI-powered tools and filters.'
    },
    {
      icon: Shield,
      title: 'Secure Storage',
      description: 'Your memories are safely stored with enterprise-grade security.'
    },
    {
      icon: Globe,
      title: 'Global Access',
      description: 'Access your media from anywhere, on any device, anytime.'
    },
    {
      icon: Camera,
      title: 'Smart Organization',
      description: 'AI-powered tagging and organization to keep your media organized.'
    }
  ];

  const stats = [
    { label: 'Photos Shared', value: '10M+', icon: Image },
    { label: 'Videos Uploaded', value: '2M+', icon: Video },
    { label: 'Happy Users', value: '500K+', icon: Users },
    { label: 'Countries', value: '150+', icon: Globe }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Share Your Memories in
              <span className="block text-yellow-300">Crystal Clear Quality</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
              Don't let WhatsApp compress your vacation photos into pixelated mush. 
              Share stunning photos and videos in their full, glorious original quality.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {user ? (
                <Link
                  to="/upload"
                  className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  Start Uploading
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                  <Link
                    to="/login"
                    className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors duration-200 flex items-center justify-center"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
        
        {/* Floating elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <Camera className="h-16 w-16" />
        </div>
        <div className="absolute bottom-20 right-10 opacity-20">
          <Image className="h-16 w-16" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose PicStream AI?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We've built the perfect platform for sharing your precious memories 
              with the people who matter most.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                  <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-lg mb-6">
                    <Icon className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Share Your Memories?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who trust PicStream AI for their precious photos and videos.
          </p>
          {user ? (
            <Link
              to="/upload"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 inline-flex items-center"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Your First Photo
            </Link>
          ) : (
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors duration-200 inline-flex items-center"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          )}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              What Our Users Say
            </h2>
            <p className="text-xl text-gray-600">
              Don't just take our word for it - hear from our community.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "Travel Photographer",
                content: "PicStream AI has revolutionized how I share my travel photos. No more compression, just pure quality!",
                rating: 5
              },
              {
                name: "Mike Chen",
                role: "Family Man",
                content: "Finally, a way to share family videos without losing quality. My parents can see every detail clearly.",
                rating: 5
              },
              {
                name: "Emma Davis",
                role: "Wedding Photographer",
                content: "The AI enhancement features are incredible. My clients love the professional touch it adds to their photos.",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div key={index} className="bg-gray-50 p-8 rounded-lg">
                <div className="flex mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 italic">
                  "{testimonial.content}"
                </p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 