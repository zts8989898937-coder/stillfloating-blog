<?php
namespace StillFloating\Optimizations;
if (!defined('ABSPATH')) { exit; }

function music_song($id) {
    static $indexed=null;if($indexed===null){$indexed=array();foreach(playlist_data()['tracks'] as $song){$indexed[(string)$song['id']]=$song;}}
    return $indexed[(string)$id]??null;
}
function music_note_url($id) {
    if (!current_user_can('edit_posts') || !music_song($id)) { return ''; }
    return add_query_arg(array('action'=>'sf_music_note','song'=>(string)$id,'_wpnonce'=>wp_create_nonce('sf_music_note_'.$id)),admin_url('admin-post.php'));
}
function music_note_link($id, $class='sf-write-note') {
    $url=music_note_url($id); if(!$url){return '';}
    return '<a class="'.esc_attr($class.' no-pjax').'" data-sf-write href="'.esc_url($url).'">写音乐笔记 <span aria-hidden="true">↗</span></a>';
}
function music_note_urls() {
    $out=array(); if(!current_user_can('edit_posts')){return $out;}
    foreach(playlist_data()['tracks'] as $song){$out[(string)$song['id']]=music_note_url($song['id']);}
    return $out;
}
function create_music_draft($id) {
    if(!current_user_can('edit_posts')){return new \WP_Error('sf_forbidden','没有写作权限。');}
    $song=music_song($id);if(!$song){return new \WP_Error('sf_unknown_song','找不到这首歌。');}
    $drafts=get_posts(array('post_type'=>'post','post_status'=>array('draft','auto-draft'),'author'=>get_current_user_id(),'meta_key'=>'_sf_music_song_id','meta_value'=>$song['id'],'posts_per_page'=>1,'orderby'=>'modified','order'=>'DESC'));
    if($drafts && current_user_can('edit_post',$drafts[0]->ID)){return $drafts[0]->ID;}
    $meta=array('_sf_music_enabled'=>'1','_sf_music_song_id'=>$song['id'],'_sf_music_track'=>$song['name'],'_sf_music_artist'=>$song['artist'],'_sf_music_album'=>$song['album'],'_sf_music_year'=>$song['year']??'','_sf_music_cover'=>0,'argon_first_image_as_thumbnail'=>'false');
    $args=array('post_type'=>'post','post_status'=>'draft','post_author'=>get_current_user_id(),'post_title'=>$song['name'].' — '.$song['artist'],'post_content'=>'','meta_input'=>$meta);
    $category=get_term_by('slug','music','category');if($category){$args['post_category']=array($category->term_id);}
    return wp_insert_post($args,true);
}
add_action('admin_post_sf_music_note',function(){
    $id=isset($_GET['song'])?sanitize_text_field(wp_unslash($_GET['song'])):'';
    if(!current_user_can('edit_posts')){wp_die('没有写作权限。','',array('response'=>403));}
    check_admin_referer('sf_music_note_'.$id);
    $post_id=create_music_draft($id);
    if(is_wp_error($post_id)){wp_die(esc_html($post_id->get_error_message()),'',array('response'=>400));}
    wp_safe_redirect(get_edit_post_link($post_id,'raw'));exit;
});

function friend_icon_html($item) {
    $known=array('blog.mmoe.work'=>'mmoe.webp','xrjprogram.github.io'=>'xrj.ico','nirvanacelesteblog.dpdns.org'=>'nirvana.png');
    $url=!empty($item->link_image)?esc_url($item->link_image,array('http','https')):'';
    $host=strtolower((string)wp_parse_url($item->link_url,PHP_URL_HOST));
    if(!$url&&isset($known[$host])){$url=plugins_url('assets/friends/'.$known[$host],__FILE__);}
    if(!$url){return '<span class="sf-friend-icon sf-friend-icon-fallback" aria-hidden="true">↗</span>';}
    return '<img class="sf-friend-icon" src="'.esc_url($url).'" alt="" width="44" height="44" loading="lazy" decoding="async" />';
}

add_filter('option_argon_theme_color',function($color){return strtolower((string)$color)==='#ff9700'?'#8a624c':$color;});
add_action('wp_enqueue_scripts',function(){
    if(active_theme()){wp_enqueue_style('sf-design',asset('design.css'),array('stillfloating-features','stillfloating-optimizations'),VERSION);}
},120);

// Utility-page icons and album thumbnails are not article hero images.
add_filter('get_post_metadata',function($value,$post_id,$key,$single){
    if($key==='argon_first_image_as_thumbnail'&&get_post_meta($post_id,'_sf_generated_page',true)){return $single?'false':array('false');}
    return $value;
},10,4);
