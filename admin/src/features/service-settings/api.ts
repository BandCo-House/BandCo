import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiGet, apiPatch } from '@/shared/api/client';

import type { ServiceSettings, UpdateServiceSettingsRequest } from './types';

// 계약상 제약
export const MAINTENANCE_MESSAGE_MAX_LENGTH = 500;
export const APP_VERSION_PATTERN = /^\d+\.\d+\.\d+$/;

export const serviceSettingsKeys = {
  all: ['service-settings'] as const,
};

export const getServiceSettings = () =>
  apiGet<ServiceSettings>('/admin/service-settings');

export const updateServiceSettings = (body: UpdateServiceSettingsRequest) =>
  apiPatch<ServiceSettings>('/admin/service-settings', body);

export const useServiceSettings = () =>
  useQuery({
    queryKey: serviceSettingsKeys.all,
    queryFn: getServiceSettings,
  });

export const useUpdateServiceSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateServiceSettings,
    onSuccess: (settings) =>
      queryClient.setQueryData(serviceSettingsKeys.all, settings),
  });
};
