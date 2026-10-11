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

                // 3. Android Native High-Accuracy Speech Recognition Bridge
                webView.addJavascriptInterface(new AndroidNativeSpeechBridge(), "AndroidSpeechBridge");

                // 4. Explicit Camera & Microphone WebRTC Permission Grant
                webView.setWebChromeClient(new com.getcapacitor.BridgeWebChromeClient(getBridge()) {
                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        runOnUiThread(() -> {
                            try {
                                request.grant(request.getResources());
                            } catch (Exception e) {
                                e.printStackTrace();
                            }
                        });
                    }
                });

                // 5. Android WebView Download Listener Fallback
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

    // =========================================================================
    // 3. NATIVE ANDROID HIGH-ACCURACY SPEECH RECOGNITION (Bangla/English Voice)
    // =========================================================================
    public class AndroidNativeSpeechBridge {
        private android.speech.SpeechRecognizer speechRecognizer;

        @android.webkit.JavascriptInterface
        public void startListening(String lang) {
            runOnUiThread(() -> {
                try {
                    if (!android.speech.SpeechRecognizer.isRecognitionAvailable(MainActivity.this)) {
                        notifySpeechError("ডিভাইসে ভয়েস রিকগনিশন উপলব্ধ নেই");
                        return;
                    }
                    if (speechRecognizer != null) {
                        try {
                            speechRecognizer.destroy();
                        } catch (Exception ignored) {}
                    }
                    speechRecognizer = android.speech.SpeechRecognizer.createSpeechRecognizer(MainActivity.this);
                    speechRecognizer.setRecognitionListener(new android.speech.RecognitionListener() {
                        @Override
                        public void onReadyForSpeech(android.os.Bundle params) {
                            notifySpeechStatus("ready");
                        }
                        @Override
                        public void onBeginningOfSpeech() {
                            notifySpeechStatus("listening");
                        }
                        @Override public void onRmsChanged(float rmsdB) {}
                        @Override public void onBufferReceived(byte[] buffer) {}
                        @Override
                        public void onEndOfSpeech() {
                            notifySpeechStatus("processing");
                        }
                        @Override
                        public void onError(int error) {
                            String errDesc = "ভয়েস শনাক্তকরণে সমস্যা (" + error + ")";
                            if (error == android.speech.SpeechRecognizer.ERROR_NO_MATCH) {
                                errDesc = "কোনো কথা শনাক্ত করা যায়নি";
                            } else if (error == android.speech.SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS) {
                                errDesc = "মাইক্রোফোন অনুমতি দিন";
                            } else if (error == android.speech.SpeechRecognizer.ERROR_SPEECH_TIMEOUT) {
                                errDesc = "কথা বলার সময় শেষ হয়েছে";
                            }
                            notifySpeechError(errDesc);
                        }
                        @Override
                        public void onResults(android.os.Bundle results) {
                            java.util.ArrayList<String> matches = results.getStringArrayList(android.speech.SpeechRecognizer.RESULTS_RECOGNITION);
                            if (matches != null && !matches.isEmpty()) {
                                notifySpeechResult(matches.get(0));
                            } else {
                                notifySpeechError("কোনো কথা শনাক্ত করা যায়নি");
                            }
                        }
                        @Override
                        public void onPartialResults(android.os.Bundle partialResults) {
                            java.util.ArrayList<String> matches = partialResults.getStringArrayList(android.speech.SpeechRecognizer.RESULTS_RECOGNITION);
                            if (matches != null && !matches.isEmpty()) {
                                notifySpeechPartial(matches.get(0));
                            }
                        }
                        @Override public void onEvent(int eventType, android.os.Bundle params) {}
                    });

                    android.content.Intent intent = new android.content.Intent(android.speech.RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_MODEL, android.speech.RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
                    String targetLang = (lang != null && !lang.isEmpty()) ? lang : "bn-BD";
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE, targetLang);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, targetLang);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
                    intent.putExtra(android.speech.RecognizerIntent.EXTRA_MAX_RESULTS, 3);
                    speechRecognizer.startListening(intent);
                } catch (Exception e) {
                    notifySpeechError(e.getMessage());
                }
            });
        }

        @android.webkit.JavascriptInterface
        public void stopListening() {
            runOnUiThread(() -> {
                try {
                    if (speechRecognizer != null) {
                        speechRecognizer.stopListening();
                    }
                } catch (Exception ignored) {}
            });
        }

        private void notifySpeechResult(String text) {
            if (getBridge() != null && getBridge().getWebView() != null) {
                String escaped = text.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
                getBridge().getWebView().evaluateJavascript(
                    "if (typeof window.__onNativeSpeechResult === 'function') window.__onNativeSpeechResult('" + escaped + "');",
                    null
                );
            }
        }

        private void notifySpeechPartial(String text) {
            if (getBridge() != null && getBridge().getWebView() != null) {
                String escaped = text.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
                getBridge().getWebView().evaluateJavascript(
                    "if (typeof window.__onNativeSpeechPartial === 'function') window.__onNativeSpeechPartial('" + escaped + "');",
                    null
                );
            }
        }

        private void notifySpeechError(String error) {
            if (getBridge() != null && getBridge().getWebView() != null) {
                String escaped = (error != null ? error : "Unknown error").replace("'", "\\'");
                getBridge().getWebView().evaluateJavascript(
                    "if (typeof window.__onNativeSpeechError === 'function') window.__onNativeSpeechError('" + escaped + "');",
                    null
                );
            }
        }

        private void notifySpeechStatus(String status) {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(
                    "if (typeof window.__onNativeSpeechStatus === 'function') window.__onNativeSpeechStatus('" + status + "');",
                    null
                );
            }
        }
    }
}
