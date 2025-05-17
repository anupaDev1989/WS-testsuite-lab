import { useState } from 'react';
import { Test, BackendType, Parameter, TestOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { PlayIcon, Save, Plus, Trash2, CloudCog } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { cn } from '@/lib/utils';

interface ConfigPanelProps {
  selectedTest: Test | null;
  setSelectedTest: (test: Test) => void;
  backend: BackendType;
  setBackend: (backend: BackendType) => void;
  onRunTest: () => void;
  isExecuting: boolean;
}

export default function ConfigPanel({ 
  selectedTest, 
  setSelectedTest, 
  backend, 
  setBackend, 
  onRunTest,
  isExecuting 
}: ConfigPanelProps) {
  const [activeTab, setActiveTab] = useState('request');

  if (!selectedTest) {
    return (
      <div className="h-full flex items-center justify-center bg-[#171D2D] border-l border-[#1C2333]">
        <div className="text-center text-gray-400">
          <p>No test selected</p>
          <p className="text-sm mt-2">Select a test from the left panel to configure it</p>
        </div>
      </div>
    );
  }

  const updateTestMethod = (method: string) => {
    if (selectedTest) {
      setSelectedTest({
        ...selectedTest,
        method: method as any
      });
    }
  };

  const updateTestUrl = (url: string) => {
    if (selectedTest) {
      setSelectedTest({
        ...selectedTest,
        url
      });
    }
  };

  const updateParameter = (index: number, key: string, value: string) => {
    if (selectedTest) {
      const updatedParams = [...selectedTest.parameters];
      updatedParams[index] = { key, value };
      
      setSelectedTest({
        ...selectedTest,
        parameters: updatedParams
      });
    }
  };

  const addParameter = () => {
    if (selectedTest) {
      setSelectedTest({
        ...selectedTest,
        parameters: [...selectedTest.parameters, { key: '', value: '' }]
      });
    }
  };

  const removeParameter = (index: number) => {
    if (selectedTest) {
      const updatedParams = [...selectedTest.parameters];
      updatedParams.splice(index, 1);
      
      setSelectedTest({
        ...selectedTest,
        parameters: updatedParams
      });
    }
  };

  const toggleTestOption = (optionId: string) => {
    if (selectedTest) {
      const updatedOptions = selectedTest.testOptions.map(option => 
        option.id === optionId ? { ...option, enabled: !option.enabled } : option
      );
      
      setSelectedTest({
        ...selectedTest,
        testOptions: updatedOptions
      });
    }
  };

  return (
    <div className="h-full bg-[#171D2D] border-l border-[#1C2333] flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-[#1C2333]">
        <div className="flex items-center">
          <span className="material-icons text-sm mr-2 text-gray-400">settings</span>
          <span className="text-sm font-medium">Test Configuration</span>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="bg-transparent border-b border-[#1C2333] w-full rounded-none">
          <TabsTrigger 
            value="request" 
            className={cn(
              "flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0098FF] data-[state=active]:shadow-none data-[state=active]:text-[#0098FF] text-sm",
              activeTab === 'request' ? 'bg-[#1C2333]' : ''
            )}
          >
            Request
          </TabsTrigger>
          <TabsTrigger 
            value="headers" 
            className={cn(
              "flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0098FF] data-[state=active]:shadow-none data-[state=active]:text-[#0098FF] text-sm",
              activeTab === 'headers' ? 'bg-[#1C2333]' : ''
            )}
          >
            Headers
          </TabsTrigger>
          <TabsTrigger 
            value="tests" 
            className={cn(
              "flex-1 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-[#0098FF] data-[state=active]:shadow-none data-[state=active]:text-[#0098FF] text-sm",
              activeTab === 'tests' ? 'bg-[#1C2333]' : ''
            )}
          >
            Tests
          </TabsTrigger>
        </TabsList>
        
        <div className="flex-1 overflow-y-auto">
          <TabsContent value="request" className="mt-0 p-4 h-full">
            {/* Request Method Selection */}
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-400 mb-2">Request Method</Label>
              <div className="flex rounded overflow-hidden">
                {(['GET', 'POST', 'PUT', 'DELETE'] as const).map(method => (
                  <Button
                    key={method}
                    type="button"
                    variant={selectedTest.method === method ? "default" : "outline"}
                    onClick={() => updateTestMethod(method)}
                    className={cn(
                      "flex-1 py-1 rounded-none",
                      selectedTest.method === method 
                        ? "bg-[#0098FF] hover:bg-[#0080DC] text-white border-0" 
                        : "bg-[#131A29] text-gray-300 hover:bg-[#1C2333] hover:text-white border-0"
                    )}
                  >
                    {method}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* URL Input */}
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-400 mb-2">URL</Label>
              <Input
                type="text"
                value={selectedTest.url}
                onChange={(e) => updateTestUrl(e.target.value)}
                className="w-full bg-[#131A29] text-white text-sm rounded px-3 py-2 border-0 focus-visible:ring-1 focus-visible:ring-[#0098FF]"
              />
            </div>
            
            {/* Backend Information */}
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-400 mb-2">Backend</Label>
              <div className="bg-[#131A29] rounded p-3 flex items-center">
                <span className="w-5 h-5 mr-2 flex items-center justify-center text-[#FF6B00]">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 5C17 5 14.6 7.4 13.5 7.4C12.4 7.4 11.1 5 8 5C5.1 5 2 7.4 2 11.7C2 16.1 6 21 12 21C18 21 22 16.1 22 11.7C22 7.4 20 5 20 5Z" />
                  </svg>
                </span>
                <span className="text-sm font-medium">Cloudflare Worker</span>
              </div>
            </div>
            
            {/* Parameters */}
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-400 mb-2">Parameters</Label>
              <div className="bg-[#131A29] rounded">
                <div className="flex p-2">
                  <div className="w-5/12 px-2 py-1 font-medium text-sm text-gray-400">Key</div>
                  <div className="w-5/12 px-2 py-1 font-medium text-sm text-gray-400">Value</div>
                  <div className="w-2/12"></div>
                </div>
                
                {selectedTest.parameters.map((param, index) => (
                  <div key={index} className="border-t border-[#1C2333]">
                    <div className="flex p-2 items-center">
                      <div className="w-5/12 px-1">
                        <Input
                          type="text"
                          value={param.key}
                          onChange={(e) => updateParameter(index, e.target.value, param.value)}
                          className="w-full bg-[#171D2D] text-white text-sm rounded px-2 py-1 border-0 focus-visible:ring-1 focus-visible:ring-[#0098FF]"
                        />
                      </div>
                      <div className="w-5/12 px-1">
                        <Input
                          type="text"
                          value={param.value}
                          onChange={(e) => updateParameter(index, param.key, e.target.value)}
                          className="w-full bg-[#171D2D] text-white text-sm rounded px-2 py-1 border-0 focus-visible:ring-1 focus-visible:ring-[#0098FF]"
                        />
                      </div>
                      <div className="w-2/12 flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParameter(index)}
                          className="text-gray-400 hover:text-white hover:bg-transparent"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="p-2 border-t border-[#1C2333]">
                  <Button
                    variant="ghost"
                    onClick={addParameter}
                    className="w-full flex items-center justify-center text-[#0098FF] text-sm py-1 rounded hover:bg-[#1C2333]"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add Parameter
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="headers" className="mt-0 p-4 h-full">
            <div className="bg-[#131A29] rounded p-4">
              <p className="text-sm text-gray-400">Common headers will be automatically added to your request.</p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Content-Type</span>
                  <span className="text-sm text-gray-400">application/json</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Accept</span>
                  <span className="text-sm text-gray-400">application/json</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">User-Agent</span>
                  <span className="text-sm text-gray-400">DevTestClient/1.0</span>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tests" className="mt-0 p-4 h-full">
            {/* Test Options */}
            <div className="mb-4">
              <Label className="block text-sm font-medium text-gray-400 mb-2">Test Options</Label>
              <div className="space-y-2">
                {selectedTest.testOptions.map((option) => (
                  <div 
                    key={option.id}
                    className="bg-[#131A29] p-2 rounded"
                  >
                    <div className="flex items-center">
                      <Checkbox 
                        id={`option-${option.id}`}
                        checked={option.enabled}
                        onCheckedChange={() => toggleTestOption(option.id)}
                        className="border-[#0098FF] data-[state=checked]:bg-[#0098FF] data-[state=checked]:text-white"
                      />
                      <Label 
                        htmlFor={`option-${option.id}`}
                        className={cn(
                          "ml-2 text-sm",
                          option.enabled ? "text-white" : "text-gray-400"
                        )}
                      >
                        {option.name}
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Action Buttons */}
      <div className="p-3 border-t border-[#1C2333]">
        <Button
          onClick={onRunTest}
          disabled={isExecuting}
          className="w-full bg-[#0098FF] hover:bg-[#0080DC] text-white py-2 rounded mb-2 flex items-center justify-center"
        >
          <PlayIcon className="h-4 w-4 mr-1" />
          Run Test
        </Button>
        <Button
          variant="outline"
          className="w-full bg-[#131A29] hover:bg-[#1C2333] text-white py-2 rounded flex items-center justify-center border-0"
        >
          <Save className="h-4 w-4 mr-1" />
          Save Configuration
        </Button>
      </div>
    </div>
  );
}
