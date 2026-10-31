<?php
namespace StillFloating\Optimizations\Features;
if (!defined('ABSPATH')) { exit; }

const SCHEMA = '1.1.0';
function page_specs() {
    return array(
        'explore' => array('探索', 'sf_explore'), 'series' => array('文章系列', 'sf_series'),
        'tags' => array('标签', 'sf_tags'), 'music' => array('音乐馆', 'sf_music'),
        'now' => array('近况', 'sf_now'), 'friends' => array('友链', 'sf_friends'),
        'watching' => array('片单', 'sf_watching'),
    );
}
// Display copy is selected verbatim from the owner's existing lyric collection.
// Removed or edited source lines are omitted, never rewritten or replaced by prose.
function lyric_data($key) {
    static $selected = null;
    if ($selected === null) {
        $wanted = array(
            'explore' => array('Ladies and gentlemen we are floating in space', 'Spiritualized'),
            'series' => array('A giant step each day', 'Spiritualized'),
            'tags' => array('Here, there and everywhere', 'The Beatles'),
            'music' => array('I had fun, I\'ll let the record play', 'EAR'),
            'archives' => array('The pages keep turning', 'Stars'),
            'now' => array('Getting strong today', 'Spiritualized'),
            'friends' => array('With lovers and friends I still can recall', 'The Beatles'),
            'watching' => array('I saw a film today, oh boy', 'The Beatles'),
            'gallery' => array('In June there\'s the light', 'Stars'),
        );
        $selected = array();
        $groups = \StillFloating\Optimizations\footer_data(footer_source(), 'GROUPS');
        foreach (is_array($groups) ? $groups : array() as $group) {
            foreach (isset($group['lines']) && is_array($group['lines']) ? $group['lines'] : array() as $line) {
                foreach ($wanted as $name => $pair) {
                    if (($line['t'] ?? '') === $pair[0] && ($line['a'] ?? '') === $pair[1]) { $selected[$name] = $pair; }
                }
            }
        }
    }
    return $selected[$key] ?? array();
}
function lyric_line($key) { $line=lyric_data($key); return $line ? $line[0] . ' — ' . $line[1] : ''; }
function page_descriptions() { $out=array(); foreach(array_keys(page_specs()) as $key){$out[$key]=lyric_line($key);} return $out; }
function pages() { $v = get_option('sf_feature_pages', array()); return is_array($v) ? $v : array(); }
function page_url($key) {
    $map = pages();
    if (!empty($map[$key]) && get_post_status($map[$key]) === 'publish') { return get_permalink($map[$key]); }
    if ($key === 'archives') { $p = get_page_by_path('archives'); return $p && $p->post_status === 'publish' ? get_permalink($p) : ''; }
    if ($key === 'gallery') { $p = get_page_by_path('图库'); return $p && $p->post_status === 'publish' ? get_permalink($p) : ''; }
    return '';
}
function register_types() {
    register_taxonomy('sf_series', array('post'), array(
        'labels' => array('name' => '文章系列', 'singular_name' => '文章系列', 'add_new_item' => '添加系列', 'edit_item' => '编辑系列'),
        'public' => true, 'show_ui' => true, 'show_in_rest' => true, 'show_admin_column' => true,
        'rewrite' => array('slug' => 'note-series', 'with_front' => false),
    ));
    register_post_type('sf_watch', array(
        'labels' => array('name' => '片单', 'singular_name' => '作品', 'add_new_item' => '添加作品', 'edit_item' => '编辑作品'),
        'public' => false, 'show_ui' => true, 'show_in_menu' => true, 'show_in_rest' => false,
        'publicly_queryable' => false, 'exclude_from_search' => true, 'menu_icon' => 'dashicons-video-alt3',
        'supports' => array('title', 'editor', 'thumbnail'),
    ));
}
add_action('init', __NAMESPACE__ . '\\register_types');

function bootstrap() {
    if (get_option('sf_features_schema') === SCHEMA) { return; }
    if (!current_user_can('manage_options')) { return; }
    $map = pages();
    foreach (page_specs() as $slug => $spec) {
        if (!empty($map[$slug]) && get_post($map[$slug])) { continue; }
        $existing = get_page_by_path($slug);
        if ($existing && strpos($existing->post_content, '[' . $spec[1] . ']') !== false) {
            $map[$slug] = $existing->ID; continue;
        }
        $id = wp_insert_post(array('post_type' => 'page', 'post_status' => 'publish', 'post_title' => $spec[0],
            'post_name' => $existing ? 'blog-' . $slug : $slug, 'post_content' => '[' . $spec[1] . ']',
            'comment_status' => 'closed', 'ping_status' => 'closed'), true);
        if (is_wp_error($id) || !$id) { return; }
        update_post_meta($id, '_sf_generated_page', $slug);
        update_post_meta($id, '_yoast_wpseo_metadesc', page_descriptions()[$slug]); $map[$slug] = $id;
        update_option('sf_feature_pages', $map, false);
    }
    $term = term_exists('algorithm-notes', 'sf_series');
    if (!$term) { $term = wp_insert_term('算法学习', 'sf_series', array('slug' => 'algorithm-notes', 'description' => '')); }
    if (!is_wp_error($term) && $term) {
        $term_id = is_array($term) ? (int)$term['term_id'] : (int)$term;
        foreach (array(118 => array('快速排序', 10), 125 => array('并排', 20)) as $id => $expected) {
            $p = get_post($id);
            if ($p && $p->post_type === 'post' && $p->post_status === 'publish' && $p->post_title === $expected[0]) {
                wp_set_object_terms($id, array($term_id), 'sf_series', true);
                if (get_post_meta($id, '_sf_series_order', true) === '') { update_post_meta($id, '_sf_series_order', $expected[1]); }
            }
        }
    }
    // Seed only facts and excerpts already present in these two public music notes.
    $music = array(
        107 => array('title' => 'the neverminds/afterglow', 'track' => 'afterglow', 'artist' => 'the neverminds', 'genre' => '盯鞋 / 后摇', 'note' => '最最最吸引我的是开场鼓与音墙的融合。'),
        36 => array('title' => 'Ladies and Gentlemen We Are Floating in Space 歌词翻译解析', 'track' => 'Ladies and Gentlemen We Are Floating in Space', 'artist' => 'Spiritualized', 'year' => '1997', 'genre' => '太空摇滚', 'note' => '人声以轮唱方式层层叠加、彼此追逐，没有起点也没有终点。'),
    );
    foreach ($music as $id => $data) {
        $p = get_post($id);
        if (!$p || $p->post_title !== $data['title'] || get_post_meta($id, '_sf_music_initialized', true)) { continue; }
        update_post_meta($id, '_sf_music_enabled', '1');
        foreach (array('track', 'artist', 'year', 'genre', 'note') as $field) { if (isset($data[$field])) { update_post_meta($id, '_sf_music_' . $field, $data[$field]); } }
        update_post_meta($id, '_sf_music_initialized', '1');
    }
    if (get_option('sf_features_settings', null) === null) {
        update_option('sf_features_settings', array('recent_ids' => array('28151024', '1903408778', '22063112'), 'doing' => '', 'listening' => '', 'next' => ''), false);
    }
    update_option('sf_features_schema', SCHEMA, false);
    flush_rewrite_rules(false);
    \StillFloating\Optimizations\clear_cache();
}
add_action('admin_init', __NAMESPACE__ . '\\bootstrap', 20);
function activate() {
    register_types(); bootstrap();
    foreach (pages() as $id) {
        if (get_post_meta($id, '_sf_hidden_on_deactivation', true) && get_post_status($id) === 'draft') {
            wp_update_post(array('ID' => $id, 'post_status' => 'publish')); delete_post_meta($id, '_sf_hidden_on_deactivation');
        }
    }
}
function deactivate() {
    foreach (pages() as $id) {
        if (get_post_meta($id, '_sf_generated_page', true) && get_post_status($id) === 'publish') {
            wp_update_post(array('ID' => $id, 'post_status' => 'draft')); update_post_meta($id, '_sf_hidden_on_deactivation', '1');
        }
    }
    unregister_taxonomy('sf_series'); unregister_post_type('sf_watch'); flush_rewrite_rules(false);
    \StillFloating\Optimizations\clear_cache();
}

