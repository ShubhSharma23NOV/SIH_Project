package com.Arogya_jal.app;

import android.app.Application;
import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.defaults.DefaultReactNativeHost;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import java.util.List;
import java.util.Arrays;

// Firebase imports
import io.invertase.firebase.app.ReactNativeFirebaseAppPackage;
import io.invertase.firebase.auth.ReactNativeFirebaseAuthPackage;
import io.invertase.firebase.firestore.ReactNativeFirebaseFirestorePackage;

// AsyncStorage import
import com.reactnativecommunity.asyncstorage.AsyncStoragePackage;

// SQLite Storage import
import org.pgsqlite.SQLitePluginPackage;

// NetInfo import
import com.reactnativecommunity.netinfo.NetInfoPackage;

// WebView import
import com.reactnativecommunity.webview.RNCWebViewPackage;

// Geolocation Service import
import com.agontuk.RNFusedLocation.RNFusedLocationPackage;

// Training Module imports
import com.rnfs.RNFSPackage;
import com.brentvatne.react.ReactVideoPackage;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost =
      new DefaultReactNativeHost(this) {
        @Override
        public boolean getUseDeveloperSupport() {
          return BuildConfig.DEBUG;
        }

        @Override
        protected List<ReactPackage> getPackages() {
          return Arrays.<ReactPackage>asList(
              new MainReactPackage(),
              new ReactNativeFirebaseAppPackage(),
              new ReactNativeFirebaseAuthPackage(),
              new ReactNativeFirebaseFirestorePackage(),
              new AsyncStoragePackage(),
              new SQLitePluginPackage(),
              new NetInfoPackage(),
              new RNCWebViewPackage(),
              new RNFusedLocationPackage(),
              new RNFSPackage(),
              new ReactVideoPackage()
          );
        }

        @Override
        protected String getJSMainModuleName() {
          return "index";
        }
      };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, false);
  }
}
