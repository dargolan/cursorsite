import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] py-6 px-8 border-t border-[#333]">
      <div className="flex justify-between items-center">
        <div className="text-[#999999] text-sm">
          © {new Date().getFullYear()} Cursor Beats. All rights reserved.
        </div>
        <div className="flex space-x-6">
          <a href="#" className="text-[#999999] hover:text-[#1DF7CE] text-sm transition-colors">Terms</a>
          <a href="#" className="text-[#999999] hover:text-[#1DF7CE] text-sm transition-colors">Privacy</a>
          <a href="#" className="text-[#999999] hover:text-[#1DF7CE] text-sm transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
} 