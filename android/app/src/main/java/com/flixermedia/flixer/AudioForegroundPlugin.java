package com.flixermedia.flixer;

import android.content.Intent;

import androidx.core.content.ContextCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "AudioForeground")
public class AudioForegroundPlugin extends Plugin {
    @PluginMethod
    public void start(PluginCall call) {
        try {
            Intent intent = new Intent(getContext(), AudioPlaybackService.class);
            ContextCompat.startForegroundService(getContext(), intent);
            call.resolve();
        } catch (Exception exception) {
            call.reject("Could not start the audio foreground service.", exception);
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        try {
            getContext().stopService(new Intent(getContext(), AudioPlaybackService.class));
            call.resolve();
        } catch (Exception exception) {
            call.reject("Could not stop the audio foreground service.", exception);
        }
    }
}
