import axios from 'axios';
import { Platform } from 'react-native';

import { getApiBaseUrl } from '@/config/api';

export const apiClient = axios.create({
  baseURL: getApiBaseUrl(Platform.OS),
  timeout: 12000,
});
