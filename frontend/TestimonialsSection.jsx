import React from 'react';

/**
 * Shewwina Testimonials Section Component
 * 
 * Aesthetic Influence: Stripe & Linear Premium SaaS Testimonial Cards
 * Features 3 Customer Testimonials with Profile Images, Star Ratings, Verified Badges & Impact Metrics.
 */
export default function TestimonialsSection() {
  const testimonials = [
    {
      id: 'ananya',
      name: 'Ananya Sharma',
      role: 'Founder, Luxe Hair & Spa',
      location: 'Mumbai • 4 Chairs',
      avatar: './avatar1.jpg',
      metric: '+35% REPEAT BOOKINGS',
      badgeColor: 'text-blue-600 bg-blue-50 border-blue-100',
      hoverBorder: 'hover:border-blue-500/50 hover:shadow-blue-500/10',
      textColor: 'group-hover:text-blue-600',
      review: 'Shewwina completely eliminated our Saturday afternoon waiting room chaos. Our clients now join the queue from home or nearby coffee shops. We saw a 35% increase in repeat bookings within 60 days!'
    },
    {
      id: 'vikram',
      name: 'Dr. Vikram Mehta',
      role: 'Medical Director, Apex Health',
      location: 'Bengaluru • OPD & Dental',
      avatar: './avatar2.jpg',
      metric: '0 LOBBY COMPLAINTS',
      badgeColor: 'text-purple-600 bg-purple-50 border-purple-100',
      hoverBorder: 'hover:border-purple-500/50 hover:shadow-purple-500/10',
      textColor: 'group-hover:text-purple-600',
      review: 'Before Shewwina, our clinic reception was overwhelmed with patients asking "How much longer?". Now, automated WhatsApp updates handle 100% of patient notifications. It has transformed our staff\'s workday.'
    },
    {
      id: 'rohan',
      name: 'Rohan Kapoor',
      role: 'Operations Head, Artisan Bistro',
      location: 'Delhi NCR • Hospitality',
      avatar: './avatar3.jpg',
      metric: '+28% WALK-IN RETENTION',
      badgeColor: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      hoverBorder: 'hover:border-emerald-500/50 hover:shadow-emerald-500/10',
      textColor: 'group-hover:text-emerald-600',
      review: 'We replaced our expensive hardware buzzer pagers with Shewwina\'s QR waitlist. Walk-in retention went up by 28% because diners don\'t mind waiting when they have live SMS tracking on their phones.'
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-slate-50/60 border-t border-b border-slate-200/80 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Loved by 1,000+ Business Owners
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            What Our Partners Say About <br className="hidden sm:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
              Shewwina OS
            </span>
          </h2>

          <p className="mt-4 text-base sm:text-xl text-slate-600 leading-relaxed">
            See how leading salons, clinics, and hospitality venues transformed their customer wait times and staff efficiency.
          </p>
        </div>

        {/* 3 Testimonial Cards Grid */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-8">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className={`p-8 rounded-3xl bg-white border border-slate-200/90 ${item.hoverBorder} shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  {/* 5 Stars */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>

                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${item.badgeColor}`}>
                    {item.metric}
                  </span>
                </div>

                <p className="text-slate-700 text-sm sm:text-base leading-relaxed italic relative z-10">
                  &ldquo;{item.review}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-4">
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-13 h-13 rounded-full object-cover border-2 border-slate-200 shadow-md shrink-0"
                />
                <div>
                  <h4 className={`text-base font-bold text-slate-900 ${item.textColor} transition-colors flex items-center gap-1.5`}>
                    {item.name}
                    <svg className="w-4 h-4 text-blue-500 inline-block" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                    </svg>
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">{item.role}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{item.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
