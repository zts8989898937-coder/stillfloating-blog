<?php
namespace StillFloating\Optimizations;
if (!defined('ABSPATH')) { exit; }
// One-time import explicitly requested by the owner. Native links remain editable.
function import_requested_friends() {
    if (!current_user_can('manage_links') || get_option('sf_friends_import_20261024')) { return; }
    require_once ABSPATH . 'wp-admin/includes/bookmark.php';
    $requested=array(
        'https://blog.mmoe.work/'=>'Adogecheems的无趣地',
        'https://xrjprogram.github.io/'=>'XRJprogram',
        'https://nirvanacelesteblog.dpdns.org/'=>"NirvanaCeleste's Blog",
    );
    $existing=array();foreach(get_bookmarks(array('hide_invisible'=>0)) as $item){$existing[untrailingslashit($item->link_url)]=true;}
    $category=term_exists('友链','link_category');
    if(!$category){$category=wp_insert_term('友链','link_category');}
    if(is_wp_error($category)){return;}
    $category_id=is_array($category)?(int)$category['term_id']:(int)$category;
    foreach($requested as $url=>$name){
        if(isset($existing[untrailingslashit($url)])){continue;}
        $id=wp_insert_link(array('link_name'=>$name,'link_url'=>$url,'link_visible'=>'Y','link_target'=>'_blank','link_category'=>array($category_id)),true);
        if(is_wp_error($id)||!$id){return;}
    }
    update_option('sf_friends_import_20261024',true,false);
    clear_cache();
}
add_action('admin_init',__NAMESPACE__.'\\import_requested_friends',25);