function settings() {
    $s = get_option('sf_features_settings', array());
    $s = wp_parse_args(is_array($s) ? $s : array(), array('recent_ids' => array(), 'doing' => '', 'listening' => '', 'next' => ''));
    $valid = array_map('strval', array_column(songs(),'id')); $replacement = array('1903408778'=>'1879098277','785728'=>'672188','1818820553'=>'1421849426','22764957'=>'28762750');
    $s['recent_ids'] = array_values(array_filter(array_map(function($id)use($valid,$replacement){$id=(string)$id;if(!in_array($id,$valid,true)&&isset($replacement[$id])){$id=$replacement[$id];}return in_array($id,$valid,true)?$id:'';},(array)$s['recent_ids'])));
    return $s;
}
function footer_source() {
    // Read the owner's source setting before the frontend filter removes inline lyrics.
    $filter='StillFloating\\Optimizations\\footer'; $priority=has_filter('option_argon_footer_html',$filter);
    if($priority!==false){remove_filter('option_argon_footer_html',$filter,$priority);}
    try{$raw=get_option('argon_footer_html','');}finally{if($priority!==false){add_filter('option_argon_footer_html',$filter,$priority);}}
    return $raw;
}
function songs() { $imported=\StillFloating\Optimizations\playlist_data()['tracks']; if($imported){return $imported;} $v=\StillFloating\Optimizations\footer_data(footer_source(),'SONGS');return is_array($v)?$v:array(); }

