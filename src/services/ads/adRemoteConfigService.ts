import { Config } from '@/constants/config';

type RemoteAdsConfig = {
  adsEnabled?: boolean;
};

const fetchWithTimeout = async (
  input: string,
  timeoutMs: number
): Promise<unknown> => {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('remote-config-timeout')), timeoutMs);
  });

  return Promise.race([
    fetch(input, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    }),
    timeoutPromise,
  ]);
};

export const fetchRemoteAdsEnabled = async (): Promise<boolean | null> => {
  const url = Config.monetization.remoteConfig.url;
  if (!url) {
    return null;
  }

  try {
    const result = (await fetchWithTimeout(
      url,
      Config.monetization.remoteConfig.timeoutMs
    )) as {
      ok?: boolean;
      json?: () => Promise<unknown>;
    };

    if (!result || result.ok !== true || typeof result.json !== 'function') {
      return null;
    }

    const payload = (await result.json()) as RemoteAdsConfig;
    if (typeof payload.adsEnabled !== 'boolean') {
      return null;
    }

    return payload.adsEnabled;
  } catch {
    return null;
  }
};

