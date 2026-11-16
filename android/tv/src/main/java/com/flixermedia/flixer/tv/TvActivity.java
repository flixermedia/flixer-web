package com.flixermedia.flixer.tv;

import android.os.Bundle;
import android.util.Log;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewParent;
import androidx.fragment.app.Fragment;
import com.capgo.videoplayer.FullscreenExoPlayerFragment;
import com.getcapacitor.BridgeActivity;

public class TvActivity extends BridgeActivity {
    private static final String TAG = "FlixerTv";
    private static final int VIDEO_FRAGMENT_CONTAINER_ID = 256;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FlixerTvPlugin.class);
        super.onCreate(savedInstanceState);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int key = event.getKeyCode();
        boolean navigationKey = key == KeyEvent.KEYCODE_DPAD_UP || key == KeyEvent.KEYCODE_DPAD_DOWN
            || key == KeyEvent.KEYCODE_DPAD_LEFT || key == KeyEvent.KEYCODE_DPAD_RIGHT
            || key == KeyEvent.KEYCODE_DPAD_CENTER || key == KeyEvent.KEYCODE_ENTER;
        if (!navigationKey || isInPictureInPictureMode()) return super.dispatchKeyEvent(event);

        Fragment fragment = getSupportFragmentManager().findFragmentById(VIDEO_FRAGMENT_CONTAINER_ID);
        View fragmentView = fragment instanceof FullscreenExoPlayerFragment ? fragment.getView() : null;
        View playerView = fragmentView == null ? null : fragmentView.findViewById(com.capgo.videoplayer.R.id.videoViewId);
        if (playerView == null || !playerView.isShown()) return super.dispatchKeyEvent(event);

        if (!containsFocus(playerView, getCurrentFocus())) {
            playerView.setFocusableInTouchMode(true);
            if (!playerView.requestFocus()) {
                Log.e(TAG, "Could not focus the fullscreen video player");
                return true;
            }
        }
        boolean handled = super.dispatchKeyEvent(event);
        if (!containsFocus(playerView, getCurrentFocus()) && !playerView.requestFocus()) {
            Log.e(TAG, "Could not restore focus to the fullscreen video player");
        }
        return handled;
    }

    private boolean containsFocus(View parent, View focused) {
        if (focused == parent) return true;
        ViewParent current = focused == null ? null : focused.getParent();
        while (current != null) {
            if (current == parent) return true;
            current = current.getParent();
        }
        return false;
    }
}