function text($value) { return esc_html((string)$value); }
function limit_text($value, $length) { $chars=preg_split('//u',(string)$value,-1,PREG_SPLIT_NO_EMPTY);return is_array($chars)?implode('',array_slice($chars,0,$length)):''; }
function link($url, $label, $class = '') { return '<a class="' . esc_attr($class) . '" href="' . esc_url($url) . '">' . text($label) . '</a>'; }
function shell($key, $title) { $intro=lyric_line($key); return '<div class="sf-feature sf-hub-content"><div class="sf-section-heading"><h2>' . text($title) . '</h2>' . ($intro ? '<p class="sf-muted" data-sf-lyric="' . esc_attr($key) . '">' . text($intro) . '</p>' : '') . '</div>'; }
function empty_note($message) { return '<p class="sf-empty">' . text($message) . '</p>'; }
function public_posts($args = array()) {
    return get_posts(array_merge(array('post_type' => 'post', 'post_status' => 'publish', 'has_password' => false, 'posts_per_page' => 100, 'no_found_rows' => true, 'suppress_filters' => false), $args));
}
function series_posts($term_id) {
    $posts = public_posts(array('posts_per_page' => -1, 'tax_query' => array(array('taxonomy' => 'sf_series', 'field' => 'term_id', 'terms' => (int)$term_id))));
    usort($posts, function($a, $b) {
        $oa = (int)get_post_meta($a->ID, '_sf_series_order', true); $ob = (int)get_post_meta($b->ID, '_sf_series_order', true);
        return $oa === $ob ? strcmp($a->post_date, $b->post_date) : ($oa <=> $ob);
    });
    return $posts;
}
function progress($posts) {
    return '<span class="sf-progress" data-sf-series-progress data-post-ids="' . esc_attr(wp_json_encode(array_map(function($p){return $p->ID;}, $posts))) . '">共 ' . count($posts) . ' 篇</span>';
}
function post_word_stats($post) {
    $plain = preg_replace('/\s+/u', '', wp_strip_all_tags(strip_shortcodes((string)$post->post_content)));
    $chars = function_exists('mb_strlen') ? mb_strlen($plain, 'UTF-8') : strlen($plain);
    $chars = max(1, (int)$chars);
    $mins = max(1, (int)ceil($chars / 300));
    return array('chars' => $chars, 'minutes' => $mins);
}
function series_rail_html($posts, $current_id = 0) {
    $count = count($posts);
    if (!$count) { return ''; }
    $ids = wp_list_pluck($posts, 'ID');
    $at = $current_id ? array_search($current_id, $ids, true) : false;
    $default_label = $at !== false ? '第 ' . ($at + 1) . ' / ' . $count . ' 篇 · ' . $posts[$at]->post_title : '共 ' . $count . ' 篇 · 悬停刻度预览章节';
    $out = '<div class="sf-series-rail-box" data-sf-series-rail-box data-default-preview="' . esc_attr($default_label) . '">';
    $out .= '<div class="sf-series-preview" data-sf-series-preview aria-live="polite">' . text($default_label) . '</div>';
    $out .= '<div class="sf-series-rail-track">';
    if ($at !== false && $at > 0) {
        $prev = $posts[$at - 1];
        $out .= '<a class="sf-series-rail-arrow" href="' . esc_url(get_permalink($prev)) . '" data-sf-tick-label="上一篇" data-sf-tick-title="' . esc_attr($prev->post_title) . '" aria-label="上一篇：' . esc_attr($prev->post_title) . '">←</a>';
    } else {
        $out .= '<span class="sf-series-rail-arrow sf-is-disabled" aria-hidden="true">←</span>';
    }
    $out .= '<ol class="sf-series-rail" style="--sf-tick-count:' . (int)$count . '">';
    foreach ($posts as $i => $p) {
        $label = '第 ' . ($i + 1) . ' / ' . $count . ' 篇';
        $current = $current_id && $p->ID === $current_id;
        $out .= '<li><a class="sf-series-tick" href="' . esc_url(get_permalink($p)) . '" data-sf-tick-post="' . (int)$p->ID . '" data-sf-tick-label="' . esc_attr($label) . '" data-sf-tick-title="' . esc_attr($p->post_title) . '"' . ($current ? ' aria-current="page"' : '') . ' aria-label="' . esc_attr($label . ' ' . $p->post_title) . '"><span class="sf-series-tick-mark" aria-hidden="true"></span></a></li>';
    }
    $out .= '</ol>';
    if ($at !== false && $at + 1 < $count) {
        $next = $posts[$at + 1];
        $out .= '<a class="sf-series-rail-arrow" href="' . esc_url(get_permalink($next)) . '" data-sf-tick-label="下一篇" data-sf-tick-title="' . esc_attr($next->post_title) . '" aria-label="下一篇：' . esc_attr($next->post_title) . '">→</a>';
    } else {
        $out .= '<span class="sf-series-rail-arrow sf-is-disabled" aria-hidden="true">→</span>';
    }
    return $out . '</div></div>';
}
function series_list() {
    $out = shell('series', '文章系列');
    $terms = get_terms(array('taxonomy' => 'sf_series', 'hide_empty' => true));
    if (is_wp_error($terms) || !$terms) { return $out . empty_note('暂无系列') . '</div>'; }
    $out .= '<div class="sf-filter-bar"><label class="sf-search-label">搜索系列文章<input type="search" class="sf-series-search" data-sf-series-search placeholder="搜索系列或文章标题…" autocomplete="off"></label><span class="sf-small sf-muted" data-sf-series-filter-count role="status" aria-live="polite"></span></div>';
    foreach ($terms as $term) {
        $posts = series_posts($term->term_id);
        $latest = $posts ? $posts[count($posts) - 1] : null;
        $out .= '<section class="sf-panel sf-series" id="sf-series-' . esc_attr($term->slug) . '" data-sf-series-section><div class="sf-row"><div><h3>' . text($term->name) . '</h3></div><div class="sf-series-header-meta">' . progress($posts) . ($latest ? link(get_permalink($latest), '最新：' . $latest->post_title . ' →', 'sf-series-latest sf-small') : '') . '</div></div>';
        $out .= series_rail_html($posts, 0);
        // Series introductions use the lyric above; preserve taxonomy data without repurposing it as display copy.
        $out .= '<ol class="sf-series-list">';
        foreach ($posts as $p) {
            $stats = post_word_stats($p);
            $date = get_the_date('Y.m.d', $p);
            $out .= '<li data-sf-read-item="' . $p->ID . '" data-sf-search="' . esc_attr($term->name . ' ' . $p->post_title) . '"><div class="sf-series-item-main">' . link(get_permalink($p), $p->post_title) . '<span class="sf-series-item-meta"><time datetime="' . esc_attr(get_the_date('c', $p)) . '">' . text($date) . '</time> · <span>' . $stats['chars'] . ' 字 · ' . $stats['minutes'] . ' 分钟</span></span></div><button type="button" class="sf-read-toggle" data-sf-read-toggle="' . $p->ID . '" aria-pressed="false">标记已读</button></li>';
        }
        $out .= '</ol></section>';
    }
    $out .= '<p class="sf-empty" data-sf-series-empty hidden>没有匹配的系列文章</p>';
    return $out . '<p class="sf-small sf-muted">阅读标记只保存在当前浏览器，不会上传。</p></div>';
}
function series_navigation($id, $bottom = false) {
    $terms = wp_get_post_terms($id, 'sf_series');
    if (is_wp_error($terms) || !$terms) { return ''; }
    $term = $terms[0]; $posts = series_posts($term->term_id); $ids = wp_list_pluck($posts, 'ID'); $at = array_search($id, $ids, true);
    if ($at === false) { return ''; }
    $out = '<nav class="sf-series-nav sf-feature" aria-label="' . ($bottom ? '文末' : '文章') . '系列导航"' . (!$bottom ? ' data-sf-series-name="' . esc_attr($term->name) . '" data-sf-series-url="' . esc_attr(page_url('series') . '#sf-series-' . $term->slug) . '"' : '') . '><div class="sf-row"><strong>' . link(page_url('series') . '#sf-series-' . $term->slug, $term->name) . '</strong><span class="sf-small">第 ' . ($at + 1) . ' / ' . count($posts) . ' 篇</span></div>';
    if (!$bottom) { $out .= series_rail_html($posts, $id); }
    $out .= '<details' . ($bottom ? ' open' : '') . '><summary>系列目录 · ' . progress($posts) . '</summary><ol class="sf-series-list">';
    foreach ($posts as $p) {
        $stats = post_word_stats($p);
        $out .= '<li data-sf-read-item="' . $p->ID . '"' . ($p->ID === $id ? ' aria-current="page"' : '') . '>' . link(get_permalink($p), $p->post_title) . '<span class="sf-series-item-meta">' . text(get_the_date('Y.m.d', $p)) . ' · ' . $stats['minutes'] . ' min</span></li>';
    }
    $out .= '</ol></details><div class="sf-row sf-series-steps">';
    if ($at > 0) { $out .= link(get_permalink($posts[$at - 1]), '← 上一篇：' . $posts[$at - 1]->post_title); }
    if ($bottom) { $out .= '<button type="button" class="sf-read-toggle" data-sf-read-toggle="' . $id . '" aria-pressed="false">标记已读</button>'; }
    if ($at + 1 < count($posts)) { $out .= link(get_permalink($posts[$at + 1]), '下一篇：' . $posts[$at + 1]->post_title . ' →'); }
    return $out . '</div></nav>';
}
function tags_page() {
    $out = shell('tags', '标签与分类');
    $out .= '<div class="sf-filter-bar"><label class="sf-search-label">搜索标签或分类<input type="search" class="sf-tags-search" data-sf-tags-search placeholder="输入关键词过滤标签或分类…" autocomplete="off"></label><span class="sf-small sf-muted" data-sf-tags-status role="status" aria-live="polite"></span></div>';
    foreach (array('post_tag' => '标签', 'category' => '分类') as $taxonomy => $label) {
        $terms = get_terms(array('taxonomy' => $taxonomy, 'hide_empty' => true, 'orderby' => 'count', 'order' => 'DESC'));
        $out .= '<section class="sf-panel" data-sf-taxonomy-panel="' . esc_attr($taxonomy) . '"><h3>' . $label . '</h3><div class="sf-tags">';
        if (!is_wp_error($terms)) { foreach ($terms as $term) { $url = get_term_link($term); if (is_wp_error($url)) { continue; } $out .= '<a href="' . esc_url($url) . '" data-sf-tag-item data-sf-search="' . esc_attr($term->name . ' ' . $label) . '"><span>' . text($term->name) . '</span><span class="sf-tag-count">' . (int)$term->count . '</span></a>'; } }
        $out .= '</div></section>';
    }
    $out .= '<p class="sf-empty" data-sf-tags-empty hidden>没有匹配的标签或分类</p>';
    return $out . '</div>';
}
function song_cover($song, $class='sf-track-cover', $size=48) {
    $url=\StillFloating\Optimizations\playlist_cover_url($song,$size*2);
    if(!$url){return '<span class="'.esc_attr($class).' sf-cover-fallback" aria-hidden="true">♪</span>';}
    return '<img class="'.esc_attr($class).'" src="'.esc_url($url).'" alt="'.esc_attr(($song['album']??$song['name']).' 专辑封面').'" width="'.(int)$size.'" height="'.(int)$size.'" loading="lazy" decoding="async" referrerpolicy="no-referrer" />';
}
// Keep native album thumbnails outside Argon's article-image lazyload/lightbox pass.
// The shield is scoped to our own cover classes and restored immediately afterward.
function shield_album_images($content, $restore=false) {
    static $covers=array();
    if($restore){if(!$covers){return $content;}$content=strtr($content,$covers);$covers=array();return $content;}
    return preg_replace_callback('~<img\b[^>]*\bclass=[\'"][^\'"]*\bsf-(?:track-cover|playlist-cover|cover|friend-icon)\b[^\'"]*[\'"][^>]*>~i',function($match)use(&$covers){$token='<!--'.wp_unique_id('sf-album-').'-->';$covers[$token]=$match[0];return $token;},$content);
}
add_filter('the_content',__NAMESPACE__.'\\shield_album_images',19);
add_filter('the_content',function($content){return shield_album_images($content,true);},21);
function recent_listening() {
    $selected = array_map('strval', (array)settings()['recent_ids']); $out = '<div class="sf-track-list">'; $n = 0;
    foreach ($selected as $id) { foreach (songs() as $song) {
        if ((string)$song['id'] !== $id || $n >= 3) { continue; } $n++;
        $out .= '<div class="sf-track-row"><button type="button" class="sf-track" data-sf-song="' . esc_attr($id) . '" aria-label="播放 ' . esc_attr($song['name']) . '"><span class="sf-track-number">0' . $n . '</span>' . song_cover($song) . '<span class="sf-track-copy"><strong>' . text($song['name']) . '</strong><small>' . text($song['artist']) . '</small></span><span class="sf-play-icon" aria-hidden="true">▶</span></button>' . \StillFloating\Optimizations\music_note_link($id) . '</div>';
    } }
    return $out . '</div>';
}
function music_data($id) {
    if (get_post_meta($id, '_sf_music_enabled', true) !== '1') { return array(); }
    $d = array(); foreach (array('track','artist','album','year','genre','favorite','note','cover','song_id') as $key) { $d[$key] = get_post_meta($id, '_sf_music_' . $key, true); }
    return $d;
}
function music_card($post, $detail = false) {
    $d = music_data($post->ID); if (!$d) { return ''; }
    $associated=\StillFloating\Optimizations\music_song($d['song_id']??'');
    $out = '<section class="sf-music-card sf-feature' . ($detail ? ' sf-music-detail' : '') . '">';
    if (!empty($d['cover']) && wp_attachment_is_image((int)$d['cover'])) {
        $out .= wp_get_attachment_image((int)$d['cover'], 'medium', false, array('class' => 'sf-cover', 'loading' => 'lazy', 'decoding' => 'async', 'alt' => $d['track'] . ' 封面'));
    } else {
        $match=$associated;
        foreach(songs() as $song){if(!$match&&strtolower($song['name'])===strtolower($d['track'])&&strtolower($song['artist'])===strtolower($d['artist'])){$match=$song;break;}}
        $out .= $match ? song_cover($match,'sf-cover',116) : '<div class="sf-cover sf-vinyl" aria-hidden="true"><span>♪</span></div>';
    }
    $heading=$detail?'p':'h3';
    $out .= '<div class="sf-music-copy"><p class="sf-eyebrow">音乐笔记</p><'.$heading.' class="sf-music-title">' . ($detail ? text($d['track'] ?: $post->post_title) : link(get_permalink($post), $d['track'] ?: $post->post_title)) . '</'.$heading.'>';
    $bits = array_filter(array($d['artist'], $d['year'], $d['genre']));
    if ($bits) { $out .= '<p class="sf-muted">' . text(implode(' · ', $bits)) . '</p>'; }
    $album=$d['album']?:($associated['album']??'');
    if($album){$out.='<p class="sf-music-album sf-small">专辑 · '.text($album).'</p>';}
    if ($d['favorite']) { $out .= '<p><span class="sf-small sf-muted">推荐曲</span> ' . text($d['favorite']) . '</p>'; }
    // Existing note metadata is retained for editing; promotional copy uses supplied lyrics only.
    if($associated){$out.='<div class="sf-music-actions"><button type="button" class="sf-note-play" data-sf-song="'.esc_attr($associated['id']).'">播放歌曲</button>'.\StillFloating\Optimizations\music_note_link($associated['id']).'</div>';}
    if (!$detail) { $out .= link(get_permalink($post), '读这篇音乐笔记 →', 'sf-text-link'); }
    return $out . '</div></section>';
}
function playlist_html() {
    $data=\StillFloating\Optimizations\playlist_data(); $tracks=$data['tracks']; if(!$tracks){return '';}
    $out='<section class="sf-panel sf-playlist" data-sf-playlist><div class="sf-row"><h3>歌单</h3>' . link($data['url'],'网易云歌单 ↗','sf-small') . '</div>';
    $out.='<label class="sf-playlist-search-label">搜索曲名或歌手<input type="search" class="sf-playlist-search" data-sf-playlist-search placeholder="搜索曲名或歌手" autocomplete="off"></label><p class="sf-small sf-muted" data-sf-playlist-count role="status" aria-live="polite">共 ' . count($tracks) . ' 首</p><div class="sf-playlist-scroll"><ol class="sf-playlist-list">';
    foreach($tracks as $i=>$song){
        $out.='<li data-sf-playlist-item data-sf-search="'.esc_attr($song['name'].' '.$song['artist']).'"><button type="button" class="sf-playlist-play" data-sf-song="'.esc_attr($song['id']).'" aria-label="播放 '.esc_attr($song['name'].' · '.$song['artist']).'"><span class="sf-track-number">'.($i+1).'</span>' . song_cover($song,'sf-playlist-cover',40) . '<span class="sf-playlist-title"><strong>'.text($song['name']).'</strong><small>'.text($song['artist']).'</small></span><span class="sf-play-icon" aria-hidden="true">▶</span></button><div class="sf-song-actions">' . \StillFloating\Optimizations\music_note_link($song['id']) . '<a class="sf-song-source" href="https://music.163.com/song?id='.esc_attr($song['id']).'" target="_blank" rel="noopener noreferrer" aria-label="在网易云打开 '.esc_attr($song['name']).'">网易云 ↗</a></div></li>';
    }
    return $out.'</ol><p class="sf-muted" data-sf-playlist-empty hidden>没有匹配的歌曲</p></div><p class="sf-small sf-muted">站内播放受网易云版权与外链权限限制；无法播放时可前往网易云。</p></section>';
}
function music_page() {
    $out = shell('music', '音乐馆');
    $out .= '<section class="sf-panel"><h3>最近在听</h3><p class="sf-small sf-muted">从站内歌单挑三首，点击播放。</p>' . recent_listening() . '</section>' . playlist_html() . '<h3>音乐笔记</h3><div class="sf-music-grid">';
    $posts = public_posts(array('meta_key' => '_sf_music_enabled', 'meta_value' => '1', 'posts_per_page' => 30));
    foreach ($posts as $p) { $out .= music_card($p); }
    if (!$posts) { $out .= empty_note('暂无音乐笔记'); }
    return $out . '</div></div>';
}
function now_page() {
    $s = settings(); $out = shell('now', '近况'); $has_status = false;
    foreach (array('doing' => '正在做', 'listening' => '正在听', 'next' => '接下来') as $key => $label) {
        if (trim($s[$key]) === '') { continue; } $has_status = true;
        $out .= '<section class="sf-panel"><h3>' . $label . '</h3><p>' . nl2br(text($s[$key])) . '</p></section>';
    }
    $posts = public_posts(array('post_type' => array('post','shuoshuo'), 'posts_per_page' => 8));
    $out .= '<section class="sf-panel"><h3>最近更新</h3><ol class="sf-timeline">';
    foreach ($posts as $p) { $out .= '<li><time datetime="' . esc_attr(get_the_date('c', $p)) . '">' . text(get_the_date('Y.m.d', $p)) . '</time>' . link(get_permalink($p), $p->post_title ?: '一条碎碎念') . '</li>'; }
    $out .= '</ol></section>';
    $p = get_page_by_path('碎碎念叽里咕噜');
    if (!$p) { $found = get_posts(array('post_type'=>'page','meta_key'=>'_wp_page_template','meta_value'=>'shuoshuo.php','posts_per_page'=>1)); $p = $found ? $found[0] : null; }
    if ($p && $p->post_status === 'publish') { $out .= link(get_permalink($p), '去看碎碎念 →', 'sf-text-link'); }
    return $out . '</div>';
}
function friends_page() {
    $out = shell('friends', '友链');
    $links = get_bookmarks(array('hide_invisible' => 1, 'orderby' => 'name')); $groups = array();
    foreach ($links as $item) {
        $url = esc_url($item->link_url, array('http','https')); if (!$url) { continue; }
        $cats = wp_get_object_terms($item->link_id, 'link_category'); $name = !is_wp_error($cats) && $cats ? $cats[0]->name : '友链'; $groups[$name][] = $item;
    }
    if ($groups) {
        $out .= '<div class="sf-friends-toolbar"><div class="sf-filter-group" role="group" aria-label="筛选友链分组"><button type="button" data-sf-friend-filter="all" aria-pressed="true">全部 (' . count($links) . ')</button>';
        foreach ($groups as $gname => $gitems) {
            $out .= '<button type="button" data-sf-friend-filter="' . esc_attr($gname) . '" aria-pressed="false">' . text($gname) . ' (' . count($gitems) . ')</button>';
        }
        $out .= '</div><button type="button" class="sf-tool-btn sf-random-friend" data-sf-random-friend aria-label="随机访问一位友链网站">随机访问 ↗</button></div>';
    }
    foreach ($groups as $name => $items) {
        $out .= '<section class="sf-friend-group" data-sf-friend-group="' . esc_attr($name) . '"><h3>' . text($name) . '</h3><div class="sf-link-grid">';
        foreach ($items as $item) { $out .= '<a class="sf-friend" href="' . esc_url($item->link_url, array('http','https')) . '" target="_blank" rel="noopener noreferrer">' . \StillFloating\Optimizations\friend_icon_html($item) . '<span class="sf-friend-copy"><strong>' . text($item->link_name) . '</strong>' . ($item->link_description ? '<span>' . text($item->link_description) . '</span>' : '') . '<small>访问网站 ↗</small></span></a>'; }
        $out .= '</div></section>';
    }
    if (!$groups) { $out .= empty_note('暂无友链'); }
    $boards = get_posts(array('post_type'=>'page','meta_key'=>'_wp_page_template','meta_value'=>'msgboard.php','posts_per_page'=>1));
    if ($boards) { $out .= link(get_permalink($boards[0]), '留言板 →', 'sf-text-link'); }
    return $out . '</div>';
}
function watching_page() {
    $states = array('watching' => '在看', 'finished' => '看完', 'wish' => '想看');
    $out = shell('watching', '片单');
    $posts = public_posts(array('post_type' => 'sf_watch', 'posts_per_page' => 100));
    if (!$posts) { return $out . empty_note('暂无作品') . '</div>'; }
    $out .= '<div class="sf-filter-group" role="group" aria-label="筛选片单"><button type="button" data-sf-watch-filter="all" aria-pressed="true">全部</button>';
    foreach ($states as $key => $label) { $out .= '<button type="button" data-sf-watch-filter="' . $key . '" aria-pressed="false">' . $label . '</button>'; }
    $out .= '</div><div class="sf-watch-grid">';
    foreach ($posts as $p) {
        $state = get_post_meta($p->ID, '_sf_watch_status', true); if (!isset($states[$state])) { $state = 'wish'; }
        $rating = get_post_meta($p->ID, '_sf_watch_rating', true);
        $out .= '<article class="sf-watch-card" data-sf-watch-state="' . $state . '">';
        if (has_post_thumbnail($p)) { $out .= get_the_post_thumbnail($p, 'medium', array('loading' => 'lazy', 'decoding' => 'async')); }
        $out .= '<div><p class="sf-eyebrow">' . $states[$state] . ($rating !== '' ? ' · ' . text($rating) . '/10' : '') . '</p><h3>' . text($p->post_title) . '</h3>';
        $description = wp_trim_words(wp_strip_all_tags(strip_shortcodes($p->post_content)), 80, '…');
        if ($description) { $out .= '<p>' . text($description) . '</p>'; }
        $url = esc_url(get_post_meta($p->ID, '_sf_watch_url', true), array('http','https'));
        if ($url) { $out .= '<a href="' . $url . '" target="_blank" rel="noopener noreferrer">作品页面 ↗</a>'; }
        $out .= '</div></article>';
    }
    return $out . '</div><p class="sf-empty" data-sf-watch-empty hidden>这个分类还没有作品。</p></div>';
}
function public_post_pool($exclude_id = 0) {
    $all = public_posts(array('posts_per_page' => 50));
    $pool = array();
    foreach ($all as $p) {
        if ($exclude_id && (int)$p->ID === (int)$exclude_id) { continue; }
        $cats = get_the_category($p->ID);
        $cat_name = $cats ? $cats[0]->name : '文章';
        $pool[] = array('id' => (int)$p->ID, 'title' => (string)$p->post_title, 'url' => get_permalink($p), 'cat' => (string)$cat_name, 'date' => get_the_date('Y.m.d', $p));
    }
    return $pool;
}
function site_stats_strip() {
    $posts = public_posts(array('posts_per_page' => -1));
    $series = get_terms(array('taxonomy' => 'sf_series', 'hide_empty' => true));
    $tags = get_terms(array('taxonomy' => 'post_tag', 'hide_empty' => true));
    $tracks = count(songs());
    $pool = public_post_pool();
    $out = '<div class="sf-stats-strip" aria-label="站点内容概览">';
    $out .= '<div class="sf-stats-items">';
    $out .= '<span class="sf-stat-chip"><strong>' . count($posts) . '</strong> 篇文章</span>';
    $out .= '<span class="sf-stat-chip"><strong>' . (!is_wp_error($series) && is_array($series) ? count($series) : 0) . '</strong> 个系列</span>';
    $out .= '<span class="sf-stat-chip"><strong>' . (!is_wp_error($tags) && is_array($tags) ? count($tags) : 0) . '</strong> 个标签</span>';
    $out .= '<span class="sf-stat-chip"><strong>' . (int)$tracks . '</strong> 首曲目</span>';
    $out .= '</div>';
    if ($pool) {
        $out .= '<button type="button" class="sf-tool-btn sf-random-jump" data-sf-random-jump data-sf-posts-pool="' . esc_attr(wp_json_encode($pool)) . '">随机漫游一篇 ↗</button>';
    }
    return $out . '</div>';
}
function explore_page() {
    $out = shell('explore', '探索') . site_stats_strip();
    $cards = array('series'=>array('01','文章系列'),'tags'=>array('02','标签与分类'),'music'=>array('03','音乐馆'),'archives'=>array('04','归档'),'now'=>array('05','近况'),'friends'=>array('06','友链'),'watching'=>array('07','片单'),'gallery'=>array('08','图库'));
    $out .= '<div class="sf-explore-grid">';
    foreach ($cards as $key => $card) { $url = page_url($key); if (!$url) { continue; } $out .= '<a class="sf-explore-card" href="' . esc_url($url) . '"><span class="sf-eyebrow">' . $card[0] . '</span><strong>' . $card[1] . '</strong><span>' . text(lyric_line($key)) . '</span><i aria-hidden="true">↗</i></a>'; }
    return $out . '</div></div>';
}
function register_shortcodes() {
    foreach (array('sf_explore'=>'explore_page','sf_series'=>'series_list','sf_tags'=>'tags_page','sf_music'=>'music_page','sf_now'=>'now_page','sf_friends'=>'friends_page','sf_watching'=>'watching_page') as $tag => $callback) { add_shortcode($tag, __NAMESPACE__ . '\\' . $callback); }
}
add_action('init', __NAMESPACE__ . '\\register_shortcodes');

