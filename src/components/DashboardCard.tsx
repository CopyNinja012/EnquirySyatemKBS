// src/components/DashboardCard.tsx
import React from "react";

interface DashboardCardProps {
  title: string;
  count: string | number;
  /** Tailwind classes for the button background, e.g. "bg-sky-500 hover:bg-sky-600" */
  buttonColor: string;
  buttonIconUrl: string;
  onClick: () => void;
}

const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  count,
  buttonColor,
  buttonIconUrl,
  onClick,
}) => {
  return (
    <div className="flex justify-between items-center bg-white w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-xs p-3 sm:p-4 md:p-5 rounded-lg shadow-sm border border-gray-100">
      <div className="flex flex-col items-start gap-1 sm:gap-1.5">
        <span className="text-[11px] sm:text-xs text-gray-500">{title}</span>
        <span className="text-xl sm:text-2xl font-bold text-gray-900">
          {count}
        </span>
      </div>

      <button
        type="button"
        className={`flex items-center justify-center ${buttonColor} w-10 h-10 sm:w-11 sm:h-11 rounded-full border-0 shadow-sm hover:shadow-md transition-all`}
        onClick={onClick}
        aria-label={title}
      >
        <img
          src={buttonIconUrl}
          alt={title}
          className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-contain"
        />
      </button>
    </div>
  );
};

export default DashboardCard;