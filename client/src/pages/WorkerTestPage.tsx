import { WorkerTestDashboard } from '@/components/worker-test/WorkerTestDashboard';

export default function WorkerTestPage() {
  return (
    <div className="h-screen">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-2">Cloudflare Worker Test Console</h1>
          <p className="text-gray-400">
            Test your Cloudflare Worker endpoints and verify your connection to the deployed worker.
          </p>
        </div>
      </div>
      
      <WorkerTestDashboard />
    </div>
  );
}