function calendar_html() {
    global $wpdb;
    $zone = wp_timezone(); $month = new \DateTimeImmutable('first day of this month 00:00:00', $zone); $start = $month->modify('-11 months');
    $rows = $wpdb->get_results($wpdb->prepare("SELECT DATE(post_date) AS day, COUNT(*) AS total FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish' AND post_password = '' AND post_date >= %s GROUP BY DATE(post_date)", $start->format('Y-m-d H:i:s')), ARRAY_A);
    $days = array(); $total = 0; foreach ($rows as $row) { $days[$row['day']] = (int)$row['total']; $total += (int)$row['total']; }
    $out = '<section class="sf-feature sf-calendar-panel"><details><summary>写作日历 <span class="sf-muted">过去 12 个月 · ' . $total . ' 篇</span></summary><div class="sf-calendar-scroll">';
    for ($i=0; $i<12; $i++) {
        $m = $start->modify('+' . $i . ' months'); $out .= '<div class="sf-month"><p class="sf-month-title">' . text($m->format('Y.m')) . '</p><div class="sf-month-days">';
        foreach (array('一','二','三','四','五','六','日') as $label) { $out .= '<span class="sf-weekday">' . $label . '</span>'; }
        for ($blank=1; $blank<(int)$m->format('N'); $blank++) { $out .= '<span aria-hidden="true"></span>'; }
        for ($d=1; $d<=(int)$m->format('t'); $d++) {
            $date = $m->setDate((int)$m->format('Y'), (int)$m->format('n'), $d); $key=$date->format('Y-m-d'); $n=$days[$key] ?? 0;
            $label = $date->format('Y年n月j日') . '，' . $n . ' 篇文章';
            $out .= $n ? '<a class="sf-day sf-day-active" title="' . esc_attr($label) . '" aria-label="' . esc_attr($label) . '" href="' . esc_url(get_day_link((int)$date->format('Y'), (int)$date->format('n'), $d)) . '">' . $d . '</a>' : '<span class="sf-day" title="' . esc_attr($label) . '">' . $d . '</span>';
        }
        $out .= '</div></div>';
    }
    return $out . '</div></details></section>';
}
function home_html() {
    if (!page_url('explore')) { return ''; }
    $pool = public_post_pool();
    $out = '<section class="sf-home-panel sf-feature card bg-white shadow-sm border-0"><div class="sf-row"><div><h2>探索</h2></div><div class="sf-home-head-actions">' . ($pool ? '<button type="button" class="sf-tool-btn sf-random-jump" data-sf-random-jump data-sf-posts-pool="' . esc_attr(wp_json_encode($pool)) . '">随机漫游 ↗</button>' : '') . link(page_url('explore'), '全部入口 ↗', 'sf-text-link') . '</div></div><nav class="sf-home-links" aria-label="内容入口">';
    foreach (array('series'=>'文章系列','tags'=>'标签','music'=>'音乐馆','now'=>'近况') as $key=>$label) { $url=page_url($key); if($url){$out.=link($url,$label);} }
    $out .= '</nav><div class="sf-row"><h3>最近在听</h3>' . link(page_url('music'), '去音乐馆 →', 'sf-small') . '</div>' . recent_listening();
    $s = settings(); if ($s['doing']) { $out .= '<p class="sf-home-status"><span>正在做</span> ' . text(wp_trim_words($s['doing'], 30, '…')) . '</p>'; }
    return $out . '</section>';
}
function sider_series_payload($post) {
    $series_terms = wp_get_post_terms($post->ID, 'sf_series');
    if (!is_wp_error($series_terms) && $series_terms) {
        $term = $series_terms[0];
        $sposts = series_posts($term->term_id);
        if ($sposts) {
            $items = array();
            foreach ($sposts as $p) {
                $items[] = array('id' => (int)$p->ID, 'title' => (string)$p->post_title, 'url' => get_permalink($p), 'date' => get_the_date('Y.m.d', $p));
            }
            return array('name' => (string)$term->name, 'url' => page_url('series') ? page_url('series') . '#sf-series-' . $term->slug : '', 'currentId' => (int)$post->ID, 'items' => $items);
        }
    }
    $cats = get_the_category($post->ID);
    if ($cats) {
        $cat = $cats[0];
        $cposts = public_posts(array('category__in' => array((int)$cat->term_id), 'posts_per_page' => 50, 'orderby' => 'date', 'order' => 'DESC'));
        if (count($cposts) >= 2) {
            $items = array();
            foreach ($cposts as $p) {
                $items[] = array('id' => (int)$p->ID, 'title' => (string)$p->post_title, 'url' => get_permalink($p), 'date' => get_the_date('Y.m.d', $p));
            }
            $cat_url = get_category_link($cat->term_id);
            return array('name' => (string)$cat->name, 'url' => (!is_wp_error($cat_url) && $cat_url) ? $cat_url : '', 'currentId' => (int)$post->ID, 'items' => $items);
        }
    }
    $all = public_posts(array('posts_per_page' => 35, 'orderby' => 'date', 'order' => 'DESC'));
    $items = array();
    foreach ($all as $p) {
        $items[] = array('id' => (int)$p->ID, 'title' => (string)$p->post_title, 'url' => get_permalink($p), 'date' => get_the_date('Y.m.d', $p));
    }
    return array('name' => '近期文章', 'url' => page_url('archives') ?: home_url('/'), 'currentId' => (int)$post->ID, 'items' => $items);
}
function post_header_tools($post) {
    $cats = get_the_category($post->ID);
    $series_terms = wp_get_post_terms($post->ID, 'sf_series');
    $sider_payload = sider_series_payload($post);
    $out = '<div class="sf-post-toolbar sf-feature" role="region" aria-label="文章阅读工具栏" data-sf-post-id="' . (int)$post->ID . '" data-sf-sider-series="' . esc_attr(wp_json_encode($sider_payload)) . '">';
    $out .= '<nav class="sf-breadcrumbs" aria-label="面包屑导航"><a class="sf-crumb-home" href="' . esc_url(home_url('/')) . '">首页</a>';
    if ($cats) {
        $cat = $cats[0];
        $cat_url = get_category_link($cat->term_id);
        if (!is_wp_error($cat_url) && $cat_url) {
            $out .= '<span class="sf-crumb-sep" aria-hidden="true">/</span><a class="sf-crumb-pill" href="' . esc_url($cat_url) . '">' . text($cat->name) . '</a>';
        }
    }
    if (!is_wp_error($series_terms) && $series_terms && page_url('series')) {
        $st = $series_terms[0];
        $out .= '<span class="sf-crumb-sep" aria-hidden="true">/</span><a class="sf-crumb-pill sf-crumb-series" href="' . esc_url(page_url('series') . '#sf-series-' . $st->slug) . '">系列 · ' . text($st->name) . '</a>';
    }
    $out .= '</nav>';
    $out .= '<div class="sf-reader-actions">';
    $out .= '<div class="sf-font-controls" role="group" aria-label="正文字号调节"><button type="button" class="sf-tool-btn" data-sf-font="dec" title="缩小字号" aria-label="缩小字号">A-</button><button type="button" class="sf-tool-btn sf-font-indicator" data-sf-font="reset" data-sf-font-label title="重置默认字号" aria-label="重置默认字号">100%</button><button type="button" class="sf-tool-btn" data-sf-font="inc" title="放大字号" aria-label="放大字号">A+</button></div>';
    $out .= '<button type="button" class="sf-tool-btn" data-sf-copy-md data-post-title="' . esc_attr($post->post_title) . '" aria-label="复制全文 Markdown">复制 Markdown</button>';
    $out .= '<button type="button" class="sf-tool-btn" data-sf-share-post data-post-title="' . esc_attr($post->post_title) . '" aria-label="复制本文链接">分享链接</button>';
    $out .= '<span class="sf-sr-only" data-sf-toolbar-status role="status" aria-live="polite"></span>';
    $out .= '</div></div>';
    // Collapsible summary panel: only rendered when an explicit author-written excerpt exists. Never invent summary copy.
    $excerpt = trim((string)$post->post_excerpt);
    if ($excerpt !== '') {
        $out .= '<details class="sf-summary-panel sf-feature" open><summary><span class="sf-summary-label">文章摘要</span><span class="sf-summary-source">作者手记</span></summary><div class="sf-summary-body"><p>' . nl2br(text($excerpt)) . '</p></div></details>';
    }
    return $out;
}
function post_footer_discovery($post) {
    $all = public_posts(array('posts_per_page' => 50));
    $ids = wp_list_pluck($all, 'ID');
    $idx = array_search($post->ID, $ids, true);
    $newer = ($idx !== false && $idx > 0) ? $all[$idx - 1] : null;
    $older = ($idx !== false && $idx + 1 < count($all)) ? $all[$idx + 1] : null;
    $out = '';
    if ($newer || $older) {
        $out .= '<nav class="sf-post-pagination sf-feature" aria-label="文章翻页">';
        if ($newer) {
            $out .= '<a class="sf-pagination-card" data-dir="prev" rel="prev" href="' . esc_url(get_permalink($newer)) . '"><span class="sf-pagination-label">← 上一篇 · ' . text(get_the_date('Y.m.d', $newer)) . '</span><strong class="sf-pagination-title">' . text($newer->post_title) . '</strong></a>';
        } else {
            $out .= '<span class="sf-pagination-placeholder" aria-hidden="true"></span>';
        }
        if ($older) {
            $out .= '<a class="sf-pagination-card" data-dir="next" rel="next" href="' . esc_url(get_permalink($older)) . '"><span class="sf-pagination-label">下一篇 · ' . text(get_the_date('Y.m.d', $older)) . ' →</span><strong class="sf-pagination-title">' . text($older->post_title) . '</strong></a>';
        }
        $out .= '</nav>';
    }
    $pool = public_post_pool($post->ID);
    if (!$pool) { return $out; }
    $cats = wp_get_post_categories($post->ID);
    $related = array();
    foreach ($all as $cand) {
        if ((int)$cand->ID === (int)$post->ID) { continue; }
        if ($cats && array_intersect($cats, wp_get_post_categories($cand->ID))) {
            $c = get_the_category($cand->ID);
            $related[] = array('id' => (int)$cand->ID, 'title' => (string)$cand->post_title, 'url' => get_permalink($cand), 'cat' => $c ? (string)$c[0]->name : '文章', 'date' => get_the_date('Y.m.d', $cand));
        }
        if (count($related) >= 3) { break; }
    }
    foreach ($pool as $item) {
        if (count($related) >= 3) { break; }
        if (!in_array($item['id'], array_column($related, 'id'), true)) { $related[] = $item; }
    }
    $random_initial = array_slice($pool, 0, 3);
    $out .= '<section class="sf-discovery-grid sf-feature" aria-label="延伸阅读">';
    $out .= '<div class="sf-panel sf-discovery-card"><div class="sf-row"><h3>相关文章</h3><span class="sf-small sf-muted">同分类优先</span></div><ol class="sf-discovery-list">';
    foreach ($related as $r) {
        $out .= '<li><a href="' . esc_url($r['url']) . '">' . text($r['title']) . '</a><span class="sf-discovery-meta">' . text($r['cat'] . ' · ' . $r['date']) . '</span></li>';
    }
    $out .= '</ol></div>';
    $out .= '<div class="sf-panel sf-discovery-card" data-sf-random-box data-sf-posts-pool="' . esc_attr(wp_json_encode($pool)) . '"><div class="sf-row"><h3>随机漫游</h3><button type="button" class="sf-tool-btn sf-random-refresh" data-sf-random-refresh aria-label="换一批随机文章">换一批 ↻</button></div><ol class="sf-discovery-list" data-sf-random-list>';
    foreach ($random_initial as $r) {
        $out .= '<li><a href="' . esc_url($r['url']) . '">' . text($r['title']) . '</a><span class="sf-discovery-meta">' . text($r['cat'] . ' · ' . $r['date']) . '</span></li>';
    }
    $out .= '</ol></div></section>';
    return $out;
}
function transform_html($html) {
    $slug=is_page()?get_post_meta(get_queried_object_id(),'_sf_generated_page',true):'';
    if($slug&&isset(page_descriptions()[$slug])){
        $desc=page_descriptions()[$slug];
        $html=preg_replace_callback('/<meta\b[^>]*(?:name|property)=[\'"](description|og:description)[\'"][^>]*>/i',function($m)use($desc){return preg_replace_callback('/\bcontent=[\'"][^\'"]*[\'"]/i',function()use($desc){return 'content="'.esc_attr($desc).'"';},$m[0]);},$html);
    }
    if ((is_home() || is_front_page()) && !is_paged()) {
        $block = home_html(); if ($block) { $html = preg_replace_callback('/<main\b[^>]*\bid=[\'"]main[\'"][^>]*>/i', function($m) use($block){return $m[0] . $block;}, $html, 1); }
    }
    if (is_page('archives')) {
        $calendar = calendar_html();
        $html = preg_replace_callback('/<div\b[^>]*class=[\'"][^\'"]*\bpost-content\b[^\'"]*[\'"][^>]*>/i', function($m) use($calendar){return $m[0] . $calendar;}, $html, 1);
    }
    return $html;
}
add_filter('stillfloating_html_output', __NAMESPACE__ . '\\transform_html');
add_filter('the_content', function($content) {
    if (is_admin() || !is_singular('post') || !in_the_loop() || !is_main_query() || post_password_required()) { return $content; }
    $p=get_post(); return post_header_tools($p) . series_navigation($p->ID) . music_card($p, true) . $content . series_navigation($p->ID, true) . post_footer_discovery($p);
}, 18);
add_filter('body_class', function($classes){ if (is_singular() || is_archive()) { $classes[]='sf-reading-page'; } if(is_page()&&get_post_meta(get_queried_object_id(),'_sf_generated_page',true)){$classes[]='sf-hub-page';}return $classes; });
add_filter('wp_nav_menu_items', function($items, $args){
    $url=page_url('explore'); if (!$url || strpos($items,'sf-explore-menu')!==false) { return $items; }
    if (strpos($items,'leftbar-menu-item')!==false) { return $items . '<li class="leftbar-menu-item sf-explore-menu">' . link($url,'探索') . '</li>'; }
    if (strpos($items,'nav-link')!==false) { return $items . '<li class="nav-item sf-explore-menu">' . link($url,'探索','nav-link') . '</li>'; }
    return $items;
}, 20, 2);
add_action('wp_enqueue_scripts', function(){
    wp_enqueue_style('stillfloating-features', plugins_url('assets/features.css',__FILE__), array(), \StillFloating\Optimizations\VERSION);
    wp_enqueue_script('stillfloating-features', plugins_url('assets/features.js',__FILE__), array(), \StillFloating\Optimizations\VERSION, true);
}, 110);

