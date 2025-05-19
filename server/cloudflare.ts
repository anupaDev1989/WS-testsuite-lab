import { Request, Response } from 'express';

const DISABLED_MSG = '@@@ *** cloudflare TS disabled...! *** @@@';

// Stubbed version of listWorkers
export async function listWorkers() {
  return {
    status: 'disabled',
    message: DISABLED_MSG,
  };
}

// Stubbed version of getWorkerDetails
export async function getWorkerDetails(scriptName: string) {
  return {
    status: 'disabled',
    message: `${DISABLED_MSG} (${scriptName})`,
  };
}

// Stubbed version of executeWorkerTest
export async function executeWorkerTest(
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body: any = null
) {
  return {
    status: 'disabled',
    message: `${DISABLED_MSG} (${method} ${url})`,
  };
}

// Stubbed version of checkWorkerStatus
export async function checkWorkerStatus() {
  return {
    status: 'disabled',
    message: DISABLED_MSG,
  };
}

// Stubbed middleware: workerStatusMiddleware
export function workerStatusMiddleware(req: Request, res: Response) {
  return res.json({
    status: 'disabled',
    message: DISABLED_MSG,
  });
}

// Stubbed middleware: workerTestMiddleware
export function workerTestMiddleware(req: Request, res: Response) {
  return res.json({
    status: 'disabled',
    message: DISABLED_MSG,
  });
}