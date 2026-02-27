import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Config } from '@/constants/config';
import {
  type AdPlacement,
  isMonetizationEnabledForPlatform,
} from '@/features/monetization/model/ads';
import { adService } from '@/services/ads/adService';
import { useAppStore } from '@/store/useAppStore';

type AdBannerProps = {
  placement: AdPlacement;
  style?: StyleProp<ViewStyle>;
};

export const AdBanner: React.FC<AdBannerProps> = ({ placement, style }) => {
  const remoteAdsEnabled = useAppStore(
    (state) => state.monetization.remoteAdsEnabled
  );
  const [loadFailed, setLoadFailed] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  const shouldRender = useMemo(() => {
    if (!Config.monetization.bannerEnabled) return false;
    return isMonetizationEnabledForPlatform({
      remoteAdsEnabled,
      platform: Platform.OS,
    });
  }, [remoteAdsEnabled]);

  useEffect(() => {
    if (!shouldRender) {
      setSdkReady(false);
      return;
    }
    let cancelled = false;
    void adService.initialize().then((initialized) => {
      if (!cancelled) {
        setSdkReady(initialized);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [shouldRender]);

  useEffect(() => {
    setLoadFailed(false);
  }, [placement, shouldRender]);

  if (!shouldRender || loadFailed || !sdkReady) {
    return null;
  }

  const bannerSpec = adService.getBannerSpec();
  if (!bannerSpec) return null;

  return (
    <View style={[styles.container, style]}>
      {React.createElement(bannerSpec.Component, {
        key: `${placement}-banner`,
        unitId: bannerSpec.unitId,
        size: bannerSpec.size,
        requestOptions: bannerSpec.requestOptions,
        onAdFailedToLoad: () => {
          setLoadFailed(true);
        },
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
