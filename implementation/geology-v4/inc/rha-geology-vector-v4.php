<?php
/**
 * USA Rockhounding — Geological Polygon Filters v4.
 *
 * Overlay existing Leaflet atlas and location-guide maps with opt-in Macrostrat
 * MVT polygon rendering. This module NEVER modifies location status/record data.
 * VectorGrid is version pinned to 1.3.0, not loaded on other pages.
 */
defined('ABSPATH') || exit;

function rha_geology_v4_context() {
    $path = isset($_SERVER['REQUEST_URI']) ? (string)wp_unslash($_SERVER['REQUEST_URI']) : '';
    return is_page('rockhounding-map') ||
        (is_singular('page') && strpos($path, '/rockhounding-map/') !== false);
}
add_action('wp_enqueue_scripts', function () {
    if (!rha_geology_v4_context()) return;
    wp_enqueue_style(
        'rha-geology-vector-v4',
        get_stylesheet_directory_uri().'/assets/css/rha-geology-vector-v4.css',
        array('rha-geology-filters-v3'),
        '4.0.0'
    );
}, 1300);

// At footer registration time all location-map registrations are available.
// Make v4 an explicit dependency of the *existing* map initializer, so no new
// Leaflet map is created and hooks are registered before construction.
add_action('wp_footer', function () {
    if (!rha_geology_v4_context()) return;
    $scripts = wp_scripts();
    $targets = array();
    $leaflets = array();
    if (!empty($scripts->registered['rh-map-locations']) && !empty($scripts->registered['rh-leaflet'])) {
        $targets[] = 'rh-map-locations';
        $leaflets['rh-leaflet'] = true;
    }
    foreach ($scripts->registered as $handle => $registration) {
        if (!preg_match('/^rha-([a-z]{2})-location-map$/', (string)$handle, $match)) continue;
        $leaflet = 'rha-'.$match[1].'-leaflet';
        if (empty($scripts->registered[$leaflet])) continue;
        $targets[] = $handle;
        $leaflets[$leaflet] = true;
    }
    if (!$targets) return;
    // Documented Leaflet.VectorGrid 1.3.0 bundle includes protobuf dependencies.
    // Pinned HTTPS script; all tile data still comes directly from Macrostrat.
    wp_register_script(
        'rha-geology-vectorgrid-lib',
        'https://cdn.jsdelivr.net/npm/leaflet.vectorgrid@1.3.0/dist/Leaflet.VectorGrid.bundled.min.js',
        array_keys($leaflets),
        '1.3.0',
        true
    );
    wp_register_script(
        'rha-geology-vector-v4',
        get_stylesheet_directory_uri().'/assets/js/rha-geology-vector-v4.js',
        array('rha-geology-vectorgrid-lib'), '4.0.0', true
    );
    foreach ($targets as $target) {
        $deps = &$scripts->registered[$target]->deps;
        if (!in_array('rha-geology-vector-v4', $deps, true)) $deps[] = 'rha-geology-vector-v4';
        unset($deps);
    }
    wp_enqueue_script('rha-geology-vector-v4');
    wp_script_add_data('rha-geology-vector-v4', 'strategy', 'defer');
}, 3);
