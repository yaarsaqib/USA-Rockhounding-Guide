<?php
/** Geological Intelligence v3: a cited source endpoint and inspection-result filters. */
defined('ABSPATH') || exit;
add_action('rest_api_init', function () {
 register_rest_route('rha-geology/v1', '/source', array(
  'methods'=>'GET', 'permission_callback'=>'__return_true',
  'callback'=>function(WP_REST_Request $request){
   $id=absint($request->get_param('source_id'));
   if(!$id||$id>10000000)return new WP_Error('rha_geo_source_invalid','Invalid source ID.',array('status'=>400));
   $key='rha_geosource_v3_'.$id;
   $cached=get_transient($key);
   if(is_array($cached))return rest_ensure_response($cached);
   $url=add_query_arg(array('source_id'=>$id),'https://macrostrat.org/api/v2/defs/sources');
   $response=wp_remote_get($url,array('timeout'=>9,'redirection'=>0,'limit_response_size'=>350000,'headers'=>array('Accept'=>'application/json')));
   if(is_wp_error($response)||wp_remote_retrieve_response_code($response)!==200)return new WP_Error('rha_geo_source_offline','Source bibliography temporarily unavailable.',array('status'=>502));
   $json=json_decode(wp_remote_retrieve_body($response),true);
   $items=is_array($json)?($json['success']['data']??array()):array();
   if(!is_array($items))$items=array();
   $found=null;
   foreach($items as $x){if(is_array($x)&&isset($x['source_id'])&&absint($x['source_id'])===$id){$found=$x;break;}}
   if(!$found)return new WP_Error('rha_geo_source_missing','Map source reference not returned.',array('status'=>404));
   $out=array('source_id'=>$id,'provider'=>'Macrostrat');
   foreach(array('name','title','ref','authors','year','pub_year','publisher','scale','doi','slug','license') as $f){
    if(isset($found[$f])&&is_scalar($found[$f]))$out[$f]=substr(wp_strip_all_tags((string)$found[$f]),0,1300);
   }
   $out['catalog_url']=$url;
   foreach(array('url','source_url') as $f){
    if(!empty($found[$f])&&is_string($found[$f])){
     $v=esc_url_raw($found[$f],array('https'));
     if(strpos($v,'https://')===0)$out[$f]=$v;
    }
   }
   set_transient($key,$out,7*DAY_IN_SECONDS);
   return rest_ensure_response($out);
  }
 ));
});
add_action('wp_enqueue_scripts',function(){
 $path=isset($_SERVER['REQUEST_URI'])?(string)wp_unslash($_SERVER['REQUEST_URI']):'';
 $on_map=is_page('rockhounding-map');
 $on_guide=(is_singular('page')&&strpos($path,'/rockhounding-map/')!==false)||strpos($path,'/rockhounding-guide/')!==false;
 if(!$on_map&&!$on_guide)return;
 $root=get_stylesheet_directory_uri();
 wp_enqueue_style('rha-geology-filters-v3',$root.'/assets/css/rha-geology-filters-v3.css',array(),'3.0.0');
 wp_enqueue_script('rha-geology-filters-v3',$root.'/assets/js/rha-geology-filters-v3.js',array(),'3.0.1',true);
 wp_add_inline_script('rha-geology-filters-v3','window.RHA_GEOLOGY_SOURCE_ENDPOINT='.wp_json_encode(rest_url('rha-geology/v1/source')).';','before');
},1200);
