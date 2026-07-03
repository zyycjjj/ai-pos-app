import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { getApiBaseUrl, LOCAL_API_BASE_URL, ONLINE_API_BASE_URL } from './api';

describe('API base URL configuration', () => {
  it('uses the local backend for web by default', () => {
    assert.equal(getApiBaseUrl('web', undefined), LOCAL_API_BASE_URL);
  });

  it('uses the online backend for native platforms by default', () => {
    assert.equal(getApiBaseUrl('android', undefined), ONLINE_API_BASE_URL);
    assert.equal(getApiBaseUrl('ios', undefined), ONLINE_API_BASE_URL);
  });

  it('uses a trimmed environment override on every platform', () => {
    const override = 'http://192.168.32.246:4100';

    assert.equal(getApiBaseUrl('web', `  ${override}  `), override);
    assert.equal(getApiBaseUrl('android', override), override);
  });

  it('ignores an empty environment override', () => {
    assert.equal(getApiBaseUrl('web', '   '), LOCAL_API_BASE_URL);
    assert.equal(getApiBaseUrl('android', ''), ONLINE_API_BASE_URL);
  });
});
