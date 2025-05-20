import { useState } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fallbackSrc?: string;
}

const OptimizedImage = ({ 
  src, 
  alt, 
  className, 
  width, 
  height,
  fallbackSrc = '/placeholder.svg' 
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  return (
    <div className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300 overflow-hidden`}>
      <img
        src={hasError ? fallbackSrc : src}
        alt={alt}
        loading="lazy"
        width={width}
        height={height}
        className={`${className || ''} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(true);
        }}
      />
    </div>
  );
};

export default OptimizedImage;