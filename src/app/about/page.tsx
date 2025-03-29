import React from 'react';

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8 text-center">About Our Platform</h1>
      
      <div className="prose prose-invert max-w-none">
        <p className="text-lg mb-6">
          Welcome to our royalty-free music platform. We're passionate about providing high-quality music 
          for creators, filmmakers, game developers, and businesses of all sizes.
        </p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Our Mission</h2>
        <p className="mb-6">
          Our mission is to empower creative professionals with exceptional music that enhances their projects 
          without the complexity of traditional licensing. We believe that access to quality music should be 
          simple, affordable, and hassle-free.
        </p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">What Makes Us Different</h2>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>
            <strong className="text-accent">High-quality audio</strong> - All tracks are professionally produced and mastered.
          </li>
          <li>
            <strong className="text-accent">Simple licensing</strong> - One license covers all your needs, no hidden fees.
          </li>
          <li>
            <strong className="text-accent">Stem access</strong> - Customize tracks with individual audio components.
          </li>
          <li>
            <strong className="text-accent">Regular updates</strong> - New tracks added weekly across various genres.
          </li>
          <li>
            <strong className="text-accent">Instant previews</strong> - Our wavesurfer technology lets you instantly preview any part of a track.
          </li>
        </ul>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Our Licensing</h2>
        <p className="mb-6">
          Our standard license allows you to use our music in nearly any project, including:
        </p>
        <ul className="list-disc pl-6 mb-6 space-y-2">
          <li>YouTube videos and content</li>
          <li>Podcasts and streaming</li>
          <li>Social media content</li>
          <li>Websites and apps</li>
          <li>Corporate presentations</li>
          <li>Film and video production</li>
        </ul>
        <p className="mb-6">
          For more specific use cases or commercial applications, please refer to our detailed 
          <a href="/licensing" className="text-accent hover:underline"> licensing page</a>.
        </p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Our Team</h2>
        <p className="mb-6">
          We're a team of musicians, producers, and technology enthusiasts dedicated to making music 
          licensing accessible to everyone. Our collective experience spans music production, software 
          development, and creative industries.
        </p>
        
        <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
        <p className="mb-6">
          Have questions or feedback? We'd love to hear from you!<br />
          Email us at: <a href="mailto:contact@example.com" className="text-accent hover:underline">contact@example.com</a>
        </p>
      </div>
    </div>
  );
} 