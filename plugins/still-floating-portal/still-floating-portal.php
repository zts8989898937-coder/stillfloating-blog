<?php
/**
 * Plugin Name: Still Floating 3D 开屏
 * Description: 完整 3D 星球开屏与日夜过渡。首页展示开屏，可分别进入博客与刷题站。
 * Version: 1.1.0
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Author: Still Floating
 * Text Domain: still-floating-portal
 */

if (!defined('ABSPATH')) {
    exit;
}

require_once __DIR__ . '/transition.php';

function sf_portal_is_entry_request() {
    $method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';
    if (!in_array($method, array('GET', 'HEAD'), true) || is_admin() || wp_doing_ajax()) {
        return false;
    }
    if (!is_front_page() || is_paged() || is_feed() || is_search() || is_preview()
        || is_customize_preview() || is_trackback() || is_embed()
        || (defined('REST_REQUEST') && REST_REQUEST)) {
        return false;
    }
    if ((isset($_GET['sf_blog']) && is_string($_GET['sf_blog']) && $_GET['sf_blog'] === '1')
        || (isset($_GET['from']) && is_string($_GET['from']) && $_GET['from'] === 'portal')) {
        return false;
    }
    return true;
}

function sf_portal_blog_url() {
    $posts_page = (int) get_option('page_for_posts');
    if (get_option('show_on_front') === 'page' && $posts_page) {
        $url = get_permalink($posts_page);
        if ($url) {
            return $url;
        }
    }
    return add_query_arg('sf_blog', '1', home_url('/'));
}

/**
 * Entry to the quiz subdomain. Filterable so the address can be changed without editing the plugin.
 */
function sf_portal_quiz_url() {
    return apply_filters('sf_portal_quiz_url', 'https://quiz.stillfloating.top/');
}

// Keep the splash and the blog entry out of shared full-page caches.
function sf_portal_prepare_response() {
    if (!is_front_page() || is_feed() || is_preview()) {
        return;
    }
    if (!defined('DONOTCACHEPAGE')) {
        define('DONOTCACHEPAGE', true);
    }
    nocache_headers();
}
add_action('template_redirect', 'sf_portal_prepare_response', 1);

function sf_portal_select_template($template) {
    if (sf_portal_is_entry_request()) {
        return __DIR__ . '/templates/portal.php';
    }
    return $template;
}
add_filter('template_include', 'sf_portal_select_template', 99);

// The previously installed transition plugin can stay enabled.
function sf_portal_blog_transition() {
    if (false === has_action('wp_head', 'still_floating_site_transition_bootstrap')) {
        sf_portal_theme_bootstrap();
    }
}
add_action('wp_head', 'sf_portal_blog_transition', 0);

function sf_portal_plugin_links($links) {
    array_unshift($links, '<a href="' . esc_url(home_url('/')) . '" target="_blank" rel="noopener">查看开屏</a>');
    return $links;
}
add_filter('plugin_action_links_' . plugin_basename(__FILE__), 'sf_portal_plugin_links');
