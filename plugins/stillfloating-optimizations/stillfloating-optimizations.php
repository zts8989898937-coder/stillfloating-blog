<?php
/**
 * Plugin Name: Still Floating Optimizations
 * Description: 阿狸博客的字体、脚本依赖、手机看板娘与播放器优化。停用即可恢复主题原有行为。
 * Version: 1.4.1
 * Author: Still Floating
 * License: GPL-3.0-or-later
 */
namespace StillFloating\Optimizations;
if (!defined('ABSPATH')) { exit; }
const VERSION = '1.4.1';
require_once __DIR__ . '/playlist.php';
require_once __DIR__ . '/friends-import.php';
require_once __DIR__ . '/music-writer.php';
function active_theme() { return !is_admin() && strpos(get_template(), 'argon') !== false; }
function asset($file) { return plugins_url('assets/' . $file, __FILE__); }
function scripts() {
    if (!active_theme()) { return; }
    $scripts = wp_scripts();
    if (isset($scripts->registered['argon_js_merged'])) {
        $scripts->registered['argon_js_merged']->src = asset('argon-vendor.js');
        $scripts->registered['argon_js_merged']->ver = VERSION;
        $scripts->registered['argon_js_merged']->deps = array_values(array_unique(array_merge(array('jquery'), $scripts->registered['argon_js_merged']->deps)));
        // Argon's inline scripts use $. Keep one modern WordPress jQuery instance.
        wp_add_inline_script('jquery-core', 'window.$ = window.jQuery;', 'after');
    }
    wp_enqueue_script('stillfloating-runtime', asset('runtime.js'), array('jquery'), VERSION, true);
    wp_enqueue_style('stillfloating-optimizations', asset('runtime.css'), array(), VERSION);
}
add_action('wp_enqueue_scripts', __NAMESPACE__ . '\\scripts', 100);
add_filter('wp_get_custom_css', function($css) {
    if (!active_theme()) { return $css; }
    return str_replace('/wp-content/uploads/fonts/13.woff2', asset('echo-subset.woff2') . '?ver=' . VERSION, $css);
}, 20);
function footer_data($html, $name) {
    if (!preg_match('/var\s+' . $name . '\s*=\s*(\[.*?\]);/s', $html, $m)) { return null; }
    $json = $m[1];
    if ($name === 'SONGS') { $json = preg_replace('/([{,]\s*)(id|name|artist)\s*:/', '$1"$2":', $json); }
    return json_decode($json, true);
}
add_action('rest_api_init', function() {
    register_rest_route('stillfloating/v1', '/lyrics', array(
        'methods' => 'GET', 'permission_callback' => '__return_true',
        'callback' => function() {
            $data = footer_data(get_option('argon_footer_html', ''), 'GROUPS');
            $response = new \WP_REST_Response(is_array($data) ? $data : array(), 200);
            $response->header('Cache-Control', 'public, max-age=3600');
            return $response;
        }
    ));
});
function footer($html) {
    if (!active_theme() || (defined('REST_REQUEST') && REST_REQUEST)) { return $html; }
    $songs = playlist_data()['tracks'];
    if (!$songs) { $songs = footer_data($html, 'SONGS'); }
    $has_lyrics = is_array(footer_data($html, 'GROUPS'));
    $html = preg_replace_callback('/<script\b[^>]*>.*?<\/script>/is', function($match) use ($songs, $has_lyrics) {
        $script = $match[0];
        if (strpos($script, '__pioLazyLoaded') !== false) {
            // Guard before adding any Live2D script, CSS or model request.
            return str_replace('if (window.__pioLazyLoaded) return;',
                'if (window.matchMedia("(max-width: 768px)").matches || window.matchMedia("(pointer: coarse)").matches || (navigator.connection && navigator.connection.saveData)) return; if (window.__pioLazyLoaded) return;', $script);
        }
        if ($has_lyrics && strpos($script, 'var GROUPS =') !== false) { return ''; }
        if (is_array($songs) && strpos($script, 'var SONGS=') !== false) { return ''; }
        if (strpos($script, 'subtitle-typer.js') !== false || strpos($script, 'function rightHref()') !== false || strpos($script, 'function ensure()') !== false && strpos($script, 'admin-dash') !== false) { return ''; }
        return $script;
    }, $html);
    $html = str_replace('id="mp-audio" preload="metadata"', 'id="mp-audio" preload="none"', $html);
    $config = array('songs' => is_array($songs) ? $songs : array(), 'lyricsUrl' => esc_url_raw(rest_url('stillfloating/v1/lyrics')), 'hasLyrics' => $has_lyrics, 'pageSongs' => playlist_indices(is_array($songs) ? $songs : array()), 'writeUrls' => music_note_urls());
    return $html . '<script type="application/json" id="sf-config">' . wp_json_encode($config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT) . '</script>';
}
add_filter('option_argon_footer_html', __NAMESPACE__ . '\\footer', 20);
function html_output($html) {
    // Only transform the known Argon HTML document; no feeds, admin or REST output.
    if (stripos($html, '</head>') === false) { return $html; }
    if (defined('WPSEO_VERSION')) {
        $marker = strpos($html, '<!-- This site is optimized with');
        if ($marker !== false && $marker < stripos($html, '</head>')) {
            // Remove a theme field only when Yoast actually emits that field.
            $owned = array();
            $head_end = stripos($html, '</head>');
            $yoast_head = substr($html, $marker, $head_end - $marker);
            preg_match_all('/<meta\b[^>]*>/i', $yoast_head, $tags);
            foreach ($tags[0] as $tag) {
                if (preg_match('/\b(?:name|property)\s*=\s*[\'"](description|og:(?:title|type|url|description|site_name))[\'"]/i', $tag, $field)) {
                    $owned[strtolower($field[1])] = true;
                }
            }
            $prefix = substr($html, 0, $marker);
            $prefix = preg_replace_callback('/<meta\b[^>]*>/i', function($match) use ($owned) {
                if (preg_match('/\b(?:name|property)\s*=\s*[\'"](description|og:(?:title|type|url|description|site_name))[\'"]/i', $match[0], $field) && isset($owned[strtolower($field[1])])) { return ''; }
                return $match[0];
            }, $prefix);
            $html = $prefix . substr($html, $marker);
        }
    }
    $html = preg_replace('/(yearprogress_refresh\(\);\s*\},\s*)500(\);)/', '${1}60000$2', $html);
    $html = preg_replace('/(refresh_blog_running_time\(\);\s*\},\s*)500(\);)/', '${1}1000$2', $html);
    $html = preg_replace('/(<input\b[^>]*\bid=["\']post_comment_captcha_seed["\'][^>]*\bvalue=["\'])\s*<br\s*\/?>\s*<b>Warning<\/b>:[\s\S]*?<br\s*\/?>\s*(["\'])/i', '$1$2', $html);
    return apply_filters('stillfloating_html_output', $html);
}
add_action('template_redirect', function() {
    if (active_theme() && !is_feed() && !is_robots() && !is_trackback() && !(defined('REST_REQUEST') && REST_REQUEST)) { ob_start(__NAMESPACE__ . '\\html_output'); }
}, 20);
function clear_cache() { if (function_exists('wp_cache_clear_cache')) { wp_cache_clear_cache(); } }
register_activation_hook(__FILE__, __NAMESPACE__ . '\\clear_cache');
register_deactivation_hook(__FILE__, __NAMESPACE__ . '\\clear_cache');
require_once __DIR__ . '/features.php';
register_activation_hook(__FILE__, 'StillFloating\\Optimizations\\Features\\activate');
register_deactivation_hook(__FILE__, 'StillFloating\\Optimizations\\Features\\deactivate');
add_action('admin_init', function() {
    if (current_user_can('manage_options') && get_option('sf_assets_version') !== VERSION) {
        update_option('sf_assets_version', VERSION, false); clear_cache();
    }
}, 30);
