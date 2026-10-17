<?php
/**
 * USA Rockhounding Geological Intelligence — Guide Map v2
 * Enhances the existing location-map instance; never creates a second map.
 * Uses the read-only /rha-geology/v1/point endpoint from geology v1.
 */
defined('ABSPATH') || exit;
add_action('wp_enqueue_scripts', function () {
    if (!is_singular('page') && !get_query_var('rha_field_guide')) return;
    $scripts = wp_scripts();
    // All state-specific location guides use the same #rha-mt-location-map
    // container but register separate handles (rha-mt, rha-al, rha-ar...).
    // Discover the actual registered handle rather than naming one state.
    $targets = array();
    $leaflets = array();
    foreach ($scripts->registered as $handle => $registration) {
        if (!preg_match('/^rha-([a-z]{2})-location-map$/', (string) $handle, $match)) continue;
        $leaflet = 'rha-' . $match[1] . '-leaflet';
        if (empty($scripts->registered[$leaflet])) continue;
        $targets[] = $handle;
        $leaflets[$leaflet] = true;
    }
    if (!$targets) return;
    wp_enqueue_style(
        'rha-geology-guide-v2',
        get_stylesheet_directory_uri() . '/assets/css/rha-geology-guide-v2.css',
        array(), '2.0.0'
    );
    wp_register_script(
        'rha-geology-guide-v2',
        get_stylesheet_directory_uri() . '/assets/js/rha-geology-guide-v2.js',
        array_keys($leaflets), '2.1.0', true
    );
    wp_add_inline_script(
        'rha-geology-guide-v2',
        'window.RHA_GEOLOGY_GUIDE_API=' . wp_json_encode(rest_url('rha-geology/v1/point')) . ';',
        'before'
    );
    foreach ($targets as $target) {
        if (!in_array('rha-geology-guide-v2', $scripts->registered[$target]->deps, true)) {
            $scripts->registered[$target]->deps[] = 'rha-geology-guide-v2';
        }
    }
    wp_enqueue_script('rha-geology-guide-v2');
}, 999);
