import React from 'react';

interface InfoSectionProps {
  // Define any props you might need for this section in the future
}

const InfoSection: React.FC<InfoSectionProps> = (props) => {
  return (
    <div className="flex-1 bg-gray-750 rounded-md p-3 text-sm text-gray-300">
      <h3 className="text-lg font-semibold text-white mb-2 border-b border-gray-600 pb-1">INFO</h3>
      <p>This section will display relevant information.</p>
      {/* You can add more placeholder content or structure here */}
    </div>
  );
};

export default InfoSection;
