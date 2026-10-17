<?php
/**
 * USA Rockhounding — scalable USGS mineral research viewport (v1).
 * Research records are not verified places to collect, and are never marked Ready.
 * This module does not mutate the original atlas registry or WordPress database.
 */
defined('ABSPATH') || exit;
function rha_atlas_research_visible(){
    return is_page('rockhounding-map');
}
add_action('rest_api_init',function(){
    register_rest_route('rha-atlas/v1','/research-window',[
        'methods'=>'GET',
        'permission_callback'=>'__return_true',
        'args'=>[
            'west'=>['required'=>true], 'east'=>['required'=>true],
            'south'=>['required'=>true], 'north'=>['required'=>true]
        ],
        'callback'=>function(WP_REST_Request $req){
            foreach(['west','east','south','north'] as $k) {
                $v=$req->get_param($k);
                if(!is_scalar($v)||!is_numeric($v)) return new WP_Error('bad_bbox','Four numeric bounding box coordinates are required.',['status'=>400]);
                $box[$k]=(float)$v;
            }
            if($box['west']< -180||$box['east']>180||$box['south']< -90||$box['north']>90||
                $box['west']>=$box['east']||$box['south']>=$box['north']) {
                return new WP_Error('bad_bbox','Invalid bounding box.',['status'=>400]);
            }
            // Avoid gigantic national requests and potentially expensive ArcGIS full scans.
            if(($box['east']-$box['west'])>2.5 || ($box['north']-$box['south'])>2.5){
                return new WP_Error('too_wide','Zoom in further to query detailed mineral-resource records.',['status'=>400]);
            }
            foreach($box as $k=>$value)$box[$k]=round($value,4);
            $cache='rha_mrds_win_v1_'.md5(wp_json_encode($box));
            $cached=get_transient($cache);
            if(is_array($cached))return rest_ensure_response($cached);
            if(!function_exists('rha_usgs_fetch')){
                return new WP_Error('source_missing','USGS data connector unavailable.',['status'=>503]);
            }
            $env=wp_json_encode([
                'xmin'=>$box['west'],'ymin'=>$box['south'],
                'xmax'=>$box['east'],'ymax'=>$box['north'],
                'spatialReference'=>['wkid'=>4326]
            ]);
            $out=rha_usgs_fetch([
                'where'=>'1=1',
                'geometry'=>$env,
                'geometryType'=>'esriGeometryEnvelope',
                'spatialRel'=>'esriSpatialRelIntersects',
                'inSR'=>4326,
                'outSR'=>4326,
                'outFields'=>'dep_id,site_name,code_list,dev_stat,url',
                'returnGeometry'=>'true',
                'resultRecordCount'=>300,
                'orderByFields'=>'gid',
                'f'=>'json'
            ]);
            if(is_wp_error($out))return new WP_Error('source_offline','USGS mineral data service temporarily unavailable.',['status'=>502]);
            $rows=[];
            foreach((array)($out['features']??[]) as $f){
                if(!is_array($f))continue;
                $a=(array)($f['attributes']??[]);
                $g=(array)($f['geometry']??[]);
                $lat=isset($g['y'])?(float)$g['y']:null;
                $lon=isset($g['x'])?(float)$g['x']:null;
                if($lat===null||$lon===null||$lat< -90||$lat>90||$lon< -180||$lon>180)continue;
                $id=preg_replace('/[^a-zA-Z0-9_-]/','',(string)($a['dep_id']??''));
                if($id==='')continue;
                $rows[$id]=[
                    'id'=>'usgs-mrds::'.$id,
                    'name'=>mb_substr(wp_strip_all_tags((string)($a['site_name']??'USGS mineral record')),0,170),
                    'latitude'=>$lat,'longitude'=>$lon,
                    'commodity'=>mb_substr(wp_strip_all_tags((string)($a['code_list']??'')),0,120),
                    'development'=>mb_substr(wp_strip_all_tags((string)($a['dev_stat']??'')),0,110),
                    'status'=>'research',
                    'source'=>'USGS MRDS'
                ];
            }
            $answer=[
                'status'=>'research_only',
                'source'=>'USGS Mineral Resources Data System',
                'items'=>array_values($rows),
                'limit'=>300,
                'more_possible'=>!empty($out['exceededTransferLimit'])||count($rows)>=300,
                'warning'=>'A mineral occurrence or mine record is NOT evidence of public ownership, safe access or permission to collect.'
            ];
            set_transient($cache,$answer,30*MINUTE_IN_SECONDS);
            return rest_ensure_response($answer);
        }
    ]);
});
add_action('wp_footer',function(){
    if(!rha_atlas_research_visible())return;
    $scripts=wp_scripts();
    if(empty($scripts->registered['rh-map-locations'])||empty($scripts->registered['rh-leaflet']))return;
    wp_enqueue_style('rha-research-window-v1',get_stylesheet_directory_uri().'/assets/css/rha-research-window-v1.css',[],'1.0.0');
    wp_register_script('rha-research-window-v1',get_stylesheet_directory_uri().'/assets/js/rha-research-window-v1.js',['rh-leaflet'],'1.0.0',true);
    wp_add_inline_script('rha-research-window-v1',
        'window.RHA_RESEARCH_VIEW_URL='.wp_json_encode(rest_url('rha-atlas/v1/research-window')).';','before');
    if(!in_array('rha-research-window-v1',$scripts->registered['rh-map-locations']->deps,true)){
        $scripts->registered['rh-map-locations']->deps[]='rha-research-window-v1';
    }
    wp_enqueue_script('rha-research-window-v1');
},2);
