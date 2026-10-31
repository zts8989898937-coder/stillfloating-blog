/* Still Floating: one lifecycle for PJAX, music, home decorations and shortcuts. */
(function () {
  'use strict';
  if (window.__sfRuntime) return;
  window.__sfRuntime = true;
  var node = document.getElementById('sf-config'), config;
  try { config = JSON.parse(node ? node.textContent : '{}'); } catch (_) { config = {}; }
  var songs = config.songs || [], pageSongs = config.pageSongs || {home:0,post:1,board:2,shuo:3,about:4};
  var idx = 0, wantPlay = false, audio, player, panel, nameEl, playButton, fill;
  var lastPath = '', lyrics = null, lyricsPromise, lyricTimer, typingTimer, lyricFade;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  function key(path) {
    var p = path || location.pathname;
    try { p = decodeURIComponent(p); } catch (_) {}
    if (/^\/(?:index\.php\/?)?$/.test(p)) return 'home';
    if (p.indexOf('留言板') !== -1) return 'board';
    if (p.indexOf('碎碎念') !== -1) return 'shuo';
    if (/^\/(?:index\.php\/)?(?:about|sample-page)\/?$/.test(p)) return 'about';
    return 'post';
  }
  function source(song) { return 'https://music.163.com/song/media/outer/url?id=' + song.id + '.mp3'; }
  function coverUrl(song,size){
    if(!song.cover||!/^https:\/\/p[0-9]+\.music\.126\.net\//.test(song.cover))return '';
    var url=new URL(song.cover);url.searchParams.set('param',size+'y'+size);return url.href;
  }
  function makeCover(song,size,className){
    var wrap=document.createElement('span');wrap.className=className;wrap.setAttribute('aria-hidden','true');wrap.textContent='♪';
    var url=coverUrl(song,size*2);if(!url)return wrap;
    var img=document.createElement('img');img.src=url;img.width=size;img.height=size;img.alt='';img.setAttribute('loading','lazy');img.setAttribute('decoding','async');img.referrerPolicy='no-referrer';img.onerror=function(){img.hidden=true;};wrap.appendChild(img);return wrap;
  }
  function renderPlaylist() {
    if(panel.querySelector('.mp-items'))return;
    panel.replaceChildren();
    var header=document.createElement('div');header.className='mp-search-header';
    var input=document.createElement('input');input.type='search';input.placeholder='搜索曲名或歌手';input.setAttribute('aria-label','搜索歌单');input.className='mp-search';
    var count=document.createElement('span');count.className='mp-count';count.setAttribute('role','status');
    var items=document.createElement('div');items.className='mp-items';
    var empty=document.createElement('p');empty.textContent='没有匹配的歌曲';empty.hidden=true;empty.className='mp-empty';
    header.append(input,count);panel.append(header,items,empty);
    songs.forEach(function(song,i){
      var button=document.createElement('button');button.type='button';button.className='mp-item';button.dataset.index=String(i);
      button.dataset.search=(song.name+' '+song.artist).toLocaleLowerCase();
      var title=document.createElement('span'),artist=document.createElement('span');title.textContent=song.name;artist.textContent=song.artist;artist.className='mp-a';
      var copy=document.createElement('span');copy.className='mp-copy';copy.append(title,artist);
      button.append(makeCover(song,36,'mp-list-cover'),copy);button.onclick=function(){choose(i,true);};
      var row=document.createElement('div');row.className='mp-row';row.appendChild(button);
      if(config.writeUrls&&config.writeUrls[song.id]){var write=document.createElement('a');write.className='mp-note-link no-pjax';write.href=config.writeUrls[song.id];write.textContent='✎';write.title='写音乐笔记';write.setAttribute('aria-label','为 '+song.name+' 写音乐笔记');row.appendChild(write);}
      items.appendChild(row);
    });
    function filter(){var q=input.value.trim().toLocaleLowerCase(),n=0;items.querySelectorAll('.mp-item').forEach(function(b){b.hidden=q!==''&&b.dataset.search.indexOf(q)===-1;if(b.parentElement.classList.contains('mp-row'))b.parentElement.hidden=b.hidden;if(!b.hidden)n++;});count.textContent=n+' / '+songs.length+' 首';empty.hidden=n!==0;}
    input.addEventListener('input',filter);filter();
  }
  function showSong(message) {
    if (!nameEl || !songs[idx]) return;
    nameEl.textContent = message || songs[idx].name + ' · ' + songs[idx].artist;
    renderPlaylist();
    var currentCover=player.querySelector('.mp-current-cover'),url=coverUrl(songs[idx],64);
    if(!currentCover){currentCover=makeCover(songs[idx],32,'mp-current-cover');player.prepend(currentCover);}
    var image=currentCover.querySelector('img');
    if(url&&(!image||image.getAttribute('src')!==url)){
      var replacement=makeCover(songs[idx],32,'mp-current-cover');currentCover.replaceWith(replacement);currentCover=replacement;
    }else if(!url&&image){image.remove();}
    currentCover.title=(songs[idx].album||songs[idx].name)+' 专辑封面';
    panel.querySelectorAll('.mp-item').forEach(function(b){var yes=Number(b.dataset.index)===idx;b.classList.toggle('cur',yes);b.setAttribute('aria-current',String(yes));});
    var external=document.getElementById('mp-source');
    if(!external){external=document.createElement('a');external.id='mp-source';external.textContent='↗';external.target='_blank';external.rel='noopener noreferrer';player.appendChild(external);}
    var writeUrl=config.writeUrls&&config.writeUrls[songs[idx].id],writeCurrent=document.getElementById('mp-write');
    if(writeUrl){if(!writeCurrent){writeCurrent=document.createElement('a');writeCurrent.id='mp-write';writeCurrent.textContent='✎';writeCurrent.className='no-pjax';player.appendChild(writeCurrent);}writeCurrent.href=writeUrl;writeCurrent.setAttribute('aria-label','为 '+songs[idx].name+' 写音乐笔记');writeCurrent.title='写音乐笔记';}else if(writeCurrent){writeCurrent.remove();}
    external.href='https://music.163.com/song?id='+songs[idx].id;external.title='在网易云打开当前歌曲';external.setAttribute('aria-label','在网易云打开 '+songs[idx].name);
  }
  function buttonState() {
    var playing = audio && !audio.paused;
    if (playButton) { playButton.textContent = playing ? '❚❚' : '▶'; playButton.setAttribute('aria-label', playing ? '暂停' : '播放'); }
    document.dispatchEvent(new CustomEvent('sf:player-state', {detail:{id:songs[idx] ? String(songs[idx].id) : '',playing:!!playing}}));
  }
  function play() {
    if (!audio || !songs[idx]) return;
    wantPlay = true;
    if (!audio.getAttribute('src')) audio.src = source(songs[idx]);
    var promise = audio.play();
    if (promise && promise.catch) promise.catch(function () {
      wantPlay = false; buttonState(); showSong('点击播放 · ' + songs[idx].name);
    });
  }
  function choose(i, autoplay) {
    idx = (i + songs.length) % songs.length; wantPlay = !!autoplay;
    audio.pause(); audio.removeAttribute('src'); audio.load(); fill.style.width = '0%';
    showSong(); if (autoplay) play();
  }
  function togglePanel() {
    panel.classList.toggle('open');
    var open = panel.classList.contains('open');
    document.getElementById('mp-list-btn').setAttribute('aria-expanded', String(open));
    shortcuts();
  }
  function bindPlayer() {
    var nextAudio = document.getElementById('mp-audio');
    if (!nextAudio || !songs.length) return;
    if (audio === nextAudio && audio.__sfBound) return;
    audio = nextAudio; audio.__sfBound = true; audio.preload = 'none';
    player = document.getElementById('mp-player'); panel = document.getElementById('mp-panel');
    nameEl = document.getElementById('mp-name'); fill = document.getElementById('mp-fill');
    playButton = document.getElementById('mp-play');
    if (!player || !panel || !nameEl || !fill || !playButton) return;
    player.setAttribute('aria-label', '音乐播放器');
    var actions = {'mp-prev':function(){choose(idx-1,true);},'mp-next':function(){choose(idx+1,true);},'mp-play':function(){if(audio.paused)play();else{wantPlay=false;audio.pause();}},'mp-list-btn':togglePanel};
    Object.keys(actions).forEach(function (id) { var b = document.getElementById(id); b.type = 'button'; b.onclick = actions[id]; b.setAttribute('aria-label', b.title); });
    var list = document.getElementById('mp-list-btn'); list.setAttribute('aria-controls','mp-panel'); list.setAttribute('aria-expanded','false');
    nameEl.setAttribute('role','button'); nameEl.tabIndex=0; nameEl.setAttribute('aria-label','打开歌单'); nameEl.onclick=togglePanel;
    nameEl.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();togglePanel();}};
    audio.addEventListener('ended',function(){choose(idx+1,true);});
    audio.addEventListener('error',function(){wantPlay=false;buttonState();showSong('无法播放 · 可前往网易云 ↗');audio.removeAttribute('src');});
    audio.addEventListener('play',buttonState); audio.addEventListener('pause',buttonState);
    audio.addEventListener('timeupdate',function(){if(audio.duration)fill.style.width=(audio.currentTime/audio.duration*100)+'%';});
    showSong(); buttonState();
  }
  function shortcuts() {
    var logged = document.body.classList.contains('logged-in');
    ['admin-quick','admin-dash'].forEach(function(id){
      var b=document.getElementById(id);
      if(!logged){if(b)b.remove();return;}
      if(!b){b=document.createElement('a');b.id=id;b.title=id==='admin-quick'?'去写文章':'进入后台';b.textContent=id==='admin-quick'?'✎':'⚙';document.body.appendChild(b);}
      b.href=id==='admin-dash'?'/wp-admin/':key()==='shuo'?'/wp-admin/post-new.php?post_type=shuoshuo':'/wp-admin/post-new.php';
      b.style.visibility=panel&&panel.classList.contains('open')?'hidden':'visible';
    });
  }
  function stopDecorations() {clearTimeout(typingTimer);clearInterval(lyricTimer);clearTimeout(lyricFade);typingTimer=null;lyricTimer=null;}
  function lyricData() {
    if(lyrics)return Promise.resolve(lyrics);
    if(!config.hasLyrics || !config.lyricsUrl)return Promise.resolve([]);
    if(!lyricsPromise)lyricsPromise=fetch(config.lyricsUrl,{credentials:'omit'}).then(function(r){if(!r.ok)throw new Error('lyrics');return r.json();}).then(function(data){lyrics=Array.isArray(data)?data:[];return lyrics;}).catch(function(){lyricsPromise=null;return [];});
    return lyricsPromise;
  }
  function startDecorations() {
    if (key() !== 'home' || document.hidden) return;
    var sub=document.querySelector('.banner-subtitle'); if(!sub)return;
    var sentences=['听歌、写代码，偶尔叽里咕噜或者咕咕嘎嘎。','Have a nice life','等到春暖艳阳天，你我就相见','Talk is cheap, but music is free.'];
    function typeStart(){
      if(key()!=='home'||document.hidden)return;
      if(sub.classList.contains('typing-effect')){typingTimer=setTimeout(typeStart,300);return;}
      if(reduced.matches){sub.textContent=sentences[0];return;}
      var i=0,n=sentences[0].length,deleting=true;sub.textContent=sentences[0];
      function tick(){
        if(key()!=='home'||document.hidden||!sub.isConnected)return;
        var text=sentences[i];n+=deleting?-1:1;sub.textContent=text.slice(0,Math.max(0,n));
        var delay=deleting?50:110;
        if(!deleting&&n>=text.length){deleting=true;delay=5000;}
        if(deleting&&n<=0){deleting=false;i=(i+1)%sentences.length;delay=650;}
        typingTimer=setTimeout(tick,delay);
      }
      typingTimer=setTimeout(tick,5000);
    }
    typingTimer=setTimeout(typeStart,1000);
    lyricData().then(function(groups){
      if(key()!=='home'||document.hidden||!sub.isConnected)return;
      var group=groups[new Date().getDay()];if(!group||!group.lines||!group.lines.length)return;
      var box=document.getElementById('banner-lyric');if(!box){box=document.createElement('div');box.id='banner-lyric';box.className='banner-lyric';sub.after(box);}
      var date=new Date().toLocaleDateString('sv-SE'),storageKey='sf-lyric-'+date+'-'+new Date().getDay(),position=0;
      try{position=Number(localStorage.getItem(storageKey))||0;}catch(_){}
      function hash(text){var h=1779033703^text.length;for(var i=0;i<text.length;i++){h=Math.imul(h^text.charCodeAt(i),3432918353);h=h<<13|h>>>19;}return h>>>0;}
      var seed=hash(date+group.name),order=group.lines.map(function(_,i){return i;});
      function random(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
      for(var i=order.length-1;i>0;i--){var j=Math.floor(random()*(i+1)),tmp=order[i];order[i]=order[j];order[j]=tmp;}
      function show(){
        var item=group.lines[order[position%order.length]];if(!item)return;
        var line=document.createElement('span'),artist=document.createElement('span');line.className='lyric-line';artist.className='lyric-artist';line.textContent='“'+item.t+'”';artist.textContent='— '+item.a;box.replaceChildren(line,artist);box.style.opacity="1";
        position++;try{localStorage.setItem(storageKey,String(position));}catch(_){}
      }
      show();clearInterval(lyricTimer);if(!reduced.matches)lyricTimer=setInterval(show,8000);
    });
  }
  var routeTimer;
  function route() {
    clearTimeout(routeTimer);
    routeTimer=setTimeout(function(){
      bindPlayer();shortcuts();
      var path=location.pathname;
      if(path!==lastPath){
        var target=pageSongs[key()];if(audio&&songs[target])choose(target,wantPlay);lastPath=path;
        stopDecorations();startDecorations();
      }
      document.dispatchEvent(new CustomEvent('sf:route'));
    },0);
  }
  var previous=window.pjaxLoaded;
  window.pjaxLoaded=function(){try{if(typeof previous==='function')previous.apply(this,arguments);}finally{route();}};
  if(window.jQuery)window.jQuery(document).on('pjax:complete.sf pjax:end.sf',route);
  document.addEventListener('pjax:complete',route);document.addEventListener('pjax:end',route);window.addEventListener('popstate',route);
  document.addEventListener('visibilitychange',function(){stopDecorations();if(!document.hidden)startDecorations();});
  document.addEventListener('click',function(e){if(panel&&panel.classList.contains('open')&&!e.target.closest('#mp-panel')&&!e.target.closest('#mp-player')){panel.classList.remove('open');document.getElementById('mp-list-btn').setAttribute('aria-expanded','false');shortcuts();}});
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&panel&&panel.classList.contains('open'))togglePanel();});
  document.addEventListener('sf:play-song',function(e){var id=e.detail&&String(e.detail.id),i=songs.findIndex(function(s){return String(s.id)===id;});if(i!==-1&&audio)choose(i,true);});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',route,{once:true});else route();
})();
