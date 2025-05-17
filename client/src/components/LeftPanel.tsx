import { useState } from 'react';
import { TestCategory, Test, Environment } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ChevronDown, ChevronRight, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeftPanelProps {
  categories: TestCategory[];
  selectedCategory: TestCategory | null;
  selectedTest: Test | null;
  setSelectedCategory: (category: TestCategory) => void;
  setSelectedTest: (test: Test) => void;
  environment: Environment;
  setEnvironment: (environment: Environment) => void;
}

export default function LeftPanel({
  categories,
  selectedCategory,
  selectedTest,
  setSelectedCategory,
  setSelectedTest,
  environment,
  setEnvironment
}: LeftPanelProps) {
  const [searchValue, setSearchValue] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const handleCategoryClick = (category: TestCategory) => {
    setExpandedCategories({
      ...expandedCategories,
      [category.id]: !expandedCategories[category.id]
    });
    setSelectedCategory(category);
  };

  const handleTestClick = (test: Test) => {
    setSelectedTest(test);
  };

  // Filter categories and tests based on search
  const filteredCategories = categories.map(category => {
    const filteredTests = category.tests.filter(test => 
      test.name.toLowerCase().includes(searchValue.toLowerCase())
    );
    return {
      ...category,
      tests: filteredTests
    };
  }).filter(category => 
    category.tests.length > 0 || 
    category.name.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="w-full h-full bg-[#171D2D] border-r border-[#1C2333] flex flex-col">
      <div className="p-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="Search tests..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-[#131A29] text-white text-sm rounded pl-8 pr-4 py-2 border-0 focus-visible:ring-1 focus-visible:ring-[#0098FF]"
          />
          <Search className="absolute left-2 top-2.5 text-gray-500 h-4 w-4" />
        </div>
      </div>
      
      {/* Test Categories */}
      <div className="flex-1 overflow-y-auto px-2 py-1">
        {filteredCategories.map((category) => (
          <div key={category.id} className="mb-2">
            <div 
              className="flex items-center justify-between py-2 px-2 text-white hover:bg-[#1C2333] rounded cursor-pointer"
              onClick={() => handleCategoryClick(category)}
            >
              <div className="flex items-center">
                <span className="material-icons text-sm mr-2">{category.icon}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </div>
              {expandedCategories[category.id] || selectedCategory?.id === category.id ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
            
            {(expandedCategories[category.id] || selectedCategory?.id === category.id) && (
              <div className="ml-4 mt-1 space-y-1">
                {category.tests.map((test) => (
                  <div 
                    key={test.id}
                    className={cn(
                      "flex items-center py-1 px-2 rounded cursor-pointer",
                      selectedTest?.id === test.id 
                        ? "bg-[#1C2333] text-[#0098FF]" 
                        : "text-gray-300 hover:bg-[#1C2333]"
                    )}
                    onClick={() => handleTestClick(test)}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm">{test.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Environment Selection */}
      <div className="p-3 border-t border-[#1C2333]">
        <Select value={environment} onValueChange={(value) => setEnvironment(value as Environment)}>
          <SelectTrigger className="w-full bg-[#131A29] border-0 focus:ring-[#0098FF]">
            <SelectValue placeholder="Select environment" />
          </SelectTrigger>
          <SelectContent className="bg-[#131A29] border-[#1C2333]">
            <SelectItem value="Development">Development Environment</SelectItem>
            <SelectItem value="Testing">Testing Environment</SelectItem>
            <SelectItem value="Production">Production Environment</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
