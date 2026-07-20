import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../apiClient';
import type { AiCampaignGeneratePayload, AiCampaignGenerateResponse, AiGeneratedMenu, AiGenerationJob, AiMenuDraft, AiMenuGeneratePayload, AiMenuGenerateResponse, AiMenuImportResponse } from './types';

const AI_JOB_POLL_INTERVAL_MS = 1000;
const AI_JOB_TIMEOUT_MS = 90_000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForAiJob<Result>(jobPath: string) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < AI_JOB_TIMEOUT_MS) {
    const { data } = await apiClient.get<AiGenerationJob<Result>>(jobPath, { timeout: 10_000 });

    if (data.status === 'succeeded' && data.result) {
      return data.result;
    }

    if (data.status === 'failed') {
      throw new Error(data.error ?? 'AI generation failed.');
    }

    await sleep(AI_JOB_POLL_INTERVAL_MS);
  }

  throw new Error('AI generation timed out.');
}

export function useCreateMenuDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { prompt: string; currency?: string }) => {
      const { data } = await apiClient.post<AiMenuDraft>('/api/ai/menu-drafts', payload);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
    },
  });
}

export function useConfirmMenuDraft() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (draftId: string) => {
      const { data } = await apiClient.patch(`/api/ai/menu-drafts/${draftId}/confirm`, {});
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
      void queryClient.invalidateQueries({ queryKey: ['zenstack'] });
    },
  });
}

export function useGenerateAiMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AiMenuGeneratePayload) => {
      const { data: job } = await apiClient.post<AiGenerationJob<AiMenuGenerateResponse>>('/api/ai/menu/generate-jobs', payload);
      return waitForAiJob<AiMenuGenerateResponse>(`/api/ai/menu/generate-jobs/${job.id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
    },
  });
}

export function useImportAiMenu() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (menu: AiGeneratedMenu) => {
      const { data } = await apiClient.post<AiMenuImportResponse>('/api/ai/menu/import', { menu }, { timeout: 60_000 });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['products'] });
      void queryClient.invalidateQueries({ queryKey: ['products', 'active'] });
      void queryClient.invalidateQueries({ queryKey: ['zenstack'] });
    },
  });
}

export function useGenerateAiCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AiCampaignGeneratePayload) => {
      const { data: job } = await apiClient.post<AiGenerationJob<AiCampaignGenerateResponse>>('/api/ai/campaign/generate-jobs', payload);
      return waitForAiJob<AiCampaignGenerateResponse>(`/api/ai/campaign/generate-jobs/${job.id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['ai', 'menu-drafts'] });
    },
  });
}