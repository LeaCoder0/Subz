package com.flasskamp.subz.dev;

import android.content.res.Configuration;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    /**
     * Flags night mode to the web layer by appending a marker to the user agent.
     * ThemeService (src/app/Services/theme.service.ts) looks for this exact
     * string -- the two must be changed together.
     */
    @Override
    public void onStart() {
        super.onStart();

        int nightMode = getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK;

        if (nightMode == Configuration.UI_MODE_NIGHT_YES) {
            WebSettings webSettings = this.bridge.getWebView().getSettings();
            webSettings.setUserAgentString(webSettings.getUserAgentString() + " AndroidDarkMode");
        }
    }
}
