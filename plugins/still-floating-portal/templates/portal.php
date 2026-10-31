<?php
if (!defined('ABSPATH')) {
    exit;
}

$sf_portal_html = file_get_contents(dirname(__DIR__) . '/portal/index.html');

// The bundle name carries a content hash, so resolve it from disk instead of hard-coding it.
$sf_portal_asset = '';
$sf_portal_bundles = glob(dirname(__DIR__) . '/portal/assets/*.js');
if (is_array($sf_portal_bundles) && $sf_portal_bundles) {
    usort($sf_portal_bundles, function ($a, $b) {
        return filemtime($b) <=> filemtime($a);
    });
    $sf_portal_asset = plugins_url('portal/assets/' . basename($sf_portal_bundles[0]), dirname(__DIR__) . '/still-floating-portal.php');
}

echo str_replace(
    array('__SF_PORTAL_ASSET__', '__SF_PORTAL_BLOG__', '__SF_PORTAL_QUIZ__'),
    array(esc_url($sf_portal_asset), esc_url(sf_portal_blog_url()), esc_url(sf_portal_quiz_url())),
    $sf_portal_html
);
