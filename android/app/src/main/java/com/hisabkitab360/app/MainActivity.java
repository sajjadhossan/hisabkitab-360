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

                // Strip '; wv' and 'Version/X.X' to prevent Google OAuth 403 disallowed_useragent error
                String defaultUserAgent = webView.getSettings().getUserAgentString();
                if (defaultUserAgent != null) {
                    String cleanUserAgent = defaultUserAgent.replaceAll(";\\s*wv\\b", "").replaceAll("Version\\/[0-9.]+\\s*", "");
                    webView.getSettings().setUserAgentString(cleanUserAgent);
                }

                // 1. Android Native Print Bridge for Invoices, Prescriptions & Reports
                webView.addJavascriptInterface(new AndroidNativePrintBridge(), "AndroidPrintBridge");

                // 2. Android Native File Bridge for Downloads, Excel & Backups
                webView.addJavascriptInterface(new AndroidNativeFileBridge(), "AndroidFileBridge");

                // 3. Android WebView Download Listener Fallback
                webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                    try {
                        android.content.Intent i = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                        i.setData(android.net.Uri.parse(url));
                        startActivity(i);
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    // =========================================================================
    // 1. NATIVE ANDROID PRINT BRIDGE (Universal Direct Spooler for APK)
    // =========================================================================
    public class AndroidNativePrintBridge {
        @android.webkit.JavascriptInterface
        public void print() {
            runOnUiThread(() -> {
                try {
                    android.print.PrintManager printManager = (android.print.PrintManager) getSystemService(android.content.Context.PRINT_SERVICE);
                    if (printManager != null && getBridge() != null && getBridge().getWebView() != null) {
                        android.print.PrintDocumentAdapter printAdapter = getBridge().getWebView().createPrintDocumentAdapter("HisabKitab-360-Document");
                        printManager.print("HisabKitab 360", printAdapter, new android.print.PrintAttributes.Builder().build());
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }

        @android.webkit.JavascriptInterface
        public void printHtml(String htmlContent, String jobTitle) {
            runOnUiThread(() -> {
                try {
                    WebView tempWebView = new WebView(MainActivity.this);
                    tempWebView.getSettings().setJavaScriptEnabled(true);
                    tempWebView.setWebViewClient(new android.webkit.WebViewClient() {
                        @Override
                        public void onPageFinished(WebView view, String url) {
                            try {
                                android.print.PrintManager printManager = (android.print.PrintManager) getSystemService(android.content.Context.PRINT_SERVICE);
                                if (printManager != null) {
                                    String title = (jobTitle != null && !jobTitle.isEmpty()) ? jobTitle : "HisabKitab 360 Document";
                                    android.print.PrintDocumentAdapter printAdapter = view.createPrintDocumentAdapter(title);
                                    printManager.print(title, printAdapter, new android.print.PrintAttributes.Builder().build());
                                }
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        }
                    });
                    tempWebView.loadDataWithBaseURL("https://localhost", htmlContent, "text/html", "UTF-8", null);
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }

    // =========================================================================
    // 2. NATIVE ANDROID FILE DOWNLOAD & SHARE BRIDGE (Direct to Downloads Folder)
    // =========================================================================
    public class AndroidNativeFileBridge {
        @android.webkit.JavascriptInterface
        public void downloadBase64File(String base64Data, String mimeType, String filename) {
            runOnUiThread(() -> {
                try {
                    byte[] data = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
                    android.content.ContentValues values = new android.content.ContentValues();
                    values.put(android.provider.MediaStore.MediaColumns.DISPLAY_NAME, filename);
                    values.put(android.provider.MediaStore.MediaColumns.MIME_TYPE, (mimeType != null && !mimeType.isEmpty()) ? mimeType : "application/octet-stream");
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        values.put(android.provider.MediaStore.MediaColumns.RELATIVE_PATH, android.os.Environment.DIRECTORY_DOWNLOADS);
                    }
                    android.net.Uri uri = getContentResolver().insert(android.provider.MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                    if (uri != null) {
                        try (java.io.OutputStream os = getContentResolver().openOutputStream(uri)) {
                            if (os != null) {
                                os.write(data);
                                os.flush();
                            }
                        }
                        android.widget.Toast.makeText(MainActivity.this, "ফাইল ডাউনলোড সম্পন্ন: " + filename, android.widget.Toast.LENGTH_LONG).show();

                        // Trigger Android native share/open sheet
                        android.content.Intent shareIntent = new android.content.Intent(android.content.Intent.ACTION_SEND);
                        shareIntent.setType(mimeType);
                        shareIntent.putExtra(android.content.Intent.EXTRA_STREAM, uri);
                        shareIntent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        startActivity(android.content.Intent.createChooser(shareIntent, "ফাইল ওপেন বা শেয়ার করুন (" + filename + ")"));
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    android.widget.Toast.makeText(MainActivity.this, "ডাউনলোড ত্রুটি: " + e.getMessage(), android.widget.Toast.LENGTH_SHORT).show();
                }
            });
        }
    }
}
