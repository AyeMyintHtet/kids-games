import React from 'react';
import { Platform } from 'react-native';
import { Config } from '@/constants/config';

type AdMobLikeModule = {
  mobileAds: () => {
    initialize: () => Promise<unknown>;
    setRequestConfiguration: (config: Record<string, unknown>) => Promise<void>;
  };
  BannerAd: React.ComponentType<Record<string, unknown>>;
  BannerAdSize: Record<string, unknown>;
  InterstitialAd: {
    createForAdRequest: (
      adUnitId: string,
      options?: Record<string, unknown>
    ) => {
      load: () => void;
      show: () => Promise<void>;
      addAdEventListener: (
        eventType: string,
        listener: (...args: unknown[]) => void
      ) => () => void;
    };
  };
  AdEventType: Record<string, string>;
  MaxAdContentRating?: Record<string, string>;
};

type BannerSpec = {
  Component: React.ComponentType<Record<string, unknown>>;
  size: unknown;
  unitId: string;
  requestOptions: Record<string, unknown>;
};

let cachedSdk: AdMobLikeModule | null | undefined;
let initializedPromise: Promise<boolean> | null = null;

const loadAdMobSdk = (): AdMobLikeModule | null => {
  if (cachedSdk !== undefined) {
    return cachedSdk;
  }

  try {
    // Optional runtime dependency. `eval('require')` keeps Metro from
    // eagerly resolving this module when it is not installed yet.
    const runtimeRequire = eval('require') as (moduleName: string) => unknown;
    const mod = runtimeRequire('react-native-google-mobile-ads') as AdMobLikeModule;
    cachedSdk = mod;
    return mod;
  } catch {
    cachedSdk = null;
    return null;
  }
};

const resolveMaxAdContentRating = (sdk: AdMobLikeModule): string => {
  const configuredRating = Config.monetization.compliance.maxAdContentRating;
  const ratingFromSdk = sdk.MaxAdContentRating?.[configuredRating];
  return typeof ratingFromSdk === 'string' ? ratingFromSdk : configuredRating;
};

const buildRequestOptions = (): Record<string, unknown> => ({
  requestNonPersonalizedAdsOnly: Config.monetization.compliance.nonPersonalizedAdsOnly,
});

const getBannerUnitId = (): string => Config.monetization.adUnitIds.androidBanner;
const getInterstitialUnitId = (): string => Config.monetization.adUnitIds.androidInterstitial;

class AdService {
  async initialize(): Promise<boolean> {
    if (initializedPromise) return initializedPromise;

    initializedPromise = (async () => {
      if (Platform.OS !== 'android') return false;
      const sdk = loadAdMobSdk();
      if (!sdk) return false;

      try {
        await sdk.mobileAds().setRequestConfiguration({
          tagForChildDirectedTreatment:
            Config.monetization.compliance.childDirectedTreatment,
          tagForUnderAgeOfConsent:
            Config.monetization.compliance.underAgeOfConsent,
          maxAdContentRating: resolveMaxAdContentRating(sdk),
        });
        await sdk.mobileAds().initialize();
        return true;
      } catch {
        return false;
      }
    })();

    const initialized = await initializedPromise;
    if (!initialized) {
      initializedPromise = null;
    }
    return initialized;
  }

  getBannerSpec(): BannerSpec | null {
    if (Platform.OS !== 'android') return null;
    const sdk = loadAdMobSdk();
    if (!sdk) return null;

    const bannerSize =
      sdk.BannerAdSize?.ANCHORED_ADAPTIVE_BANNER ??
      sdk.BannerAdSize?.BANNER ??
      'BANNER';

    return {
      Component: sdk.BannerAd,
      size: bannerSize,
      unitId: getBannerUnitId(),
      requestOptions: buildRequestOptions(),
    };
  }

  async showInterstitial(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    const sdk = loadAdMobSdk();
    if (!sdk) return false;

    const initialized = await this.initialize();
    if (!initialized) return false;

    const ad = sdk.InterstitialAd.createForAdRequest(
      getInterstitialUnitId(),
      buildRequestOptions()
    );
    const eventTypeLoaded = sdk.AdEventType?.LOADED ?? 'loaded';
    const eventTypeClosed = sdk.AdEventType?.CLOSED ?? 'closed';
    const eventTypeError = sdk.AdEventType?.ERROR ?? 'error';

    return new Promise((resolve) => {
      let settled = false;
      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
      let unsubscribeLoaded: (() => void) | null = null;
      let unsubscribeClosed: (() => void) | null = null;
      let unsubscribeError: (() => void) | null = null;

      const cleanup = () => {
        if (timeoutHandle) {
          clearTimeout(timeoutHandle);
          timeoutHandle = null;
        }
        unsubscribeLoaded?.();
        unsubscribeClosed?.();
        unsubscribeError?.();
      };

      const settle = (shown: boolean) => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve(shown);
      };

      unsubscribeLoaded = ad.addAdEventListener(eventTypeLoaded, () => {
        ad.show().catch(() => {
          settle(false);
        });
      });

      unsubscribeClosed = ad.addAdEventListener(eventTypeClosed, () => {
        settle(true);
      });

      unsubscribeError = ad.addAdEventListener(eventTypeError, () => {
        settle(false);
      });

      timeoutHandle = setTimeout(() => {
        settle(false);
      }, 12_000);

      try {
        ad.load();
      } catch {
        settle(false);
      }
    });
  }
}

export const adService = new AdService();
