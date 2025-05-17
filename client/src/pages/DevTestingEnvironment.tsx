import { useState, useEffect } from 'react';
import { ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import Header from '@/components/Header';
import LeftPanel from '@/components/LeftPanel';
import TerminalPanel from '@/components/TerminalPanel';
import ConfigPanel from '@/components/ConfigPanel';
import StatusBar from '@/components/StatusBar';
import { TestCategory, Test, BackendType, TestResult, Environment } from '@/types';
import { testCategories } from '@/lib/mockData';
import useTestExecution from '@/hooks/useTestExecution';

export default function DevTestingEnvironment() {
  const [categories] = useState<TestCategory[]>(testCategories);
  const [selectedCategory, setSelectedCategory] = useState<TestCategory | null>(null);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [backend, setBackend] = useState<BackendType>('Cloudflare Worker');
  const [environment, setEnvironment] = useState<Environment>('Development');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  
  // Initialize with the first category and test
  useEffect(() => {
    if (categories.length > 0) {
      setSelectedCategory(categories[0]);
      
      if (categories[0].tests.length > 0) {
        setSelectedTest(categories[0].tests[0]);
      }
    }
  }, [categories]);

  const { executeTest, terminalLines, isExecuting, clearTerminal } = useTestExecution();

  const handleRunTest = async () => {
    if (!selectedTest) return;
    
    clearTerminal();
    
    const result = await executeTest(selectedTest, backend);
    setTestResult(result);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0E1525]">
      <Header 
        backend={backend} 
        setBackend={setBackend} 
        onRunTest={handleRunTest}
        isExecuting={isExecuting}
      />
      
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
          <LeftPanel 
            categories={categories}
            selectedCategory={selectedCategory}
            selectedTest={selectedTest}
            setSelectedCategory={setSelectedCategory}
            setSelectedTest={setSelectedTest}
            environment={environment}
            setEnvironment={setEnvironment}
          />
        </ResizablePanel>
        
        <ResizablePanel defaultSize={50} minSize={30}>
          <TerminalPanel 
            lines={terminalLines}
            onClear={clearTerminal}
          />
        </ResizablePanel>
        
        <ResizablePanel defaultSize={30} minSize={20} maxSize={40}>
          <ConfigPanel 
            selectedTest={selectedTest}
            setSelectedTest={setSelectedTest}
            backend={backend}
            setBackend={setBackend}
            onRunTest={handleRunTest}
            isExecuting={isExecuting}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      
      <StatusBar 
        backend={backend}
        testResult={testResult}
      />
    </div>
  );
}
