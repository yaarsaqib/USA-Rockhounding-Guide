<?php
/**
 * Atlas status affordances v1 — map controls must distinguish directions
 * from permission to collect. This module does NOT edit status records.
 */
defined('ABSPATH') || exit;
add_action('wp_enqueue_scripts',function(){
 if(!is_page('rockhounding-map'))return;
 $u=get_stylesheet_directory_uri();
 wp_enqueue_script('rha-atlas-status-safety-v1',$u.'/assets/js/rha-atlas-status-safety-v1.js',[], '1.0.0',true);
 wp_enqueue_style('rha-atlas-status-safety-v1',$u.'/assets/css/rha-atlas-status-safety-v1.css',[], '1.0.0');
},1400);
