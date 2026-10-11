package com.hisabkitab360.app;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final int PERMISSION_REQ_CODE = 1001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestNativeAppPermissions();

        // 100% Robust Android Hardware & Gesture Back Button Dispatcher
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            private long lastBackExitNoticeTime = 0;

            @Override
            public void handleOnBackPressed() {
                try {
                    if (getBridge() != null && getBridge().getWebView() != null) {
                        WebView webView = getBridge().getWebView();
                        webView.evaluateJavascript(
                            "(function() { " +
                            "  if (typeof window.__hkNativeBackDispatcher === 'function') { " +
                            "    return window.__hkNativeBackDispatcher(); " +
                            "  } " +
                            "  return false; " +
                            "})();",
                            value -> {
                                if ("true".equals(value) || Boolean.parseBoolean(value)) {
                                    return;
                                }
                                long now = System.currentTimeMillis();
                                if (now - lastBackExitNoticeTime < 2200) {
                                    finish();
                                } else {
                                    lastBackExitNoticeTime = now;
                                    webView.evaluateJavascript(
                                        "if (typeof window.__showHKToast === 'function') window.__showHKToast();",
                                        null
                                    );
                                }
                            }
                        );
                    } else {
                        finish();
                    }
                } catch (Exception e) {
                    finish();
                }
            }
        });
    }

    private void requestNativeAppPermissions() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            java.util.List<String> permList = new java.util.ArrayList<>();
            permList.add(Manifest.permission.CAMERA);
            permList.add(Manifest.permission.RECORD_AUDIO);
            permList.add(Manifest.permission.MODIFY_AUDIO_SETTINGS);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                permList.add(Manifest.permission.POST_NOTIFICATIONS);
            }

            java.util.List<String> needed = new java.util.ArrayList<>();
            for (String perm : permList) {
                if (ContextCompat.checkSelfPermission(this, perm) != PackageManager.PERMISSION_GRANTED) {
                    needed.add(perm);
                }
            }

            if (!needed.isEmpty()) {
                ActivityCompat.requestPermissions(this, needed.toArray(new String[0]), PERMISSION_REQ_CODE);
            }
        }
    }

    @Override
    public void onStart() {
        super.onStart();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
                webView.getSettings().setDomStorageEnabled(true);
                webView.getSettings().setDatabaseEnabled(true);
                webView.getSettings().setAllowFileAccess(true);
                webView.getSettings().setAllowContentAccess(true);
                webView.getSettings().setRenderPriority(android.webkit.WebSettings.RenderPriority.HIGH);
                webView.getSettings().setCacheMode(android.webkit.WebSettings.LOAD_DEFAULT);
                webView.setScrollBarStyle(WebView.SCROLLBARS_INSIDE_OVERLAY);
                // Hardware GPU compositor acceleration
                webView.setLayerType(android.view.View.LAYER_TYPE_HARDWARE, null);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
