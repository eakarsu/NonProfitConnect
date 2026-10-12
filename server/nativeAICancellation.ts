import type { Request, Response } from 'express';

export function nativeAIRequest(request: Request, response: Response) {
  const controller = new AbortController();
  const abort = () => controller.abort();
  const close = () => { if (!response.writableEnded) abort(); };
  request.once('aborted', abort); response.once('close', close);
  return { signal: controller.signal, close: () => { request.off('aborted', abort); response.off('close', close); } };
}

export function nativeAIError(response: Response, signal: AbortSignal, error: any) {
  if (signal.aborted || response.destroyed) return;
  return response.status(error?.status || 502).json({ message: error?.message || 'AI provider request failed' });
}
