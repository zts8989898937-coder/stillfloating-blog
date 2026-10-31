<?php
namespace StillFloating\Optimizations;
if (!defined('ABSPATH')) { exit; }
// A local snapshot of the owner's shared playlist. No external requests on page load.
function playlist_data() {
    static $data = null;
    if ($data !== null) { return $data; }
    $data = array('name'=>'','url'=>'','tracks'=>array(),'defaults'=>array());
    $path = __DIR__ . '/data/playlist.json';
    $raw = is_readable($path) ? json_decode(file_get_contents($path), true) : null;
    if (!is_array($raw) || empty($raw['tracks']) || !is_array($raw['tracks'])) { return $data; }
    $seen = array();
    foreach ($raw['tracks'] as $track) {
        $id = isset($track['id']) ? (string)$track['id'] : '';
        if (!ctype_digit($id) || $id === '0' || isset($seen[$id]) || empty($track['name']) || empty($track['artist'])) { continue; }
        $seen[$id] = true;
        $cover = isset($track['cover']) ? (string)$track['cover'] : '';
        if (!preg_match('~^https://p[0-9]+\.music\.126\.net/[^\s]+$~D', $cover)) { $cover=''; }
        $data['tracks'][] = array('id'=>$id, 'name'=>(string)$track['name'], 'artist'=>(string)$track['artist'], 'album'=>isset($track['album'])?(string)$track['album']:'', 'cover'=>$cover, 'year'=>isset($track['year'])?(string)$track['year']:'');
    }
    $data['name'] = isset($raw['name']) ? (string)$raw['name'] : '';
    $data['url'] = isset($raw['url']) ? esc_url_raw($raw['url'], array('https')) : '';
    $data['defaults'] = isset($raw['defaults']) && is_array($raw['defaults']) ? $raw['defaults'] : array();
    return $data;
}
function playlist_indices($songs) {
    $ids = array_map('strval', array_column($songs, 'id')); $out = array();
    foreach (playlist_data()['defaults'] as $key=>$id) { $index=array_search((string)$id,$ids,true);$out[$key]=$index===false?0:$index; }
    return $out;
}

function playlist_cover_url($song, $size=120) {
    if (empty($song['cover'])) { return ''; }
    $size=max(32,min(600,(int)$size));
    return add_query_arg('param', $size . 'y' . $size, $song['cover']);
}
