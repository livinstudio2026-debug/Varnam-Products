import React from 'react';

const EmptyState = ({ title, message, actionText, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-neutral-200 bg-white rounded-2xl shadow-sm max-w-lg mx-auto my-12">
      {/* Organic Leaf Vector/Icon placeholder */}
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#FDF6EC] text-2xl mb-4">
        🌿
      </div>
      
      <h3 className="font-serif text-xl font-bold text-neutral-800">
        {title || 'No Elements Found'}
      </h3>
      
      <p className="mt-2 text-sm text-neutral-500 max-w-sm leading-relaxed">
        {message || 'We could not pinpoint any matching options in our catalog ecosystem right now.'}
      </p>

      {actionText && onAction && (
        <button
          onClick={onAction}
          className="mt-6 rounded-xl bg-[#2D6A4F] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-[#22513B] active:scale-95"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;