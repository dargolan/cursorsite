import React from 'react';

export default function Footer() {
  return (
    <footer className="py-6 px-8">
      <div className="flex justify-end items-center">
        <div className="flex space-x-6">
          <a href="#" className="text-[#999999] hover:text-[#1DF7CE] text-sm transition-colors">Terms</a>
          <a href="#" className="text-[#999999] hover:text-[#1DF7CE] text-sm transition-colors">Privacy</a>
          <a href="#" className="text-[#999999] hover:text-[#1DF7CE] text-sm transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
} 