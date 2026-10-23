package com.hisabkitab360.app;

/**
 * HisabKitab 360 - Android Native Bridge & Host Controller
 */
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
    private static final int FILE_CHOOSER_REQ_CODE = 2001;
    private android.webkit.ValueCallback<android.net.Uri[]> mUploadCallback;
    private boolean bridgesConfigured = false;

    @Override
    protected void onActivityResult(int requestCode, int resultCode, android.content.Intent intent) {
        super.onActivityResult(requestCode, resultCode, intent);
        if (requestCode == FILE_CHOOSER_REQ_CODE) {
            if (mUploadCallback != null) {
                android.net.Uri[] results = null;
                if (resultCode == android.app.Activity.RESULT_OK && intent != null) {
                    if (intent.getData() != null) {
                        results = new android.net.Uri[]{intent.getData()};
                    } else if (intent.getClipData() != null) {
                        int count = intent.getClipData().getItemCount();
                        results = new android.net.Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = intent.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                mUploadCallback.onReceiveValue(results);
                mUploadCallback = null;
            }
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            WebView.setWebContentsDebuggingEnabled(true);
        }
        super.onCreate(savedInstanceState);
        setupWebViewAndBridges();

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

    @Override
    public void onStart() {
        super.onStart();
        setupWebViewAndBridges();
    }

    private synchronized void setupWebViewAndBridges() {
        if (bridgesConfigured) return;
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.getSettings().setDomStorageEnabled(true);
                webView.getSettings().setDatabaseEnabled(true);
                webView.getSettings().setAllowFileAccess(true);
                webView.getSettings().setAllowContentAccess(true);
                webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
                webView.getSettings().setGeolocationEnabled(true);
                webView.getSettings().setGeolocationDatabasePath(getFilesDir().getPath());

                // Auto-grant Web Geolocation and Permission requests inside APK & Native File/Logo Chooser
                webView.setWebChromeClient(new WebChromeClient() {
                    @Override
                    public void onGeolocationPermissionsShowPrompt(String origin, android.webkit.GeolocationPermissions.Callback callback) {
                        callback.invoke(origin, true, false);
                    }

                    @Override
                    public void onPermissionRequest(final PermissionRequest request) {
                        request.grant(request.getResources());
                    }

                    @Override
                    public boolean onShowFileChooser(WebView webView, android.webkit.ValueCallback<android.net.Uri[]> filePathCallback, WebChromeClient.FileChooserParams fileChooserParams) {
                        if (mUploadCallback != null) {
                            mUploadCallback.onReceiveValue(null);
                        }
                        mUploadCallback = filePathCallback;

                        android.content.Intent intent = fileChooserParams.createIntent();
                        try {
                            startActivityForResult(intent, FILE_CHOOSER_REQ_CODE);
                        } catch (android.content.ActivityNotFoundException e) {
                            mUploadCallback = null;
                            return false;
                        }
                        return true;
                    }
                });

                // 1. Android Native Print Bridge for Invoices, Prescriptions & Reports
                webView.addJavascriptInterface(new AndroidNativePrintBridge(), "AndroidPrintBridge");

                // 2. Android Native File Bridge for Downloads, Excel & Backups
                webView.addJavascriptInterface(new AndroidNativeFileBridge(), "AndroidNativeFileBridge");
                webView.addJavascriptInterface(new AndroidNativeFileBridge(), "AndroidFileBridge");

                // 3. Android Native High-Accuracy Speech Recognition Bridge
                webView.addJavascriptInterface(new AndroidNativeSpeechBridge(), "AndroidSpeechBridge");

                // 4. Android Native Direct Bluetooth Thermal Receipt Printer Bridge
                webView.addJavascriptInterface(new AndroidNativeBluetoothBridge(), "AndroidBtPrinterBridge");

                // 5. Android Native High-Priority Notification Bridge
                webView.addJavascriptInterface(new AndroidNativeNotificationBridge(), "AndroidNotificationBridge");

                // 6. Android Native On-Demand Permission Bridge
                webView.addJavascriptInterface(new AndroidNativePermissionBridge(), "AndroidPermissionBridge");

                // 7. Android Native GPS Geofencing Location Bridge (5-10m Strict)
                webView.addJavascriptInterface(new AndroidNativeLocationBridge(), "AndroidLocationBridge");

                // 8. Android WebView Download Listener Fallback
                webView.setDownloadListener((url, userAgent, contentDisposition, mimetype, contentLength) -> {
                    try {
                        android.content.Intent i = new android.content.Intent(android.content.Intent.ACTION_VIEW);
                        i.setData(android.net.Uri.parse(url));
                        startActivity(i);
                    } catch (Exception ex) {
                        ex.printStackTrace();
                    }
                });

                bridgesConfigured = true;
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
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
                            ActivityCompat.requestPermissions(MainActivity.this, new String[]{Manifest.permission.RECORD_AUDIO}, 1002);
                            notifySpeechError("মাইক্রোফোন অনুমতি দিন");
                            return;
                        }
                    }
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

    // =========================================================================
    // 4. NATIVE ANDROID BLUETOOTH THERMAL PRINTER BRIDGE (Direct ESC/POS Socket)
    // =========================================================================
    public class AndroidNativeBluetoothBridge {
        private static final java.util.UUID SPP_UUID = java.util.UUID.fromString("00001101-0000-1000-8000-00805F9B34FB");

        @android.webkit.JavascriptInterface
        public String getPairedDevices() {
            try {
                android.bluetooth.BluetoothAdapter adapter = android.bluetooth.BluetoothAdapter.getDefaultAdapter();
                if (adapter == null || !adapter.isEnabled()) return "[]";
                java.util.Set<android.bluetooth.BluetoothDevice> bonded = adapter.getBondedDevices();
                org.json.JSONArray array = new org.json.JSONArray();
                for (android.bluetooth.BluetoothDevice dev : bonded) {
                    org.json.JSONObject obj = new org.json.JSONObject();
                    obj.put("name", dev.getName() != null ? dev.getName() : "Bluetooth Printer");
                    obj.put("address", dev.getAddress());
                    array.put(obj);
                }
                return array.toString();
            } catch (Exception e) {
                return "[]";
            }
        }

        @android.webkit.JavascriptInterface
        public boolean isBluetoothEnabled() {
            try {
                android.bluetooth.BluetoothAdapter adapter = android.bluetooth.BluetoothAdapter.getDefaultAdapter();
                return adapter != null && adapter.isEnabled();
            } catch (Exception e) {
                return false;
            }
        }

        @android.webkit.JavascriptInterface
        public boolean printRawBase64(String address, String base64Data) {
            try {
                android.bluetooth.BluetoothAdapter adapter = android.bluetooth.BluetoothAdapter.getDefaultAdapter();
                if (adapter == null || !adapter.isEnabled() || address == null || address.isEmpty()) return false;
                android.bluetooth.BluetoothDevice device = adapter.getRemoteDevice(address);
                if (device == null) return false;

                byte[] bytes = android.util.Base64.decode(base64Data, android.util.Base64.DEFAULT);
                android.bluetooth.BluetoothSocket socket = device.createRfcommSocketToServiceRecord(SPP_UUID);
                socket.connect();
                java.io.OutputStream os = socket.getOutputStream();
                os.write(bytes);
                os.flush();
                Thread.sleep(180);
                socket.close();
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }
    }

    // =========================================================================
    // 5. NATIVE ANDROID SYSTEM NOTIFICATION BRIDGE (Low-Stock & Reminders)
    // =========================================================================
    public class AndroidNativeNotificationBridge {
        private static final String CHANNEL_ID = "hisabkitab_notifications";

        public AndroidNativeNotificationBridge() {
            createNotificationChannel();
        }

        private void createNotificationChannel() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                android.app.NotificationChannel channel = new android.app.NotificationChannel(
                    CHANNEL_ID,
                    "HisabKitab 360 Notifications",
                    android.app.NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Low stock alerts, daily closing, and due reminders");
                channel.enableVibration(true);
                android.app.NotificationManager manager = getSystemService(android.app.NotificationManager.class);
                if (manager != null) {
                    manager.createNotificationChannel(channel);
                }
            }
        }

        @android.webkit.JavascriptInterface
        public boolean showNotification(String title, String body, String tag) {
            try {
                android.content.Intent intent = new android.content.Intent(MainActivity.this, MainActivity.class);
                intent.setFlags(android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP | android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP);
                android.app.PendingIntent pendingIntent = android.app.PendingIntent.getActivity(
                    MainActivity.this, 0, intent,
                    android.app.PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M ? android.app.PendingIntent.FLAG_IMMUTABLE : 0)
                );

                androidx.core.app.NotificationCompat.Builder builder = new androidx.core.app.NotificationCompat.Builder(MainActivity.this, CHANNEL_ID)
                    .setSmallIcon(R.mipmap.ic_launcher)
                    .setContentTitle(title)
                    .setContentText(body)
                    .setStyle(new androidx.core.app.NotificationCompat.BigTextStyle().bigText(body))
                    .setPriority(androidx.core.app.NotificationCompat.PRIORITY_HIGH)
                    .setAutoCancel(true)
                    .setContentIntent(pendingIntent);

                androidx.core.app.NotificationManagerCompat notificationManager = androidx.core.app.NotificationManagerCompat.from(MainActivity.this);
                int notifId = (tag != null ? tag.hashCode() : (int) System.currentTimeMillis());
                notificationManager.notify(notifId, builder.build());
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }
    }

    // =========================================================================
    // 6. NATIVE ANDROID ON-DEMAND PERMISSION BRIDGE
    // =========================================================================
    public class AndroidNativePermissionBridge {
        @android.webkit.JavascriptInterface
        public boolean hasPermission(String permName) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
            String androidPerm = resolvePermission(permName);
            if (androidPerm == null) return true;
            return ContextCompat.checkSelfPermission(MainActivity.this, androidPerm) == PackageManager.PERMISSION_GRANTED;
        }

        @android.webkit.JavascriptInterface
        public void requestPermission(String permName) {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
            String androidPerm = resolvePermission(permName);
            if (androidPerm != null && ContextCompat.checkSelfPermission(MainActivity.this, androidPerm) != PackageManager.PERMISSION_GRANTED) {
                runOnUiThread(() -> {
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{androidPerm}, PERMISSION_REQ_CODE);
                });
            }
        }

        @android.webkit.JavascriptInterface
        public void requestLocationPermissions() {
            if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return;
            runOnUiThread(() -> {
                ActivityCompat.requestPermissions(MainActivity.this, new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                }, PERMISSION_REQ_CODE);
            });
        }

        private String resolvePermission(String permName) {
            if (permName == null) return null;
            switch (permName.toLowerCase()) {
                case "camera": return Manifest.permission.CAMERA;
                case "microphone":
                case "audio": return Manifest.permission.RECORD_AUDIO;
                case "location": return Manifest.permission.ACCESS_FINE_LOCATION;
                case "notification":
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                        return Manifest.permission.POST_NOTIFICATIONS;
                    }
                    return null;
                case "bluetooth":
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                        return Manifest.permission.BLUETOOTH_CONNECT;
                    }
                    return null;
                default: return null;
            }
        }
    }

    // =========================================================================
    // 7. NATIVE ANDROID GPS LOCATION BRIDGE (5-10m Strict Geofencing)
    // =========================================================================
    public class AndroidNativeLocationBridge {
        @android.webkit.JavascriptInterface
        public String getLocation() {
            try {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                    runOnUiThread(() -> {
                        ActivityCompat.requestPermissions(MainActivity.this, new String[]{
                            Manifest.permission.ACCESS_FINE_LOCATION,
                            Manifest.permission.ACCESS_COARSE_LOCATION
                        }, PERMISSION_REQ_CODE);
                    });
                    return "{\"error\":\"PERMISSION_REQUIRED\"}";
                }
                android.location.LocationManager lm = (android.location.LocationManager) getSystemService(android.content.Context.LOCATION_SERVICE);
                if (lm == null) return "{\"error\":\"NO_LOCATION_SERVICE\"}";

                android.location.Location loc = null;
                if (lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER)) {
                    loc = lm.getLastKnownLocation(android.location.LocationManager.GPS_PROVIDER);
                }
                if (loc == null && lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)) {
                    loc = lm.getLastKnownLocation(android.location.LocationManager.NETWORK_PROVIDER);
                }
                if (loc != null) {
                    org.json.JSONObject obj = new org.json.JSONObject();
                    obj.put("latitude", loc.getLatitude());
                    obj.put("longitude", loc.getLongitude());
                    obj.put("accuracy", loc.getAccuracy());
                    obj.put("timestamp", loc.getTime());
                    return obj.toString();
                }
                return "{\"error\":\"WAITING_FOR_GPS_FIX\"}";
            } catch (Exception e) {
                return "{\"error\":\"" + e.getMessage() + "\"}";
            }
        }

        @android.webkit.JavascriptInterface
        public boolean isGpsEnabled() {
            try {
                android.location.LocationManager lm = (android.location.LocationManager) getSystemService(android.content.Context.LOCATION_SERVICE);
                return lm != null && (lm.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER) || lm.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER));
            } catch (Exception e) {
                return false;
            }
        }

        @android.webkit.JavascriptInterface
        public void openLocationSettings() {
            try {
                android.content.Intent intent = new android.content.Intent(android.provider.Settings.ACTION_LOCATION_SOURCE_SETTINGS);
                startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @android.webkit.JavascriptInterface
        public void openAppSettings() {
            try {
                android.content.Intent intent = new android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.setData(android.net.Uri.fromParts("package", getPackageName(), null));
                startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }
}
