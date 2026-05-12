package com.example.waterapp

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.os.Bundle
import android.view.KeyEvent
import android.view.View
import android.view.ViewGroup
import android.view.Window
import android.view.WindowInsets
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.Toast
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import android.window.OnBackInvokedDispatcher

class MainActivity : Activity() {
    private var lastBackPressedAt = 0L
    private var lastBackHandledAt = 0L
    private var statusBarInsetTop = 0

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        window.setStatusBarTransparent()
        window.navigationBarColor = Color.BLACK

        val root = FrameLayout(this)
        val webView = WebView(this)
        root.addView(
            webView,
            FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
        setContentView(root)
        applySystemBarInsets(root, webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            allowFileAccessFromFileURLs = true
            allowUniversalAccessFromFileURLs = true
            allowContentAccess = true
            loadWithOverviewMode = true
            useWideViewPort = true
            mediaPlaybackRequiresUserGesture = false
        }

        webView.isVerticalScrollBarEnabled = false
        webView.isHorizontalScrollBarEnabled = false
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView, url: String?) {
                applyWebSafeArea(view)
            }
        }
        webView.webChromeClient = WebChromeClient()

        // Load index.html from assets
        webView.loadUrl("file:///android_asset/index.html")

        registerBackHandler()
    }

    private fun applySystemBarInsets(root: View, webView: WebView) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
            root.setOnApplyWindowInsetsListener { view, insets ->
                val top: Int
                val bottom: Int
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    val bars = insets.getInsets(WindowInsets.Type.systemBars())
                    top = bars.top
                    bottom = bars.bottom
                } else {
                    @Suppress("DEPRECATION")
                    top = insets.systemWindowInsetTop
                    @Suppress("DEPRECATION")
                    bottom = insets.systemWindowInsetBottom
                }
                statusBarInsetTop = top
                view.setPadding(0, 0, 0, bottom)
                applyWebSafeArea(webView)
                insets
            }
            root.requestApplyInsets()
        }
    }

    private fun applyWebSafeArea(webView: WebView) {
        webView.evaluateJavascript(
            "document.documentElement.style.setProperty('--safe-top', '${statusBarInsetTop}px');",
            null
        )
    }

    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        handleBackExit()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
            handleBackExit()
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    private fun registerBackHandler() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            onBackInvokedDispatcher.registerOnBackInvokedCallback(
                OnBackInvokedDispatcher.PRIORITY_DEFAULT
            ) {
                handleBackExit()
            }
        }
    }

    private fun handleBackExit() {
        val now = System.currentTimeMillis()
        if (now - lastBackHandledAt < BACK_DUPLICATE_IGNORE_MS) {
            return
        }

        lastBackHandledAt = now
        if (now - lastBackPressedAt <= BACK_EXIT_INTERVAL_MS) {
            finish()
            return
        }

        lastBackPressedAt = now
        Toast.makeText(this, "한 번 더 누르면 종료됩니다", Toast.LENGTH_SHORT).show()
    }

    companion object {
        private const val BACK_EXIT_INTERVAL_MS = 1800L
        private const val BACK_DUPLICATE_IGNORE_MS = 450L
    }
}

private fun Window.setStatusBarTransparent() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
        clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS)
        addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
        statusBarColor = Color.TRANSPARENT
        @Suppress("DEPRECATION")
        decorView.systemUiVisibility =
            View.SYSTEM_UI_FLAG_LAYOUT_STABLE or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
    }
}
