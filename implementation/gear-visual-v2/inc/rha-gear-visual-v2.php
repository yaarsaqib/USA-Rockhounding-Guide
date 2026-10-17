<?php
/** USA Rockhounding Gear Hub visual structure v2 — specific to page #11580. */
defined('ABSPATH') || exit;
add_action('wp_enqueue_scripts', static function () {
    if (!is_page(11580)) return;
    $base = get_stylesheet_directory_uri();
    wp_enqueue_style('rha-gear-visual-v2',$base.'/assets/css/rha-gear-visual-v2.css',array('rha-gear-hub-repair'),'2.0.0');
    wp_enqueue_script('rha-gear-visual-v2',$base.'/assets/js/rha-gear-visual-v2.js',array('rha-gear-hub-repair'),'2.0.0',true);
},1100);
