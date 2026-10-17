<?php
/**
 * USA Rockhounding Gear Hub repair v1 (theme-only, 2026-10-17).
 * Enhances the existing plugin shortcode; does not replace its data or template.
 */
defined('ABSPATH') || exit;

add_action('wp_enqueue_scripts', function () {
    if (!is_page(11580)) return;
    $uri = get_stylesheet_directory_uri();
    wp_enqueue_style('rha-gear-hub-repair', $uri . '/assets/css/rha-gear-hub-repair-v1.css', array(), '1.0.0');
    wp_enqueue_script('rha-gear-hub-repair', $uri . '/assets/js/rha-gear-hub-repair-v1.js', array(), '1.2.0', true);
}, 999);

function rha_gear_fix_output($output) {
    if (!is_page(11580) || !is_string($output)) return $output;
    if (strpos($output, 'usarh-gear-app') === false) return $output;

    // Product and model links share exactly the same pre-existing Amazon target;
    // never invent ASINs, replace short links, or claim a redirect was verified.
    $output = preg_replace_callback(
        '~<article\b(?=[^>]*\busarh-shop-card\b)[^>]*>[\s\S]*?</article>~i',
        static function ($m) {
            $card = $m[0];
            if (!preg_match('~<a\b[^>]*class="[^"]*usarh-btn--merchant[^"]*"[^>]*href="([^"]+)"[^>]*>[\s\S]*?</a>~i', $card, $buy)) {
                return $card;
            }
            $url = html_entity_decode($buy[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $host = strtolower((string) wp_parse_url($url, PHP_URL_HOST));
            if (!in_array($host, array('www.amazon.com','amazon.com','link.amazon','amzn.to','a.co'), true)) return $card;

            $type = ($host === 'amazon.com' || $host === 'www.amazon.com')
                ? (strpos((string) wp_parse_url($url, PHP_URL_PATH), '/s') === 0 ? 'search' : 'direct')
                : 'short';
            $name = 'this product';
            if (preg_match('~<h3[^>]*>([\s\S]*?)</h3>~i', $card, $heading)) {
                $name = wp_strip_all_tags(html_entity_decode($heading[1], ENT_QUOTES | ENT_HTML5, 'UTF-8'));
            }
            $safe = esc_url($url);
            $label = $type === 'search' ? 'Search Amazon for this model ↗' : 'View this model on Amazon ↗';
            $desc = $type === 'search'
                ? 'Amazon search results—not a verified exact-product listing. Confirm the model and seller.'
                : ($type === 'short' ? 'Amazon short link. Confirm the destination, exact package and seller before buying.'
                    : 'Check the exact product, seller, package and current price on Amazon.');
            $button = '<a class="usarh-btn usarh-btn--merchant" href="' . $safe . '" target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label="' . esc_attr($label . ' — ' . $name) . '">' . esc_html($label) . '</a>';

            $card = str_replace($buy[0], $button, $card);
            $card = preg_replace(
                '~(<div class="usarh-commerce">[\s\S]*?</a>)\s*<small>[\s\S]*?</small>~i',
                '$1<small>' . esc_html($desc) . '</small>',
                $card,
                1
            );
            if (strpos($card, 'rha-gear-photo-link') === false && preg_match('~<img\b[^>]*class="[^"]*usarh-product-photo[^"]*"[^>]*>~i', $card, $img)) {
                $reference = preg_match('~(?:reference|representative|illustrative|example)~i', $img[0]);
                $photoLink = '<a class="rha-gear-photo-link" href="' . $safe . '" target="_blank" rel="sponsored nofollow noopener noreferrer" aria-label="' . esc_attr('Inspect ' . $name . ' on Amazon') . '">' . $img[0] . '</a>';
                if ($reference) $photoLink .= '<small class="rha-gear-photo-note">Reference image; check the exact model or package.</small>';
                $card = str_replace($img[0], $photoLink, $card);
            }
            if (strpos($card, 'rha-gear-title-link') === false) $card = preg_replace_callback(
                '~<h3([^>]*)>([\s\S]*?)</h3>~i',
                static function ($h) use ($safe) {
                    return '<h3' . $h[1] . '><a class="rha-gear-title-link" href="' . $safe . '" target="_blank" rel="sponsored nofollow noopener noreferrer">' . $h[2] . '</a></h3>';
                }, $card, 1
            );
            return $card;
        },
        $output
    );

    // Honor the Gear hub's Amazon-only outbound-link policy. Keep cited names
    // readable, but not as outbound anchors (including manufacturer sites).
    $output = preg_replace_callback('~<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)</a>~i',
        static function ($m) {
            $url = html_entity_decode($m[1], ENT_QUOTES | ENT_HTML5, 'UTF-8');
            $host = strtolower((string) wp_parse_url($url, PHP_URL_HOST));
            if (!$host || $host === 'usarockhounding.com' || $host === 'www.usarockhounding.com'
                || in_array($host, array('amazon.com','www.amazon.com','amzn.to','link.amazon','a.co'), true)) return $m[0];
            return '<span class="rha-gear-reference-label">' . $m[2] . '</span>';
        }, $output);
    return $output;
}
add_filter('do_shortcode_tag', static function ($output, $tag) {
    return $tag === 'usarh_gear_hub' ? rha_gear_fix_output($output) : $output;
}, 180, 2);
add_filter('the_content', 'rha_gear_fix_output', 999);