function music_fields() { return array('track'=>'歌曲 / 专辑名','artist'=>'歌手 / 乐队','album'=>'专辑','year'=>'发行年份','genre'=>'风格','favorite'=>'推荐曲','note'=>'一句听感 / 笔记摘录'); }
add_action('add_meta_boxes', function(){
    add_meta_box('sf-note-details','系列与音乐信息',__NAMESPACE__.'\\post_metabox','post','normal','default');
    add_meta_box('sf-watch-details','观看信息',__NAMESPACE__.'\\watch_metabox','sf_watch','normal','default');
});
function post_metabox($post) {
    wp_nonce_field('sf_save_details','sf_details_nonce');
    echo '<p>系列请在右侧「文章系列」中选择；顺序数字越小越靠前。</p><p><label>系列内顺序 <input type="number" min="0" max="100000" name="sf_series_order" value="' . esc_attr(get_post_meta($post->ID,'_sf_series_order',true)) . '"></label></p>';
    echo '<p><label><input type="checkbox" name="sf_music_enabled" value="1" '.checked(get_post_meta($post->ID,'_sf_music_enabled',true),'1',false).'> 为这篇文章显示音乐信息卡</label></p><table class="form-table">';
    foreach(music_fields() as $key=>$label){$value=get_post_meta($post->ID,'_sf_music_'.$key,true);echo '<tr><th><label for="sf_music_'.$key.'">'.text($label).'</label></th><td>';
        if($key==='note'){echo '<textarea class="large-text" rows="3" id="sf_music_note" name="sf_music_note">'.esc_textarea($value).'</textarea>';}
        else {echo '<input class="regular-text" type="text" id="sf_music_'.$key.'" name="sf_music_'.$key.'" value="'.esc_attr($value).'">';}echo '</td></tr>';}
    $song_id=get_post_meta($post->ID,'_sf_music_song_id',true);
    echo '<input type="hidden" name="sf_music_song_id" value="'.esc_attr($song_id).'">';
    $associated=\StillFloating\Optimizations\music_song($song_id);
    $id=(int)get_post_meta($post->ID,'_sf_music_cover',true);
    echo '<tr><th>封面</th><td><input type="hidden" id="sf_music_cover" name="sf_music_cover" value="'.$id.'"><button type="button" class="button" id="sf_choose_cover">选择封面</button> <button type="button" class="button" id="sf_clear_cover">移除封面</button><div id="sf_cover_preview">'.($id?wp_get_attachment_image($id,'thumbnail'):($associated?song_cover($associated,'sf-editor-cover',96):'自动使用匹配歌曲的专辑封面')).'</div><p class="description">关联歌曲的专辑封面会自动显示，也可选择媒体库图片覆盖。</p></td></tr></table>';
}
function watch_metabox($post) {
    wp_nonce_field('sf_save_details','sf_details_nonce');$status=get_post_meta($post->ID,'_sf_watch_status',true);
    echo '<p><label>状态 <select name="sf_watch_status">';foreach(array('wish'=>'想看','watching'=>'在看','finished'=>'看完') as $key=>$label){echo '<option value="'.$key.'" '.selected($status,$key,false).'>'.$label.'</option>';}echo '</select></label></p>';
    echo '<p><label>评分（可留空）<input type="number" name="sf_watch_rating" min="0" max="10" step="0.1" value="'.esc_attr(get_post_meta($post->ID,'_sf_watch_rating',true)).'"></label></p><p><label>作品链接 <input type="url" class="large-text" name="sf_watch_url" value="'.esc_attr(get_post_meta($post->ID,'_sf_watch_url',true)).'"></label></p><p>正文可写简短感受；封面使用「特色图片」。发布后会出现在前台片单中。</p>';
}
add_action('save_post', function($id){
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE || wp_is_post_revision($id) || !isset($_POST['sf_details_nonce']) || !wp_verify_nonce(sanitize_text_field(wp_unslash($_POST['sf_details_nonce'])),'sf_save_details') || !current_user_can('edit_post',$id)) { return; }
    if(get_post_type($id)==='post'){
        if(isset($_POST['sf_music_song_id'])){$song_id=sanitize_text_field(wp_unslash($_POST['sf_music_song_id']));update_post_meta($id,'_sf_music_song_id',\StillFloating\Optimizations\music_song($song_id)?$song_id:'');}
        update_post_meta($id,'_sf_series_order',min(100000,absint($_POST['sf_series_order']??0)));
        update_post_meta($id,'_sf_music_enabled',isset($_POST['sf_music_enabled'])?'1':'0');
        foreach(music_fields() as $key=>$label){$raw=wp_unslash($_POST['sf_music_'.$key]??'');$value=$key==='note'?sanitize_textarea_field($raw):sanitize_text_field($raw);update_post_meta($id,'_sf_music_'.$key,limit_text($value,$key==='note'?500:200));}
        $cover=absint($_POST['sf_music_cover']??0);update_post_meta($id,'_sf_music_cover',$cover&&wp_attachment_is_image($cover)?$cover:0);
    } elseif(get_post_type($id)==='sf_watch'){
        $status=sanitize_key($_POST['sf_watch_status']??'wish');update_post_meta($id,'_sf_watch_status',in_array($status,array('wish','watching','finished'),true)?$status:'wish');
        $rating=wp_unslash($_POST['sf_watch_rating']??'');update_post_meta($id,'_sf_watch_rating',$rating!==''&&is_numeric($rating)?max(0,min(10,(float)$rating)):'');
        update_post_meta($id,'_sf_watch_url',esc_url_raw(wp_unslash($_POST['sf_watch_url']??''),array('http','https')));
    }
    \StillFloating\Optimizations\clear_cache();
});
function sanitize_settings($input) {
    $input=is_array($input)?$input:array();$valid=array_map('strval',wp_list_pluck(songs(),'id'));$ids=array();
    foreach((array)($input['recent_ids']??array()) as $id){$id=(string)$id;if(in_array($id,$valid,true)&&!in_array($id,$ids,true)&&count($ids)<3){$ids[]=$id;}}
    $out=array('recent_ids'=>$ids);foreach(array('doing','listening','next') as $key){$out[$key]=limit_text(sanitize_textarea_field($input[$key]??''),1000);}return $out;
}
add_action('admin_menu',function(){add_options_page('博客功能','博客功能','manage_options','sf-features',__NAMESPACE__.'\\settings_page');});
add_action('admin_init',function(){register_setting('sf_features','sf_features_settings',array('sanitize_callback'=>__NAMESPACE__.'\\sanitize_settings','type'=>'array'));});
add_action('update_option_sf_features_settings','StillFloating\\Optimizations\\clear_cache');
function settings_page() {
    if(!current_user_can('manage_options')){return;}$s=settings();
    echo '<div class="wrap"><h1>博客功能</h1><p>文章系列在「文章 → 文章系列」管理；音乐信息在文章编辑页填写；片单在左侧「片单」添加；友链使用现有的「链接」管理；图库继续使用 Modula。</p><form method="post" action="options.php">';settings_fields('sf_features');
    echo '<h2>首页最近在听</h2><p>最多选三首，来自现有播放器歌单；访客点击后才请求音频。</p>';
    for($i=0;$i<3;$i++){echo '<p><label>第 '.($i+1).' 首 <select name="sf_features_settings[recent_ids][]"><option value="">不显示</option>';foreach(songs() as $song){echo '<option value="'.esc_attr($song['id']).'" '.selected((string)($s['recent_ids'][$i]??''),(string)$song['id'],false).'>'.text($song['name'].' · '.$song['artist']).'</option>';}echo '</select></label></p>';}
    echo '<h2>近况</h2><p>留空的内容不会展示，最近更新列表自动使用已发布文章与碎碎念。</p><table class="form-table">';
    foreach(array('doing'=>'正在做','listening'=>'正在听','next'=>'接下来') as $key=>$label){echo '<tr><th><label for="sf_status_'.$key.'">'.$label.'</label></th><td><textarea id="sf_status_'.$key.'" class="large-text" rows="3" name="sf_features_settings['.$key.']">'.esc_textarea($s[$key]).'</textarea></td></tr>';}
    echo '</table>';submit_button();echo '</form><h2>页面入口</h2><ul>';foreach(page_specs() as $key=>$spec){$url=page_url($key);if($url){echo '<li>'.link($url,$spec[0]).'</li>';}}echo '</ul></div>';
}
add_action('admin_enqueue_scripts',function($hook){
    if(!in_array($hook,array('post.php','post-new.php'),true)||get_post_type()!=='post'){return;}
    wp_enqueue_media();wp_enqueue_script('sf-feature-admin',plugins_url('assets/admin.js',__FILE__),array('jquery'),\StillFloating\Optimizations\VERSION,true);
});
