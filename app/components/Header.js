'use client';
import Image from "next/image";
import useRealtimeClock from '../hooks/useRealtimeClock';

export default function Header() {
  const currentDateTime = useRealtimeClock();
  
  return (
    <header className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Image
          src="calgary-zoo-vector-logo.svg" 
          alt="Calgary Zoo"
          width={100} 
          height={100}
          className="mr-2"
        />
        <div className="flex items-center">
          <div className="mr-6 text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {currentDateTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currentDateTime.toLocaleTimeString('en-US')}
            </p>
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-300">Admin Panel</span>
        </div>
      </div>
    </header>
  );
}