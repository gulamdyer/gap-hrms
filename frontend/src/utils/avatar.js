import { useState } from 'react';

// Avatar URL utility functions

// Convert backend avatar URL to frontend-accessible URL
export const getAvatarUrl = (avatarUrl) => {
  if (!avatarUrl) {
    return null;
  }
  
  // If it's already a relative URL, return as is
  if (avatarUrl.startsWith('/uploads/')) {
    return avatarUrl;
  }
  
  // If it's a full backend URL with localhost:5000, extract the path
  if (avatarUrl.includes('localhost:5000')) {
    // Extract the path part after the domain
    const urlParts = avatarUrl.split('/uploads/');
    if (urlParts.length > 1) {
      const relativePath = `/uploads/${urlParts[1]}`;
      return relativePath;
    }
  }
  
  // If it's already a relative path without leading slash, add it
  if (avatarUrl.startsWith('uploads/')) {
    const relativePath = `/${avatarUrl}`;
    return relativePath;
  }
  
  // If it contains /uploads/ but not localhost, it might be a different format
  if (avatarUrl.includes('/uploads/')) {
    const urlParts = avatarUrl.split('/uploads/');
    if (urlParts.length > 1) {
      const relativePath = `/uploads/${urlParts[1]}`;
      return relativePath;
    }
  }
  
  // Return the original URL if we can't parse it
  return avatarUrl;
};

// Get avatar display component with fallback
export const AvatarDisplay = ({ avatarUrl, name, size = 'md', className = '' }) => {
  const [imageError, setImageError] = useState(false);
  const processedUrl = getAvatarUrl(avatarUrl);
  
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
    '2xl': 'h-20 w-20',
    '3xl': 'h-24 w-24',
    '4xl': 'h-32 w-32'
  };
  
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  
  // Fallback avatar with initials
  const initials = name ? name.split(' ').map(n => n.charAt(0)).join('').toUpperCase() : '?';
  
  // If no URL or image failed to load, show fallback
  if (!processedUrl || imageError) {
    return (
      <div className={`${sizeClass} rounded-full bg-blue-100 flex items-center justify-center ${className}`}>
        <span className="text-blue-700 font-medium text-sm">
          {initials}
        </span>
      </div>
    );
  }
  
  // Show image with error handling
  return (
    <img
      className={`${sizeClass} rounded-full object-cover ${className}`}
      src={processedUrl}
      alt={name || 'Avatar'}
      onError={(e) => {
        console.log('❌ Image failed to load:', processedUrl);
        setImageError(true);
      }}
      onLoad={() => {
        console.log('✅ Image loaded successfully:', processedUrl);
      }}
    />
  );
}; 