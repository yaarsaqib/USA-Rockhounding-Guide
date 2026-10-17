<?php
/**
 * USA Rockhounding Geological Intelligence v1
 * Optional Macrostrat geological overlay; does not modify access/trust data.
 */
defined('ABSPATH') || exit;
add_action('wp_enqueue_scripts', function () {
    if (!is_page('rockhounding-map')) return;
    wp_enqueue_style('rha-geology-v1', get_stylesheet_directory_uri() . '/assets/css/rha-geology-v1.css', array(), '1.0.0');
});
add_action('wp_footer', function () {
    if (!is_page('rockhounding-map')) return;
    $scripts = wp_scripts();
    if (empty($scripts->registered['rh-map-locations'])) return;
    wp_register_script('rha-geology-v1', get_stylesheet_directory_uri() . '/assets/js/rha-geology-v1.js', array('rh-leaflet'), '1.0.0', true);
    $deps = &$scripts->registered['rh-map-locations']->deps;
    if (!in_array('rha-geology-v1', $deps, true)) $deps[] = 'rha-geology-v1';
    wp_add_inline_script('rha-geology-v1', 'window.RHA_GEOLOGY_POINT_ENDPOINT=' . wp_json_encode(rest_url('rha-geology/v1/point')) . ';', 'before');
    wp_enqueue_script('rha-geology-v1');
    wp_script_add_data('rha-geology-v1', 'strategy', 'defer');
}, 1);
add_action('rest_api_init', function () {
    register_rest_route('rha-geology/v1', '/point', array(
        'methods' => 'GET',
        'permission_callback' => '__return_true',
        'callback' => function (WP_REST_Request $request) {
            if (!$request->has_param('lat') || !$request->has_param('lng')) {
                return new WP_Error('rha_geo_missing', 'Latitude and longitude are required.', array('status' => 400));
            }
            $lat = filter_var($request->get_param('lat'), FILTER_VALIDATE_FLOAT);
            $lng = filter_var($request->get_param('lng'), FILTER_VALIDATE_FLOAT);
            if ($lat === false || $lng === false || $lat < -90 || $lat > 90 || $lng < -180 || $lng > 180) {
                return new WP_Error('rha_geo_invalid', 'Invalid coordinates.', array('status' => 400));
            }
            $cache_key = 'rha_geo_v3_' . md5(sprintf('%.4f,%.4f', $lat, $lng));
            $cached = get_transient($cache_key);
            if ($cached !== false) return rest_ensure_response($cached);
            $url = add_query_arg(array('lat' => sprintf('%.5f', $lat), 'lng' => sprintf('%.5f', $lng)), 'https://macrostrat.org/api/v2/geologic_units/map');
            $response = wp_remote_get($url, array('timeout' => 9, 'redirection' => 0, 'headers' => array('Accept' => 'application/json'), 'limit_response_size' => 250000));
            if (is_wp_error($response) || wp_remote_retrieve_response_code($response) !== 200) {
                return new WP_Error('rha_geo_unavailable', 'Geological data service unavailable.', array('status' => 502));
            }
            $json = json_decode(wp_remote_retrieve_body($response), true);
            if (!is_array($json)) return new WP_Error('rha_geo_format', 'Geological data response could not be read.', array('status' => 502));
            $items = isset($json['success']['data']) && is_array($json['success']['data']) ? $json['success']['data'] : array();
            $out = array();
            foreach (array_slice($items, 0, 4) as $item) {
                if (!is_array($item)) continue;
                $row = array();
                foreach (array('name', 'strat_name', 'unit_name', 'age', 't_int_name', 'b_int_name', 'lith', 'descrip', 'source', 'source_id', 'map_id', 'map_unit_id', 'best_t_age', 'best_b_age', 'best_age_top', 'best_age_bottom') as $field) {
                    if (isset($item[$field]) && is_scalar($item[$field])) $row[$field] = substr((string) $item[$field], 0, 250);
                }
                if (!empty($item['liths']) && is_array($item['liths'])) {
                    $row['liths'] = array_slice(array_values(array_map('strval', array_filter($item['liths'], 'is_scalar'))), 0, 8);
                }
                if ($row) $out[] = $row;
            }
            $result = array(
                'source' => 'Macrostrat', 'lat' => $lat, 'lng' => $lng, 'units' => $out,
                'note' => 'Mapped geology only. This does not establish mineral finds, access or collecting permission.'
            );
            set_transient($cache_key, $result, DAY_IN_SECONDS);
            return rest_ensure_response($result);
        }
    ));
});
