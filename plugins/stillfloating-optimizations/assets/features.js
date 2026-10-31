(function(){
  'use strict';
  if(window.__sfFeatures)return;
  window.__sfFeatures=true;
  var readKey='sf-read-posts-v1',fontKey='sf-reader-font-scale-v1',read=[],fontScale=100,routeFrame=0,scrollFrame=0,copyTimer=0,toolTimer=0;
  var catalog=null,catalogHome=null,mobileDetails=null,observer=null,scrollHandler=null,resizeObs=null;
  var narrow=window.matchMedia('(max-width: 768px)');
  try{var saved=JSON.parse(localStorage.getItem(readKey)||'[]');if(Array.isArray(saved))read=saved.filter(function(x){return Number.isSafeInteger(x)&&x>0;}).slice(-1000);}catch(_){}
  try{var savedFont=Number(localStorage.getItem(fontKey));if(savedFont>=85&&savedFont<=135)fontScale=savedFont;}catch(_){}

  var ICON_OVERVIEW='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2ZM12 4C7.58172 4 4 7.58172 4 12C4 16.4183 7.58172 20 12 20C16.4183 20 20 16.4183 20 12C20 7.58172 16.4183 4 12 4ZM15.8329 7.33748C16.0697 7.17128 16.3916 7.19926 16.5962 7.40381C16.8002 7.60784 16.8267 7.92955 16.6587 8.16418C14.479 11.2095 13.2796 12.8417 13.0607 13.0607C12.4749 13.6464 11.5251 13.6464 10.9393 13.0607C10.3536 12.4749 10.3536 11.5251 10.9393 10.9393C11.3126 10.5661 12.9438 9.36549 15.8329 7.33748ZM17.5 11C18.0523 11 18.5 11.4477 18.5 12C18.5 12.5523 18.0523 13 17.5 13C16.9477 13 16.5 12.5523 16.5 12C16.5 11.4477 16.9477 11 17.5 11ZM6.5 11C7.05228 11 7.5 11.4477 7.5 12C7.5 12.5523 7.05228 13 6.5 13C5.94772 13 5.5 12.5523 5.5 12C5.5 11.4477 5.94772 11 6.5 11ZM8.81802 7.40381C9.20854 7.79433 9.20854 8.4275 8.81802 8.81802C8.4275 9.20854 7.79433 9.20854 7.40381 8.81802C7.01328 8.4275 7.01328 7.79433 7.40381 7.40381C7.79433 7.01328 8.4275 7.01328 8.81802 7.40381ZM12 5.5C12.5523 5.5 13 5.94772 13 6.5C13 7.05228 12.5523 7.5 12 7.5C11.4477 7.5 11 7.05228 11 6.5C11 5.94772 11.4477 5.5 12 5.5Z"/></svg>';
  var ICON_TOC='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M5.75024 3.5H4.71733L3.25 3.89317V5.44582L4.25002 5.17782L4.25018 8.5H3V10H7V8.5H5.75024V3.5ZM10 4H21V6H10V4ZM10 11H21V13H10V11ZM10 18H21V20H10V18ZM2.875 15.625C2.875 14.4514 3.82639 13.5 5 13.5C6.17361 13.5 7.125 14.4514 7.125 15.625C7.125 16.1106 6.96183 16.5587 6.68747 16.9167L6.68271 16.9229L5.31587 18.5H7V20H3.00012L2.99959 18.8786L5.4717 16.035C5.5673 15.9252 5.625 15.7821 5.625 15.625C5.625 15.2798 5.34518 15 5 15C4.67378 15 4.40573 15.2501 4.37747 15.5688L4.3651 15.875H2.875V15.625Z"/></svg>';
  var ICON_SERIES='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M20 22H4C3.44772 22 3 21.5523 3 21V3C3 2.44772 3.44772 2 4 2H20C20.5523 2 21 2.44772 21 3V21C21 21.5523 20.5523 22 20 22ZM19 20V4H5V20H19ZM7 6H11V10H7V6ZM7 12H17V14H7V12ZM7 16H17V18H7V16ZM13 7H17V9H13V7Z"/></svg>';
  var ICON_TOOLS='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="M3 4H21V6H3V4ZM3 19H21V21H3V19ZM11 14H21V16H11V14ZM11 9H21V11H11V9ZM7 12.5L3 9V16L7 12.5Z"/></svg>';
  var ICON_ARROW_LEFT='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="m10.828 12 4.95 4.95-1.414 1.415L8 12l6.364-6.364 1.414 1.414z"/></svg>';
  var ICON_ARROW_RIGHT='<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true"><path d="m13.172 12-4.95-4.95 1.414-1.415L16 12l-6.364 6.364-1.414-1.414z"/></svg>';
  var PETAL_SVG='<svg viewBox="0 0 20 24" width="12" height="14" aria-hidden="true"><defs><linearGradient id="sf-petal-grad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ffd6e2"/><stop offset="100%" stop-color="#ef7396"/></linearGradient></defs><path fill="url(#sf-petal-grad)" d="M10 24C4.6 20.4.4 14 1.3 7.9 2 3.3 5.4.6 8.7 1.3L10 4.1l1.3-2.8c3.3-.7 6.7 2 7.4 6.6.9 6.1-3.3 12.5-8.7 16.1Z"/></svg>';

  function paintRead(){
    document.querySelectorAll('[data-sf-read-toggle]').forEach(function(b){var yes=read.indexOf(Number(b.dataset.sfReadToggle))!==-1;b.setAttribute('aria-pressed',String(yes));b.textContent=yes?'已读 ✓':'标记已读';});
    document.querySelectorAll('[data-sf-read-item]').forEach(function(el){el.classList.toggle('sf-is-read',read.indexOf(Number(el.dataset.sfReadItem))!==-1);});
    document.querySelectorAll('[data-sf-tick-post]').forEach(function(el){
      var isRead=read.indexOf(Number(el.dataset.sfTickPost))!==-1;
      el.classList.toggle('sf-is-read',isRead);
      if(isRead)el.setAttribute('data-read','');else el.removeAttribute('data-read');
    });
    document.querySelectorAll('[data-sf-series-progress]').forEach(function(el){try{var ids=JSON.parse(el.dataset.postIds),n=ids.filter(function(x){return read.indexOf(Number(x))!==-1;}).length;el.textContent='已读 '+n+' / '+ids.length+' 篇';}catch(_){}});
    document.querySelectorAll('[data-sf-overview-read]').forEach(function(el){el.textContent='已读 '+read.length+' 篇';});
  }

  function applyFontScale(){
    var content=document.querySelector('#post_content');
    if(content&&document.querySelector('.sf-post-toolbar')){
      content.style.setProperty('--sf-post-font-scale',(fontScale/100).toFixed(2));
      content.classList.toggle('sf-custom-font-scale',fontScale!==100);
    }
    document.querySelectorAll('[data-sf-font-label]').forEach(function(el){el.textContent=fontScale+'%';});
  }

  function removeTransientUI(){
    ['sf-sider-head','sf-sider-series','sf-sider-footer-rail','sf-reading-progress','sf-mobile-drawer-btn','sf-mobile-drawer','sf-image-lightbox'].forEach(function(id){
      var el=document.getElementById(id);if(el)el.remove();
    });
    var createdTab=document.querySelector('#leftbar_tab_catalog[data-sf-created-catalog]');
    if(createdTab)createdTab.remove();
    var p2=document.getElementById('leftbar_part2_inner');
    if(p2){
      p2.classList.remove('sf-cos-sider-active');
      var nw=p2.querySelector('.nav-wrapper');
      if(nw)nw.hidden=false;
      var ov=document.getElementById('leftbar_tab_overview');
      var tools=document.getElementById('leftbar_tab_tools');
      if(tools)tools.classList.remove('active','show');
      if(ov&&!document.getElementById('leftbar_tab_catalog')){
        ov.classList.add('active','show');
        ov.hidden=false;
      }
    }
  }

  function restoreCatalog(){
    if(catalog&&catalogHome&&catalogHome.isConnected)catalogHome.replaceWith(catalog);
    else if(catalogHome&&catalogHome.isConnected)catalogHome.remove();
    if(mobileDetails&&mobileDetails.isConnected)mobileDetails.remove();
    if(catalog)catalog.hidden=false;
    catalog=null;catalogHome=null;mobileDetails=null;
  }

  function cleanup(){
    restoreCatalog();
    removeTransientUI();
    if(observer)observer.disconnect();observer=null;
    if(resizeObs)resizeObs.disconnect();resizeObs=null;
    if(scrollHandler)window.removeEventListener('scroll',scrollHandler);scrollHandler=null;
    cancelAnimationFrame(scrollFrame);clearTimeout(copyTimer);clearTimeout(toolTimer);
  }

  function arrangeCatalog(){
    if(!narrow.matches){restoreCatalog();return;}
    if(catalog&&catalog.isConnected)return;
    var box=document.querySelector('#leftbar_catalog'),content=document.querySelector('#post_content');
    if(!box||!content||!box.querySelector('a'))return;
    box.hidden=false;
    catalog=box;catalogHome=document.createElement('span');catalogHome.hidden=true;catalogHome.className='sf-catalog-home';box.before(catalogHome);
    mobileDetails=document.createElement('details');mobileDetails.className='sf-mobile-toc sf-feature';
    var summary=document.createElement('summary');summary.textContent='本页目录';mobileDetails.appendChild(summary);mobileDetails.appendChild(box);
    mobileDetails.addEventListener('click',function(e){if(e.target.closest('a'))mobileDetails.open=false;},true);
    mobileDetails.addEventListener('toggle',function(){if(mobileDetails&&mobileDetails.open&&scrollHandler)requestAnimationFrame(scrollHandler);});
    content.prepend(mobileDetails);
  }

  function resolveSeriesData(){
    var nav=document.querySelector('.sf-series-nav[data-sf-series-name]');
    if(nav){
      var items=[];
      var currentId=0;
      nav.querySelectorAll('.sf-series-list > li').forEach(function(li){
        var a=li.querySelector('a');if(!a)return;
        var pid=Number(li.getAttribute('data-sf-read-item'))||0;
        var isCur=li.getAttribute('aria-current')==='page';
        if(isCur&&pid)currentId=pid;
        items.push({id:pid,title:a.textContent.trim(),url:a.href,current:isCur});
      });
      if(items.length){
        return {name:nav.dataset.sfSeriesName||'文章系列',url:nav.dataset.sfSeriesUrl||'/series/',currentId:currentId,items:items};
      }
    }
    var toolbar=document.querySelector('.sf-post-toolbar[data-sf-sider-series]');
    if(toolbar){
      try{
        var parsed=JSON.parse(toolbar.dataset.sfSiderSeries||'null');
        if(parsed&&Array.isArray(parsed.items)&&parsed.items.length){
          parsed.items.forEach(function(it){it.current=Number(it.id)===Number(parsed.currentId);});
          return parsed;
        }
      }catch(_){}
    }
    var rbox=document.querySelector('[data-sf-random-box][data-sf-posts-pool], [data-sf-posts-pool]');
    if(rbox){
      try{
        var pool=JSON.parse(rbox.dataset.sfPostsPool||'[]');
        var isSingle=document.body.classList.contains('single-post')||!!document.querySelector('.sf-post-toolbar');
        var postEl=isSingle?document.querySelector('article[id^="post-"]'):null;
        var curId=postEl?Number(postEl.id.replace('post-','')):0;
        var curTitleEl=isSingle?document.querySelector('.post-title'):null;
        var curTitle=curTitleEl?curTitleEl.textContent.trim():'';
        var crumb=document.querySelector('.sf-crumb-pill:not(.sf-crumb-series)');
        var curCat=crumb?crumb.textContent.trim():'';
        var curUrl=location.href.split('#')[0];
        var combined=isSingle&&curTitle?[{id:curId,title:curTitle,url:curUrl,cat:curCat,current:true}]:[];
        pool.forEach(function(p,idx){
          if(p&&p.url&&Number(p.id)!==curId){
            combined.push({id:Number(p.id)||0,title:p.title,url:p.url,cat:p.cat||'',current:!isSingle&&idx===0});
          }
        });
        var sameCat=curCat?combined.filter(function(x){return x.cat===curCat;}):[];
        var finalItems=sameCat.length>=2?sameCat:combined;
        if(finalItems.length>=2){
          return {name:sameCat.length>=2?curCat:'近期文章',url:(crumb&&crumb.href)||'/archives/',currentId:curId||(finalItems[0]?finalItems[0].id:0),items:finalItems};
        }
      }catch(_){}
    }
    var homePreviews=Array.from(document.querySelectorAll('article.post-preview .post-title[href]'));
    if(homePreviews.length>=2){
      var previewItems=homePreviews.map(function(a,idx){
        var art=a.closest('article[id^="post-"]');
        var pid=art?Number(art.id.replace('post-',''))||0:0;
        return {id:pid,title:a.textContent.trim(),url:a.href,current:idx===0};
      });
      return {name:'近期文章',url:'/archives/',currentId:previewItems[0].id,items:previewItems};
    }
    return null;
  }

  function buildSeriesThread(seriesData,isDrawer){
    if(!seriesData||!seriesData.items||!seriesData.items.length)return null;
    var wrap=document.createElement('div');
    wrap.id=isDrawer?'sf-drawer-series':'sf-sider-series';
    wrap.className='sf-sider-series sf-feature';
    var header=document.createElement('div');
    header.className='sf-sider-series-head';
    var title=document.createElement('a');
    title.className='sf-sider-series-title';
    title.href=seriesData.url||'/series/';
    title.textContent=seriesData.name||'文章系列';
    var count=document.createElement('span');
    count.className='sf-small sf-muted';
    count.textContent='共 '+seriesData.items.length+' 篇';
    header.append(title,count);
    var search=document.createElement('input');
    search.type='search';
    search.className='sf-thread-search';
    search.setAttribute('data-sf-thread-search','');
    search.placeholder='筛选本专栏文章…';
    search.setAttribute('aria-label','筛选本专栏文章');
    var list=document.createElement('div');
    list.className='sf-series-thread series-thread';
    seriesData.items.forEach(function(it,idx){
      var item=document.createElement('a');
      item.href=it.url;
      item.className=(isDrawer?'sf-drawer-thread-item':'sf-thread-item')+' series-thread-item';
      if(it.id)item.setAttribute('data-sf-read-item',String(it.id));
      if(it.current)item.setAttribute('aria-current','page');
      item.setAttribute('data-sf-search',(idx+1)+' '+it.title);
      var bead=document.createElement('span');bead.className='sf-thread-bead series-thread-bead';bead.setAttribute('aria-hidden','true');
      var text=document.createElement('span');text.className='sf-thread-title series-thread-title';text.textContent=it.title;
      item.append(bead,text);
      list.appendChild(item);
    });
    var empty=document.createElement('p');
    empty.className='sf-small sf-muted';
    empty.setAttribute('data-sf-thread-empty','');
    empty.hidden=true;
    empty.textContent='未找到匹配章节';
    wrap.append(header,search,list,empty);
    return wrap;
  }

  function buildFooterSeriesRail(seriesData,idSuffix){
    if(!seriesData||!seriesData.items||!seriesData.items.length)return null;
    var items=seriesData.items,count=items.length;
    var curIdx=items.findIndex(function(x){return x.current;});
    if(curIdx===-1)curIdx=0;
    var curNum=curIdx+1;
    var defaultCountText='第 '+curNum+' / '+count+' 篇';
    var defaultPreviewText=defaultCountText+' · '+items[curIdx].title;
    var nav=document.createElement('nav');
    if(!idSuffix)nav.id='sf-sider-footer-rail';
    nav.className='sf-cos-series-progress series-progress sf-feature';
    nav.setAttribute('aria-label',(seriesData.name||'专栏')+'进度导航');
    nav.setAttribute('data-sf-series-rail-box','');
    nav.setAttribute('data-default-preview',defaultPreviewText);

    var meta=document.createElement('div');
    meta.className='sf-cos-series-meta series-progress-meta';
    var defRow=document.createElement('div');
    defRow.className='sf-cos-series-default series-progress-default';
    var nameLink=document.createElement('a');
    nameLink.className='sf-cos-series-name series-progress-name';
    nameLink.href=seriesData.url||'/series/';
    nameLink.textContent=seriesData.name||'专栏';
    var countSpan=document.createElement('span');
    countSpan.className='sf-cos-series-count series-progress-count';
    countSpan.textContent=defaultCountText;
    defRow.append(nameLink,countSpan);

    var prevRow=document.createElement('div');
    prevRow.className='sf-cos-series-preview series-progress-preview';
    prevRow.setAttribute('aria-hidden','true');
    var prevLabel=document.createElement('span');
    prevLabel.className='sf-cos-preview-label series-progress-preview-label';
    prevLabel.textContent=curNum+' / '+count;
    var prevTitle=document.createElement('span');
    prevTitle.className='sf-cos-preview-title series-progress-preview-title';
    prevTitle.setAttribute('data-sf-cos-preview-title','');
    prevTitle.textContent=items[curIdx].title;
    prevRow.append(prevLabel,prevTitle);
    meta.append(defRow,prevRow);

    var track=document.createElement('div');
    track.className='sf-cos-series-track series-progress-track';
    if(curIdx>0){
      var prevA=document.createElement('a');
      prevA.className='sf-cos-series-arrow series-progress-arrow';
      prevA.href=items[curIdx-1].url;
      prevA.setAttribute('data-dir','prev');
      prevA.setAttribute('data-sf-tick-label','上一篇');
      prevA.setAttribute('data-sf-tick-title',items[curIdx-1].title);
      prevA.setAttribute('aria-label','上一篇：'+items[curIdx-1].title);
      prevA.innerHTML=ICON_ARROW_LEFT;
      track.appendChild(prevA);
    }else{
      var prevDis=document.createElement('span');
      prevDis.className='sf-cos-series-arrow series-progress-arrow sf-is-disabled';
      prevDis.setAttribute('aria-hidden','true');
      prevDis.innerHTML=ICON_ARROW_LEFT;
      track.appendChild(prevDis);
    }

    var ol=document.createElement('ol');
    ol.className='sf-cos-series-rail series-progress-rail';
    ol.style.setProperty('--tick-count',String(count));
    items.forEach(function(it,idx){
      var li=document.createElement('li');
      var a=document.createElement('a');
      var shortLabel=(idx+1)+' / '+count;
      var fullLabel='第 '+(idx+1)+' / '+count+' 篇';
      a.className='sf-cos-series-tick series-progress-tick';
      a.href=it.url;
      if(it.id)a.setAttribute('data-sf-tick-post',String(it.id));
      a.setAttribute('data-sf-tick-short',shortLabel);
      a.setAttribute('data-sf-tick-label',fullLabel);
      a.setAttribute('data-sf-tick-title',it.title);
      a.setAttribute('data-sf-tick-index',String(idx));
      if(it.current)a.setAttribute('aria-current','page');
      a.setAttribute('aria-label',fullLabel+' '+it.title);
      var mark=document.createElement('span');
      mark.className='sf-cos-series-mark series-progress-mark series-progress-major';
      mark.setAttribute('aria-hidden','true');
      a.appendChild(mark);
      li.appendChild(a);
      ol.appendChild(li);
    });
    track.appendChild(ol);

    if(curIdx+1<count){
      var nextA=document.createElement('a');
      nextA.className='sf-cos-series-arrow series-progress-arrow';
      nextA.href=items[curIdx+1].url;
      nextA.setAttribute('data-dir','next');
      nextA.setAttribute('data-sf-tick-label','下一篇');
      nextA.setAttribute('data-sf-tick-title',items[curIdx+1].title);
      nextA.setAttribute('aria-label','下一篇：'+items[curIdx+1].title);
      nextA.innerHTML=ICON_ARROW_RIGHT;
      track.appendChild(nextA);
    }else{
      var nextDis=document.createElement('span');
      nextDis.className='sf-cos-series-arrow series-progress-arrow sf-is-disabled';
      nextDis.setAttribute('aria-hidden','true');
      nextDis.innerHTML=ICON_ARROW_RIGHT;
      track.appendChild(nextDis);
    }

    nav.append(meta,track);
    return nav;
  }

  function ensureLeftbarCatalogBox(){
    var box=document.getElementById('leftbar_catalog');
    var content=document.getElementById('post_content');
    if(box||!content||document.body.classList.contains('sf-hub-page'))return box;
    var isPostPage=document.body.classList.contains('single-post')||!!document.querySelector('.sf-post-toolbar, .sf-series-nav');
    if(!isPostPage)return null;
    var p2=document.getElementById('leftbar_part2_inner');
    if(!p2)return null;
    var tabContent=p2.querySelector('.tab-content');
    if(!tabContent)return null;
    var tabPane=document.createElement('div');
    tabPane.className='tab-pane fade';
    tabPane.id='leftbar_tab_catalog';
    tabPane.setAttribute('role','tabpanel');
    tabPane.setAttribute('data-sf-created-catalog','true');
    box=document.createElement('div');
    box.id='leftbar_catalog';
    tabPane.appendChild(box);
    tabContent.prepend(tabPane);
    return box;
  }

  function cleanHeadingText(raw){
    return (raw||'').replace(/#$/,'').replace(/[:：]\s*$/,'').trim();
  }

  function assignAnchorId(el,text,idx,used){
    if(el.id){used[el.id]=true;return el.id;}
    var slug=text.toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g,'-').replace(/^-+|-+$/g,'')||('section-'+(idx+1));
    if(used[slug]||document.getElementById(slug))slug=slug+'-'+(idx+1);
    used[slug]=true;
    el.id=slug;
    return slug;
  }

  function collectArticleHeadings(content,box){
    var used={};
    var list=[];
    if(box){
      box.querySelectorAll('a').forEach(function(a){
        if(!a.textContent.trim()&&a.closest('li'))a.closest('li').hidden=true;
      });
    }
    var candidates=Array.from(content.querySelectorAll('h1, h2, h3, h4, p')).filter(function(el){
      return !el.closest('.sf-feature');
    });
    var hasNativeHeadings=false;
    content.querySelectorAll('h1, h2, h3, h4').forEach(function(h){
      if(!h.closest('.sf-feature')&&cleanHeadingText(h.textContent))hasNativeHeadings=true;
    });

    candidates.forEach(function(el,idx){
      var tag=el.tagName?el.tagName.toLowerCase():'';
      if(/^h[1-4]$/.test(tag)){
        var hText=cleanHeadingText(el.textContent);
        if(!hText)return;
        var hLevel=Number(tag.slice(1));
        assignAnchorId(el,hText,idx,used);
        list.push({el:el,id:el.id,text:hText,level:hLevel});
        return;
      }
      if(tag==='p'){
        var raw=(el.textContent||'').trim();
        if(!raw||raw.length>42||/^[─—\-=_*]{3,}$/.test(raw))return;
        var isLarge=el.classList.contains('has-large-font-size');
        var isPart=/^(?:第[一二三四五六七八九十百0-9]+(?:部分|章节|章|节|篇|幕)|整体解读|总结|前言|引言|后记|附录)(?:[：:.\s—\-]|$)/u.test(raw);
        var isBracket=/^【([^】]{1,18})】$/u.exec(raw);
        var isStep=!hasNativeHeadings&&/^[1-9][.、]\s*\S.{1,28}$/u.test(raw);
        if(isLarge||isPart){
          var pText=cleanHeadingText(raw);
          assignAnchorId(el,pText,idx,used);
          list.push({el:el,id:el.id,text:pText,level:2});
        }else if(isBracket){
          var bText=isBracket[1].trim();
          assignAnchorId(el,bText,idx,used);
          list.push({el:el,id:el.id,text:bText,level:3});
        }else if(isStep){
          assignAnchorId(el,raw,idx,used);
          list.push({el:el,id:el.id,text:raw,level:3});
        }
      }
    });

    if(!list.length&&box){
      var existingLinks=Array.from(box.querySelectorAll('a')).filter(function(a){return a.hash&&a.textContent.trim();});
      existingLinks.forEach(function(a,idx){
        var id;try{id=decodeURIComponent(a.hash.slice(1));}catch(_){id=a.hash.slice(1);}
        var target=document.getElementById(id);
        if(target&&content.contains(target)&&target.textContent.trim()){
          list.push({el:target,id:target.id,text:cleanHeadingText(target.textContent),level:Number((target.tagName||'H2').slice(1))||2});
        }
      });
    }

    if(!list.length){
      var pre=content.querySelector('pre');
      var postTitleEl=document.querySelector('.post-title');
      var baseTitle=postTitleEl?cleanHeadingText(postTitleEl.textContent):'正文概览';
      if(pre){
        var codeWrap=pre.closest('.sf-code-wrap')||pre;
        assignAnchorId(codeWrap,baseTitle,0,used);
        list.push({el:codeWrap,id:codeWrap.id,text:baseTitle,level:2});
        var codeText=pre.textContent||'';
        var fnMatches=codeText.match(/\b(?:void|int|bool|double|string|auto)\s+([a-zA-Z_]\w*)\s*\(/g)||[];
        fnMatches.slice(0,4).forEach(function(sig){
          var fnName=sig.replace(/\s*\($/,'').trim();
          list.push({el:codeWrap,id:codeWrap.id,text:fnName+'()',level:3});
        });
      }else{
        var paras=Array.from(content.querySelectorAll('p')).filter(function(p){return !p.closest('.sf-feature')&&(p.textContent||'').trim().length>0;});
        if(paras.length){
          assignAnchorId(paras[0],'开篇',0,used);
          list.push({el:paras[0],id:paras[0].id,text:baseTitle,level:2});
          if(paras.length>=4){
            var mid=paras[Math.floor(paras.length/2)];
            assignAnchorId(mid,'section-mid',1,used);
            list.push({el:mid,id:mid.id,text:'中段记录',level:3});
            var last=paras[paras.length-1];
            assignAnchorId(last,'section-end',2,used);
            list.push({el:last,id:last.id,text:'结语思考',level:3});
          }
        }
      }
    }

    var minLevel=list.reduce(function(m,x){return Math.min(m,x.level);},6);
    var tree=[],stack=[];
    list.forEach(function(item){
      var depth=Math.max(0,Math.min(2,item.level-minLevel));
      var node={el:item.el,id:item.id,text:item.text,level:item.level,depth:depth,children:[],parent:null};
      while(stack.length&&stack[stack.length-1].depth>=depth)stack.pop();
      if(!stack.length){
        node.depth=0;
        tree.push(node);
      }else{
        node.parent=stack[stack.length-1];
        node.depth=node.parent.depth+1;
        node.parent.children.push(node);
      }
      stack.push(node);
    });
    return {flat:list,tree:tree};
  }

  function buildSilkRibbonPath(pts){
    var xs=[],ys=[],lens=[],cmds=[];
    var cornerR=6,tailPad=4,samples=8;
    function pushPt(x,y){
      var last=xs.length-1;
      lens.push(last<0?0:lens[last]+Math.hypot(x-xs[last],y-ys[last]));
      xs.push(x);ys.push(y);
    }
    function lineTo(x,y){cmds.push('L '+x+' '+y);pushPt(x,y);}
    function quadTo(cx,cy,x,y){
      cmds.push('Q '+cx+' '+cy+' '+x+' '+y);
      var x0=xs[xs.length-1],y0=ys[ys.length-1];
      for(var s=1;s<=samples;s++){
        var t=s/samples,inv=1-t;
        pushPt(inv*inv*x0+2*inv*t*cx+t*t*x,inv*inv*y0+2*inv*t*cy+t*t*y);
      }
    }
    if(pts.length){
      cmds.push('M '+pts[0].x+' '+pts[0].top);
      pushPt(pts[0].x,pts[0].top);
    }
    for(var i=1;i<pts.length;i++){
      var prev=pts[i-1],cur=pts[i],dx=cur.x-prev.x;
      if(Math.abs(dx)<0.5)continue;
      var lastY=ys[ys.length-1];
      var midY=Math.max((prev.bottom+Math.max(cur.top,prev.bottom))/2,lastY);
      var u=Math.min(cornerR,Math.abs(dx)/2,Math.max(0,midY-lastY));
      var dir=dx>0?1:-1;
      lineTo(prev.x,midY-u);
      if(u>0.5){
        quadTo(prev.x,midY,prev.x+dir*u,midY);
        lineTo(cur.x-dir*u,midY);
        quadTo(cur.x,midY,cur.x,midY+u);
      }else{
        lineTo(cur.x,midY);
      }
    }
    if(pts.length){
      var lastPt=pts[pts.length-1];
      lineTo(lastPt.x,Math.max(lastPt.bottom,ys[ys.length-1])+tailPad);
    }
    var totalLen=lens.length?lens[lens.length-1]:0;
    function bsearch(arr,val){
      var lo=0,hi=arr.length-1;
      while(lo<hi){var mid=(lo+hi)>>1;if(arr[mid]<val)lo=mid+1;else hi=mid;}
      return lo;
    }
    function pointAt(dist){
      if(!xs.length)return {x:11,y:16};
      var idx=bsearch(lens,dist);
      if(idx===0||lens[idx]<dist)return {x:xs[idx],y:ys[idx]};
      var seg=lens[idx]-lens[idx-1],r=seg>0?(dist-lens[idx-1])/seg:1;
      return {x:xs[idx-1]+(xs[idx]-xs[idx-1])*r,y:ys[idx-1]+(ys[idx]-ys[idx-1])*r};
    }
    function lengthAtY(y){
      if(!ys.length)return 0;
      var idx=bsearch(ys,y);
      if(idx===0||ys[idx]<y)return lens[idx];
      var seg=ys[idx]-ys[idx-1],r=seg>0?(y-ys[idx-1])/seg:0;
      return lens[idx-1]+(lens[idx]-lens[idx-1])*r;
    }
    return {
      d:cmds.join(' '),
      length:totalLen,
      starts:pts.map(function(p){return lengthAtY(p.top);}),
      ends:pts.map(function(p){return lengthAtY(p.bottom);}),
      pointAt:pointAt,
      lengthAtY:lengthAtY
    };
  }

  function renderSilkTocInto(container,tree,gradId){
    var hadHiddenLi=!!container.querySelector('li[hidden]')||Array.from(container.querySelectorAll('li > a')).some(function(a){return !a.textContent.trim();});
    container.replaceChildren();
    container.classList.add('sf-toc-thread','sf-cos-toc','toc-silk-container');
    container.setAttribute('data-toc-live','true');

    var svgNS='http://www.w3.org/2000/svg';
    var svg=document.createElementNS(svgNS,'svg');
    svg.setAttribute('class','sf-cos-ribbon toc-ribbon');
    svg.setAttribute('aria-hidden','true');
    var defs=document.createElementNS(svgNS,'defs');
    var grad=document.createElementNS(svgNS,'linearGradient');
    grad.setAttribute('id',gradId);
    grad.setAttribute('gradientUnits','userSpaceOnUse');
    grad.setAttribute('x1','0');grad.setAttribute('y1','0');grad.setAttribute('x2','0');grad.setAttribute('y2','100%');
    var stop1=document.createElementNS(svgNS,'stop');stop1.setAttribute('offset','0%');stop1.setAttribute('class','toc-ribbon-start');
    var stop2=document.createElementNS(svgNS,'stop');stop2.setAttribute('offset','100%');stop2.setAttribute('class','toc-ribbon-end');
    grad.append(stop1,stop2);defs.appendChild(grad);
    var threadPath=document.createElementNS(svgNS,'path');
    threadPath.setAttribute('class','sf-cos-ribbon-thread toc-ribbon-thread');
    var tailPath=document.createElementNS(svgNS,'path');
    tailPath.setAttribute('class','sf-cos-ribbon-tail toc-ribbon-tail');
    tailPath.setAttribute('stroke','url(#'+gradId+')');
    svg.append(defs,threadPath,tailPath);

    var wash=document.createElement('span');
    wash.className='sf-cos-wash toc-wash';
    wash.setAttribute('aria-hidden','true');

    var petal=document.createElement('span');
    petal.className='sf-cos-petal toc-petal';
    petal.setAttribute('aria-hidden','true');
    petal.innerHTML=PETAL_SVG;

    var treeRoot=document.createElement('div');
    treeRoot.className='sf-cos-tree';

    var autoCollapse=tree.length>=2;
    function buildNodes(nodes,parentEl){
      nodes.forEach(function(node,idx){
        var item=document.createElement('div');
        item.className='heading-tree-item';
        item.setAttribute('data-depth',String(node.depth));
        item.setAttribute('data-tree-id',node.id);
        item.style.setProperty('--toc-depth',String(node.depth));

        var row=document.createElement('div');
        row.className='toc-heading-row';
        var a=document.createElement('a');
        a.href='#'+encodeURIComponent(node.id);
        a.className='silk-heading-link index-link';
        a.setAttribute('data-level',String(node.level));
        a.setAttribute('data-depth',String(node.depth));
        a.setAttribute('data-toc-row',node.id);
        var dot=document.createElement('span');
        dot.className='toc-node sf-cos-node';
        dot.setAttribute('aria-hidden','true');
        var txt=document.createElement('span');
        txt.className='heading-text';
        txt.textContent=node.text;
        a.append(dot,txt);
        row.appendChild(a);
        item.appendChild(row);

        if(node.children&&node.children.length){
          var childrenWrap=document.createElement('div');
          childrenWrap.className='heading-children silk-heading-children';
          if(!autoCollapse||idx===0)childrenWrap.setAttribute('data-open','true');
          var childrenInner=document.createElement('div');
          childrenInner.className='heading-children-inner silk-heading-children-inner';
          buildNodes(node.children,childrenInner);
          childrenWrap.appendChild(childrenInner);
          item.appendChild(childrenWrap);
        }
        parentEl.appendChild(item);
      });
    }
    buildNodes(tree,treeRoot);
    container.append(svg,wash,petal,treeRoot);
    if(hadHiddenLi){
      var hiddenList=document.createElement('ul');
      hiddenList.hidden=true;
      hiddenList.style.display='none';
      var hiddenLi=document.createElement('li');
      hiddenLi.hidden=true;
      hiddenList.appendChild(hiddenLi);
      container.appendChild(hiddenList);
    }

    function syncRibbon(activeIdx,sectionProgress,flatPairs){
      var topRootId=null;
      if(flatPairs[activeIdx]){
        var curH=flatPairs[activeIdx].h;
        var curId=curH?curH.id:'';
        tree.forEach(function(rootNode){
          if(rootNode.id===curId)topRootId=rootNode.id;
          rootNode.children.forEach(function(c){
            if(c.id===curId)topRootId=rootNode.id;
            if(c.children)c.children.forEach(function(gc){if(gc.id===curId)topRootId=rootNode.id;});
          });
        });
      }
      if(autoCollapse&&topRootId){
        var openTargetId=topRootId;
        var activeRootNode=tree.find(function(n){return n.id===topRootId;});
        if(activeRootNode&&(!activeRootNode.children||!activeRootNode.children.length)){
          var firstWithChildren=tree.find(function(n){return n.children&&n.children.length>0;});
          if(firstWithChildren)openTargetId=firstWithChildren.id;
        }
        container.querySelectorAll(':scope > .sf-cos-tree > .heading-tree-item').forEach(function(topItem){
          var ch=topItem.querySelector(':scope > .silk-heading-children');
          if(!ch)return;
          var isOpen=topItem.getAttribute('data-tree-id')===openTargetId;
          if(isOpen)ch.setAttribute('data-open','true');
          else ch.removeAttribute('data-open');
        });
      }

      var rows=[];
      var pts=[];
      var allLinks=Array.from(container.querySelectorAll('.silk-heading-link[data-toc-row]'));
      var fallbackY=0;
      allLinks.forEach(function(a){
        var closedParent=a.closest('.silk-heading-children:not([data-open])');
        if(closedParent)return;
        var depth=Number(a.getAttribute('data-depth'))||0;
        var x=11+depth*16;
        var y=0,el=a;
        while(el&&el!==container){y+=el.offsetTop||0;el=el.offsetParent;}
        var h=a.offsetHeight||0;
        if(h<4){y=fallbackY;h=32;}
        fallbackY=y+h+2;
        rows.push(a);
        pts.push({x:x,top:y,bottom:y+h,mid:y+h/2});
      });

      var geom=buildSilkRibbonPath(pts);
      threadPath.setAttribute('d',geom.d);
      tailPath.setAttribute('d',geom.d);
      tailPath.setAttribute('pathLength',String(geom.length||1));
      tailPath.style.strokeDasharray=String(geom.length||1);
      var svgW=container.clientWidth||240;
      var svgH=geom.length?Math.ceil(geom.pointAt(geom.length).y+8):Math.max(120,fallbackY);
      svg.setAttribute('width',String(svgW));
      svg.setAttribute('height',String(svgH));
      grad.setAttribute('y2',String(svgH));

      var activeId=flatPairs[activeIdx]&&flatPairs[activeIdx].h?flatPairs[activeIdx].h.id:'';
      var visIdx=rows.findIndex(function(r){return r.getAttribute('data-toc-row')===activeId;});
      if(visIdx===-1&&topRootId){
        visIdx=rows.findIndex(function(r){return r.getAttribute('data-toc-row')===topRootId;});
      }
      if(visIdx===-1)visIdx=0;

      if(pts[visIdx]&&geom.length>0){
        var startL=geom.starts[visIdx]||0;
        var endL=geom.ends[visIdx]||startL;
        var prog=Math.min(1,Math.max(0,sectionProgress||0.5));
        var along=startL+(endL-startL)*prog;
        var pt=geom.pointAt(along);
        var rowPt=pts[visIdx];
        wash.style.transform='translate3d(0,'+rowPt.top+'px,0)';
        wash.style.left=(rowPt.x+8)+'px';
        wash.style.height=Math.max(24,rowPt.bottom-rowPt.top)+'px';
        petal.style.transform='translate3d('+pt.x+'px,'+pt.y+'px,0)';
        tailPath.style.strokeDashoffset=String(Math.max(0,geom.length-along));
      }

      rows.forEach(function(r,idx){
        var isCur=idx===visIdx;
        var isPassed=idx<visIdx;
        var rowId=r.getAttribute('data-toc-row');
        var isAncestor=topRootId&&rowId===topRootId&&!isCur;
        r.classList.toggle('sf-current-section',isCur);
        if(isCur)r.setAttribute('aria-current','location');else r.removeAttribute('aria-current');
        if(isPassed)r.setAttribute('data-passed','');else r.removeAttribute('data-passed');
        if(isAncestor)r.setAttribute('data-ancestor','');else r.removeAttribute('data-ancestor');
      });
    }

    return {sync:syncRibbon};
  }

  function buildSegmentedBar(hasSeries){
    var tabs=document.createElement('div');
    tabs.className='sf-sider-segmented sf-cos-segmented segmented';
    tabs.setAttribute('role','tablist');
    tabs.setAttribute('aria-label','侧边栏导航切换');

    var btnOverview=document.createElement('button');
    btnOverview.type='button';
    btnOverview.className='sf-sider-seg-btn sf-cos-seg-item segmented-item';
    btnOverview.setAttribute('data-sf-sider-mode','overview');
    btnOverview.setAttribute('aria-selected','false');
    btnOverview.setAttribute('aria-label','站点概览');
    btnOverview.innerHTML='<span class="sf-cos-seg-content"><span class="sf-cos-seg-icon">'+ICON_OVERVIEW+'</span><span class="sf-cos-seg-label"><span class="sf-cos-seg-label-clip"><span class="sf-cos-seg-label-text">站点概览</span></span></span></span>';

    var btnToc=document.createElement('button');
    btnToc.type='button';
    btnToc.className='sf-sider-seg-btn sf-cos-seg-item segmented-item';
    btnToc.setAttribute('data-sf-sider-mode','toc');
    btnToc.setAttribute('aria-selected','true');
    btnToc.setAttribute('data-selected','true');
    btnToc.setAttribute('aria-label','文章目录');
    btnToc.innerHTML='<span class="sf-cos-seg-content"><span class="sf-cos-seg-icon">'+ICON_TOC+'</span><span class="sf-cos-seg-label"><span class="sf-cos-seg-label-clip"><span class="sf-cos-seg-label-text">文章目录</span></span></span></span>';

    tabs.append(btnOverview,btnToc);
    if(hasSeries){
      var btnSeries=document.createElement('button');
      btnSeries.type='button';
      btnSeries.className='sf-sider-seg-btn sf-cos-seg-item segmented-item';
      btnSeries.setAttribute('data-sf-sider-mode','series');
      btnSeries.setAttribute('aria-selected','false');
      btnSeries.setAttribute('aria-label','系列目录');
      btnSeries.innerHTML='<span class="sf-cos-seg-content"><span class="sf-cos-seg-icon">'+ICON_SERIES+'</span><span class="sf-cos-seg-label"><span class="sf-cos-seg-label-clip"><span class="sf-cos-seg-label-text">系列目录</span></span></span></span>';
      tabs.appendChild(btnSeries);
    }
    return tabs;
  }

  function enhanceSidebar(box,seriesData){
    if(!box||!box.parentElement||document.getElementById('sf-sider-head'))return;
    var tocTab=document.getElementById('leftbar_tab_catalog');
    if(tocTab)tocTab.classList.add('active','show');
    var ovTab=document.getElementById('leftbar_tab_overview');
    if(ovTab)ovTab.classList.remove('active','show');
    var p2=document.getElementById('leftbar_part2_inner');
    if(p2){
      p2.classList.add('sf-cos-sider-active');
      var nw=p2.querySelector('.nav-wrapper');
      if(nw)nw.hidden=true;
    }
    var head=document.createElement('div');
    head.id='sf-sider-head';
    head.className='sf-sider-head sf-cos-sider-head sf-feature';
    var seriesBox=buildSeriesThread(seriesData);
    var tabs=buildSegmentedBar(!!seriesBox);
    head.appendChild(tabs);

    var pct=document.createElement('span');
    pct.className='sf-toc-pct sf-sr-only';
    pct.setAttribute('data-sf-toc-pct','');
    pct.textContent='0%';
    head.appendChild(pct);

    if(seriesBox){
      seriesBox.hidden=true;
      box.after(seriesBox);
    }
    box.before(head);

    var footerRail=buildFooterSeriesRail(seriesData,'');
    if(footerRail){
      if(p2)p2.appendChild(footerRail);
      else if(seriesBox)seriesBox.after(footerRail);
      else box.after(footerRail);
    }
  }

  function getSongsFromConfig(){
    var cfgEl=document.getElementById('sf-config');
    if(!cfgEl)return [];
    try{
      var parsed=JSON.parse(cfgEl.textContent||'{}');
      return Array.isArray(parsed.songs)?parsed.songs:[];
    }catch(_){return [];}
  }

  function syncToolkitRadioState(){
    var mpName=document.getElementById('mp-name');
    var audio=document.getElementById('mp-audio');
    var playing=!!(audio&&!audio.paused);
    var rawText=mpName&&mpName.textContent?mpName.textContent.trim():'';
    document.querySelectorAll('[data-sf-radio-title]').forEach(function(el){
      el.textContent=rawText||'夏影 · 麻枝准';
    });
    document.querySelectorAll('[data-sf-radio-toggle]').forEach(function(btn){
      btn.setAttribute('aria-pressed',String(playing));
      btn.textContent=playing?'❚❚ 暂停':'▶ 播放';
    });
    var isDark=document.documentElement.classList.contains('darkmode');
    document.querySelectorAll('[data-sf-dark-label]').forEach(function(el){
      el.textContent=isDark?'☀ 日间模式':'◐ 夜间模式';
    });
  }

  function enhanceOverviewAndTools(seriesData){
    var ovTab=document.getElementById('leftbar_tab_overview');
    var toolsTab=document.getElementById('leftbar_tab_tools');
    var songs=getSongsFromConfig();
    var songCount=songs.length||155;

    if(ovTab&&!ovTab.querySelector('.sf-overview-extras')){
      var extras=document.createElement('div');
      extras.className='sf-overview-extras sf-feature';
      extras.innerHTML=
        '<div class="sf-overview-statbar">'+
          '<span class="sf-overview-chip" data-sf-overview-read>已读 '+read.length+' 篇</span>'+
          '<a class="sf-overview-chip" href="/music/">🎵 馆藏 '+songCount+' 首</a>'+
        '</div>'+
        '<nav class="sf-overview-navgrid" aria-label="站点核心栏目快捷入口">'+
          '<a class="sf-overview-pill" href="/explore/"><span>🧭</span><span>探索</span></a>'+
          '<a class="sf-overview-pill" href="/series/"><span>📚</span><span>系列</span></a>'+
          '<a class="sf-overview-pill" href="/music/"><span>🎧</span><span>音乐</span></a>'+
          '<a class="sf-overview-pill" href="/watching/"><span>🎬</span><span>片单</span></a>'+
          '<a class="sf-overview-pill" href="/now/"><span>⏳</span><span>近况</span></a>'+
          '<a class="sf-overview-pill" href="/friends/"><span>🤝</span><span>友链</span></a>'+
        '</nav>';
      ovTab.appendChild(extras);
    }

    if(toolsTab){
      var ypText=document.getElementById('yearprogress_text_container');
      if(ypText){
        ypText.querySelectorAll('br').forEach(function(br){br.remove();});
      }
      var block7=document.getElementById('block-7');
      if(block7){
        block7.querySelectorAll('p').forEach(function(p){
          if(!p.textContent.trim())p.style.display='none';
        });
        if(!block7.querySelector('.sf-time-subgrid')){
          var now=new Date();
          var year=now.getFullYear();
          var startOfYear=new Date(year,0,1,0,0,0);
          var endOfYear=new Date(year,11,31,23,59,59);
          var dayOfYear=Math.max(1,Math.ceil((now-startOfYear)/86400000));
          var daysLeft=Math.max(0,Math.floor((endOfYear-now)/86400000));
          var daysInMonth=new Date(year,now.getMonth()+1,0).getDate();
          var monthPct=Math.min(100,Math.max(1,Math.round(((now.getDate()-1+now.getHours()/24)/daysInMonth)*100)));
          var dayPct=Math.min(100,Math.max(1,Math.round(((now.getHours()*3600+now.getMinutes()*60+now.getSeconds())/86400)*100)));
          var timeSub=document.createElement('div');
          timeSub.className='sf-time-subgrid sf-feature';
          timeSub.innerHTML=
            '<div class="sf-time-meta-row">'+
              '<span>'+year+' 年第 <strong>'+dayOfYear+'</strong> 天</span>'+
              '<span>余 <strong>'+daysLeft+'</strong> 天</span>'+
            '</div>'+
            '<div class="sf-time-bars">'+
              '<div class="sf-time-bar-item">'+
                '<div class="sf-time-bar-label"><span>'+(now.getMonth()+1)+' 月进度</span><strong>'+monthPct+'%</strong></div>'+
                '<div class="sf-time-bar-track"><span style="width:'+monthPct+'%"></span></div>'+
              '</div>'+
              '<div class="sf-time-bar-item">'+
                '<div class="sf-time-bar-label"><span>今日刻度</span><strong>'+dayPct+'%</strong></div>'+
                '<div class="sf-time-bar-track"><span style="width:'+dayPct+'%"></span></div>'+
              '</div>'+
            '</div>';
          block7.appendChild(timeSub);
        }
      }

      var block8=document.getElementById('block-8');
      if(block8)block8.hidden=true;

      if(!toolsTab.querySelector('.sf-sider-toolkit')){
        var toolkit=document.createElement('div');
        toolkit.className='sf-sider-toolkit sf-feature';
        var mpName=document.getElementById('mp-name');
        var curSongText=(mpName&&mpName.textContent&&mpName.textContent.trim())||'夏影 · 麻枝准';
        var isDark=document.documentElement.classList.contains('darkmode');
        toolkit.innerHTML=
          '<div class="sf-toolkit-radio">'+
            '<div class="sf-toolkit-radio-head">'+
              '<span class="sf-toolkit-eyebrow">🎧 随心电台</span>'+
              '<button type="button" class="sf-toolkit-mini-btn" data-sf-radio-list title="展开歌单">歌单 ☰</button>'+
            '</div>'+
            '<div class="sf-toolkit-radio-track" data-sf-radio-title>'+curSongText+'</div>'+
            '<div class="sf-toolkit-radio-actions">'+
              '<button type="button" class="sf-toolkit-btn" data-sf-radio-toggle aria-pressed="false">▶ 播放</button>'+
              '<button type="button" class="sf-toolkit-btn" data-sf-radio-random>🎲 随机换歌</button>'+
            '</div>'+
          '</div>'+
          '<div class="sf-toolkit-grid" role="group" aria-label="快捷工具箱">'+
            '<button type="button" class="sf-toolkit-cell" data-sf-sider-random-post><span>🎲</span><span>随机漫游</span></button>'+
            '<button type="button" class="sf-toolkit-cell" data-sf-toggle-dark><span data-sf-dark-label>'+(isDark?'☀ 日间模式':'◐ 夜间模式')+'</span></button>'+
            '<a class="sf-toolkit-cell" href="/图库/"><span>🖼</span><span>查看图库</span></a>'+
            '<button type="button" class="sf-toolkit-cell" data-sf-scroll-top><span>⬆️</span><span>回到顶部</span></button>'+
          '</div>';
        toolsTab.appendChild(toolkit);
      }
    }

    var p2=document.getElementById('leftbar_part2_inner');
    if(p2&&!document.getElementById('sf-sider-head')){
      p2.classList.add('sf-cos-sider-active');
      var nw=p2.querySelector('.nav-wrapper');
      if(nw)nw.hidden=true;
      var head=document.createElement('div');
      head.id='sf-sider-head';
      head.className='sf-sider-head sf-cos-sider-head sf-feature';
      var tabs=document.createElement('div');
      tabs.className='sf-sider-segmented sf-cos-segmented segmented';
      tabs.setAttribute('role','tablist');
      tabs.setAttribute('aria-label','侧边栏导航切换');

      var btnOv=document.createElement('button');
      btnOv.type='button';
      btnOv.className='sf-sider-seg-btn sf-cos-seg-item segmented-item';
      btnOv.setAttribute('data-sf-sider-mode','overview');
      btnOv.setAttribute('aria-selected','true');
      btnOv.setAttribute('data-selected','true');
      btnOv.setAttribute('aria-label','站点概览');
      btnOv.innerHTML='<span class="sf-cos-seg-content"><span class="sf-cos-seg-icon">'+ICON_OVERVIEW+'</span><span class="sf-cos-seg-label"><span class="sf-cos-seg-label-clip"><span class="sf-cos-seg-label-text">站点概览</span></span></span></span>';

      var btnTools=document.createElement('button');
      btnTools.type='button';
      btnTools.className='sf-sider-seg-btn sf-cos-seg-item segmented-item';
      btnTools.setAttribute('data-sf-sider-mode','tools');
      btnTools.setAttribute('aria-selected','false');
      btnTools.setAttribute('aria-label','站点功能');
      btnTools.innerHTML='<span class="sf-cos-seg-content"><span class="sf-cos-seg-icon">'+ICON_TOOLS+'</span><span class="sf-cos-seg-label"><span class="sf-cos-seg-label-clip"><span class="sf-cos-seg-label-text">站点功能</span></span></span></span>';

      tabs.append(btnOv,btnTools);

      var seriesBox=buildSeriesThread(seriesData);
      if(seriesBox){
        var btnSer=document.createElement('button');
        btnSer.type='button';
        btnSer.className='sf-sider-seg-btn sf-cos-seg-item segmented-item';
        btnSer.setAttribute('data-sf-sider-mode','series');
        btnSer.setAttribute('aria-selected','false');
        btnSer.setAttribute('aria-label','近期文章');
        btnSer.innerHTML='<span class="sf-cos-seg-content"><span class="sf-cos-seg-icon">'+ICON_SERIES+'</span><span class="sf-cos-seg-label"><span class="sf-cos-seg-label-clip"><span class="sf-cos-seg-label-text">'+(seriesData.name||'近期文章')+'</span></span></span></span>';
        tabs.appendChild(btnSer);
        seriesBox.hidden=true;
        var tc=p2.querySelector('.tab-content');
        if(tc)tc.appendChild(seriesBox);
      }

      head.appendChild(tabs);
      p2.prepend(head);

      if(ovTab){ovTab.classList.add('active','show');ovTab.hidden=false;}
      if(toolsTab){toolsTab.classList.remove('active','show');}

      var footerRail=buildFooterSeriesRail(seriesData,'');
      if(footerRail)p2.appendChild(footerRail);
    }
    syncToolkitRadioState();
  }

  function ensureReadingProgress(){
    var content=document.querySelector('#post_content');
    if(!content||document.body.classList.contains('sf-hub-page'))return null;
    var bar=document.getElementById('sf-reading-progress');
    if(!bar){
      bar=document.createElement('div');
      bar.id='sf-reading-progress';
      bar.className='sf-reading-progress';
      bar.setAttribute('aria-hidden','true');
      var fill=document.createElement('span');
      fill.className='sf-reading-progress-fill';
      bar.appendChild(fill);
      document.body.appendChild(bar);
    }
    return bar;
  }

  function setupMobileDrawer(tree,pairs,seriesData){
    var content=document.querySelector('#post_content');
    if(!content||document.body.classList.contains('sf-hub-page'))return null;
    if((!pairs||!pairs.length)&&!seriesData)return null;
    if(document.getElementById('sf-mobile-drawer-btn'))return null;
    var btn=document.createElement('button');
    btn.type='button';
    btn.id='sf-mobile-drawer-btn';
    btn.className='sf-mobile-drawer-btn sf-feature';
    btn.setAttribute('aria-label','打开文章目录抽屉');
    btn.setAttribute('aria-expanded','false');
    btn.setAttribute('aria-controls','sf-mobile-drawer');
    btn.innerHTML=ICON_TOC+'<span>目录</span>';

    var drawer=document.createElement('div');
    drawer.id='sf-mobile-drawer';
    drawer.className='sf-mobile-drawer sf-cos-drawer sf-feature';
    drawer.hidden=true;
    drawer.setAttribute('role','dialog');
    drawer.setAttribute('aria-modal','true');
    drawer.setAttribute('aria-label','阅读目录侧边抽屉');

    var backdrop=document.createElement('div');
    backdrop.className='sf-drawer-backdrop';
    backdrop.setAttribute('data-sf-drawer-close','');

    var sheet=document.createElement('div');
    sheet.className='sf-drawer-sheet sf-cos-drawer-sheet';

    var top=document.createElement('div');
    top.className='sf-drawer-top sf-cos-drawer-top';
    var close=document.createElement('button');
    close.type='button';
    close.className='sf-cos-close-btn';
    close.setAttribute('data-sf-drawer-close','');
    close.setAttribute('aria-label','关闭目录抽屉');
    close.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 10.586l4.95-4.95 1.414 1.414-4.95 4.95 4.95 4.95-1.414 1.414-4.95-4.95-4.95 4.95-1.414-1.414 4.95-4.95-4.95-4.95L7.05 5.636z"/></svg>';
    var badge=document.createElement('span');
    badge.className='sf-cos-drawer-badge';
    badge.textContent='阅读导航';
    top.append(close,badge);

    var segWrap=document.createElement('div');
    segWrap.className='sf-cos-drawer-seg';
    segWrap.appendChild(buildSegmentedBar(!!seriesData));

    var body=document.createElement('div');
    body.className='sf-drawer-body sf-cos-drawer-body';

    var drawerToc=document.createElement('div');
    drawerToc.className='sf-drawer-toc-pane';
    drawerToc.setAttribute('data-sf-drawer-pane','toc');
    var drawerRenderer=null;
    if(tree&&tree.length){
      drawerRenderer=renderSilkTocInto(drawerToc,tree,'sf-toc-grad-drawer');
      drawerToc.querySelectorAll('.silk-heading-link[data-toc-row]').forEach(function(a){
        a.setAttribute('data-sf-drawer-link',a.getAttribute('data-toc-row'));
      });
    }
    body.appendChild(drawerToc);

    if(seriesData){
      var drawerSer=buildSeriesThread(seriesData,true);
      if(drawerSer){
        drawerSer.setAttribute('data-sf-drawer-pane','series');
        drawerSer.hidden=true;
        body.appendChild(drawerSer);
      }
    }

    var drawerOverview=document.createElement('div');
    drawerOverview.className='sf-drawer-overview-pane';
    drawerOverview.setAttribute('data-sf-drawer-pane','overview');
    drawerOverview.hidden=true;
    var origOv=document.getElementById('leftbar_tab_overview');
    if(origOv){
      drawerOverview.innerHTML=origOv.innerHTML;
    }else{
      drawerOverview.innerHTML='<p class="sf-small sf-muted">Still Floating · 个人博客</p>';
    }
    body.appendChild(drawerOverview);

    sheet.append(top,segWrap,body);
    var drawerFooter=buildFooterSeriesRail(seriesData,'drawer');
    if(drawerFooter)sheet.appendChild(drawerFooter);

    drawer.append(backdrop,sheet);
    document.body.append(btn,drawer);
    return drawerRenderer;
  }

  function bindCatalog(){
    var content=document.querySelector('#post_content');
    var bar=ensureReadingProgress();
    var seriesData=resolveSeriesData();
    if(!content){
      enhanceOverviewAndTools(seriesData);
      return;
    }
    var box=ensureLeftbarCatalogBox();
    var extracted=collectArticleHeadings(content,box);
    var pairs=extracted.flat.map(function(item){return {h:item.el,id:item.id,text:item.text,level:item.level};});

    var mainRenderer=null;
    if(box&&extracted.tree.length){
      mainRenderer=renderSilkTocInto(box,extracted.tree,'sf-toc-grad-main');
      enhanceSidebar(box,seriesData);
    }
    enhanceOverviewAndTools(seriesData);
    var drawerRenderer=setupMobileDrawer(extracted.tree,pairs,seriesData);

    function update(){
      scrollFrame=0;
      if(content){
        var rect=content.getBoundingClientRect(),total=Math.max(1,rect.height-window.innerHeight*0.5),scrolled=Math.min(Math.max(0,-rect.top+window.innerHeight*0.25),total);
        var pct=Math.min(100,Math.max(0,Math.round(scrolled/total*100)));
        if(bar&&bar.firstElementChild)bar.firstElementChild.style.width=pct+'%';
        document.querySelectorAll('[data-sf-toc-pct]').forEach(function(el){el.textContent=pct+'%';});
      }
      if(!pairs.length)return;
      var activeIdx=0;
      var threshold=130;
      var allZero=pairs.length>1&&pairs.every(function(p){return !p.h||p.h.getBoundingClientRect().top===0;});
      if(!allZero){
        pairs.forEach(function(p,idx){
          if(p.h&&p.h.getBoundingClientRect().top<=threshold)activeIdx=idx;
        });
      }
      var curTop=pairs[activeIdx].h.getBoundingClientRect().top;
      var nextTop=(pairs[activeIdx+1]&&pairs[activeIdx+1].h)?pairs[activeIdx+1].h.getBoundingClientRect().top:(content.getBoundingClientRect().bottom);
      var span=Math.max(1,nextTop-curTop);
      var sectionProgress=Math.min(1,Math.max(0.15,(threshold-curTop)/span));

      if(mainRenderer)mainRenderer.sync(activeIdx,sectionProgress,pairs);
      if(drawerRenderer)drawerRenderer.sync(activeIdx,sectionProgress,pairs);
    }

    if(pairs.length||bar){
      scrollHandler=function(){if(!scrollFrame)scrollFrame=requestAnimationFrame(update);};
      window.addEventListener('scroll',scrollHandler,{passive:true});
      update();
      if(window.ResizeObserver&&box){
        resizeObs=new ResizeObserver(function(){if(!scrollFrame)scrollFrame=requestAnimationFrame(update);});
        resizeObs.observe(box);
      }
    }
    arrangeCatalog();
  }

  function detectLang(pre,code){
    var cls=((pre.className||'')+' '+(code?code.className:'')).toLowerCase();
    var m=cls.match(/(?:language-|lang-|brush:\s*)([a-z0-9_+#-]+)/);
    if(m){
      var raw=m[1];
      var map={cpp:'C++','c++':'C++',c:'C',js:'JavaScript',javascript:'JavaScript',ts:'TypeScript',typescript:'TypeScript',py:'Python',python:'Python',java:'Java',sh:'Shell',bash:'Bash',zsh:'Shell',html:'HTML',css:'CSS',json:'JSON',sql:'SQL',php:'PHP',go:'Go',rust:'Rust'};
      return map[raw]||raw.toUpperCase();
    }
    var txt=(code||pre).textContent||'';
    if(/^\s*#include\b|\busing\s+namespace\s+std\b/m.test(txt))return 'C++';
    if(/^\s*(?:def |import |from .+ import )/m.test(txt))return 'Python';
    if(/\b(?:const|let|function)\b.*=>|\bconsole\.log\(/m.test(txt))return 'JavaScript';
    if(/\bpublic\s+static\s+void\s+main\b/m.test(txt))return 'Java';
    return 'Code';
  }

  function improveCode(){
    document.querySelectorAll('#post_content pre').forEach(function(pre){
      if(pre.closest('.sf-code-wrap')||pre.querySelector('button'))return;
      var code=pre.querySelector('code')||pre;
      var rawText=(code.textContent||'').replace(/\n$/,'');
      var lineCount=rawText?rawText.split('\n').length:1;
      var lang=detectLang(pre,code);
      var wrap=document.createElement('div');wrap.className='sf-code-wrap';pre.before(wrap);
      var meta=document.createElement('div');meta.className='sf-code-meta';meta.setAttribute('aria-hidden','true');
      var langSpan=document.createElement('span');langSpan.className='sf-code-lang';langSpan.textContent=lang;
      var linesSpan=document.createElement('span');linesSpan.className='sf-code-lines';linesSpan.textContent=lineCount+' 行';
      meta.append(langSpan,linesSpan);
      wrap.append(meta,pre);
      if(lineCount>18){
        var foldBtn=document.createElement('button');
        foldBtn.type='button';foldBtn.className='sf-fold-code';foldBtn.setAttribute('data-sf-fold-code','');foldBtn.setAttribute('aria-expanded','true');foldBtn.textContent='收起代码';
        wrap.appendChild(foldBtn);
      }
      var button=document.createElement('button');button.type='button';button.className='sf-copy-code';button.textContent='复制代码';button.setAttribute('aria-label','复制这段代码');
      var status=document.createElement('span');status.className='sf-sr-only';status.setAttribute('role','status');wrap.append(button,status);
      pre.tabIndex=0;pre.setAttribute('aria-label','代码，可横向滚动');
    });
  }

  function enhanceHeadings(){
    var content=document.querySelector('#post_content');
    if(!content||document.body.classList.contains('sf-hub-page'))return;
    var used={};
    content.querySelectorAll('h2, h3, h4').forEach(function(h,idx){
      if(h.closest('.sf-feature, .argon-timeline'))return;
      var text=h.textContent.trim();if(!text)return;
      if(!h.id){
        var slug=text.toLowerCase().replace(/[^\w\u4e00-\u9fa5-]+/g,'-').replace(/^-+|-+$/g,'')||('section-'+(idx+1));
        if(used[slug]||document.getElementById(slug)){slug=slug+'-'+(idx+1);}
        used[slug]=true;h.id=slug;
      }
      if(!h.querySelector('.sf-heading-anchor')){
        var a=document.createElement('a');
        a.className='sf-heading-anchor no-pjax';
        a.href='#'+encodeURIComponent(h.id);
        a.setAttribute('data-sf-anchor-copy',h.id);
        a.setAttribute('aria-label','复制「'+text+'」章节链接');
        a.title='复制本节链接';
        a.textContent='#';
        h.appendChild(a);
      }
    });
  }

  function repairContentArtifacts(){
    document.querySelectorAll('.sf-music-card').forEach(function(card){
      var fb=card.querySelector('.fancybox-wrapper');
      var img=card.querySelector('img');
      if(img){
        var orig=img.getAttribute('data-original');
        if(orig&&(!img.getAttribute('src')||img.getAttribute('src').indexOf('data:image/')===0)){
          img.setAttribute('src',orig);
        }
        img.classList.remove('lazyload','lazyload-style-1');
        img.classList.add('sf-cover');
        img.style.removeProperty('opacity');
        if(fb&&fb.parentElement===card){
          fb.replaceWith(img);
        }
      }
    });
    if(document.querySelector('.sf-post-pagination')){
      document.querySelectorAll('#main > .post-navigation.card').forEach(function(el){el.hidden=true;});
    }
    if(document.querySelector('.sf-discovery-grid')){
      document.querySelectorAll('#main > .related-posts.card').forEach(function(el){el.hidden=true;});
    }
  }

  function repairLegacyLinks(){
    document.querySelectorAll('a[href]').forEach(function(a){
      var url;try{url=new URL(a.href,location.href);}catch(_){return;}
      if(url.origin!==location.origin)return;
      var path;try{path=decodeURIComponent(url.pathname).replace(/\/$/,'');}catch(_){return;}
      if(path==='/index.php/归档')a.href='/archives/';
      if(path==='/index.php/图库')a.href='/图库/';
    });
  }

  function filterPlaylist(feature){
    var input=feature.querySelector('[data-sf-playlist-search]'),q=input?input.value.trim().toLocaleLowerCase():'',n=0;
    var items=feature.querySelectorAll('[data-sf-playlist-item]');
    items.forEach(function(item){item.hidden=q!==''&&item.dataset.sfSearch.toLocaleLowerCase().indexOf(q)===-1;if(!item.hidden)n++;});
    var count=feature.querySelector('[data-sf-playlist-count]'),empty=feature.querySelector('[data-sf-playlist-empty]');
    if(count)count.textContent=n+' / '+items.length+' 首';if(empty)empty.hidden=n!==0;
  }

  function filterTagsPage(input){
    var root=input.closest('.sf-hub-content')||document;
    var q=input.value.trim().toLocaleLowerCase(),n=0,total=0;
    root.querySelectorAll('[data-sf-taxonomy-panel]').forEach(function(panel){
      var panelVisible=0;
      panel.querySelectorAll('[data-sf-tag-item]').forEach(function(item){
        total++;
        var match=q===''||(item.dataset.sfSearch||'').toLocaleLowerCase().indexOf(q)!==-1;
        item.hidden=!match;
        if(match){n++;panelVisible++;}
      });
      panel.hidden=q!==''&&panelVisible===0;
    });
    var status=root.querySelector('[data-sf-tags-status]'),empty=root.querySelector('[data-sf-tags-empty]');
    if(status)status.textContent=q?('匹配 '+n+' / '+total+' 项'):('共 '+total+' 项');
    if(empty)empty.hidden=n!==0;
  }

  function filterSeriesPage(input){
    var root=input.closest('.sf-hub-content')||document;
    var q=input.value.trim().toLocaleLowerCase(),n=0,total=0;
    root.querySelectorAll('[data-sf-series-section]').forEach(function(sec){
      var secVisible=0;
      sec.querySelectorAll('[data-sf-read-item]').forEach(function(item){
        total++;
        var match=q===''||(item.dataset.sfSearch||item.textContent||'').toLocaleLowerCase().indexOf(q)!==-1;
        item.hidden=!match;
        if(match){n++;secVisible++;}
      });
      sec.hidden=q!==''&&secVisible===0;
    });
    var count=root.querySelector('[data-sf-series-filter-count]'),empty=root.querySelector('[data-sf-series-empty]');
    if(count)count.textContent=q?('显示 '+n+' / '+total+' 篇'):'';
    if(empty)empty.hidden=n!==0;
  }

  function filterSiderThread(input){
    var wrap=input.closest('.sf-sider-series');if(!wrap)return;
    var q=input.value.trim().toLocaleLowerCase(),n=0;
    wrap.querySelectorAll('.series-thread-item').forEach(function(item){
      var match=q===''||(item.dataset.sfSearch||item.textContent||'').toLocaleLowerCase().indexOf(q)!==-1;
      item.hidden=!match;if(match)n++;
    });
    var empty=wrap.querySelector('[data-sf-thread-empty]');
    if(empty)empty.hidden=n!==0;
  }

  function nodeToMarkdown(node){
    if(node.nodeType===3)return node.nodeValue||'';
    if(node.nodeType!==1)return '';
    if(node.classList&&(node.classList.contains('sf-feature')||node.classList.contains('sf-heading-anchor')||node.classList.contains('sf-code-meta')||node.classList.contains('sf-copy-code')||node.classList.contains('sf-fold-code')||node.classList.contains('sf-sr-only')))return '';
    var tag=node.tagName.toLowerCase();
    if(tag==='pre'||(tag==='div'&&node.classList.contains('sf-code-wrap'))){
      var pre=tag==='pre'?node:node.querySelector('pre');if(!pre)return '';
      var code=pre.querySelector('code')||pre;
      var lang=detectLang(pre,code);
      var fenceLang=lang==='Code'?'':lang.toLowerCase().replace('c++','cpp');
      return '\n```'+fenceLang+'\n'+(code.textContent||'').replace(/\n$/,'')+'\n```\n\n';
    }
    var children='';
    node.childNodes.forEach(function(c){children+=nodeToMarkdown(c);});
    if(/^h[1-6]$/.test(tag)){
      var level=Number(tag.slice(1));
      return '\n'+('#'.repeat(level))+' '+children.trim()+'\n\n';
    }
    if(tag==='p')return children.trim()?children.trim()+'\n\n':'';
    if(tag==='br')return '  \n';
    if(tag==='strong'||tag==='b')return '**'+children.trim()+'**';
    if(tag==='em'||tag==='i')return '*'+children.trim()+'*';
    if(tag==='code')return '`'+children+'`';
    if(tag==='a'){
      var href=node.getAttribute('href')||'';
      return href?'['+children.trim()+']('+href+')':children;
    }
    if(tag==='img'){
      var src=node.getAttribute('src')||'',alt=node.getAttribute('alt')||'';
      return src?'!['+alt+']('+src+')':'';
    }
    if(tag==='blockquote'){
      return '\n'+children.trim().split('\n').map(function(l){return '> '+l;}).join('\n')+'\n\n';
    }
    if(tag==='ul'||tag==='ol'){
      var ordered=tag==='ol',out='\n',idx=1;
      Array.from(node.children).forEach(function(li){
        if(li.tagName&&li.tagName.toLowerCase()==='li'){
          out+=(ordered?(idx++)+'. ':'- ')+nodeToMarkdown(li).trim()+'\n';
        }
      });
      return out+'\n';
    }
    return children;
  }

  function extractArticleMarkdown(title){
    var content=document.querySelector('#post_content');
    var headerTitle=title||(document.querySelector('.post-title')?document.querySelector('.post-title').textContent.trim():document.title);
    var md='# '+headerTitle+'\n\n> 原文链接：'+location.href+'\n\n';
    if(content){
      var body='';
      content.childNodes.forEach(function(n){body+=nodeToMarkdown(n);});
      md+=body.replace(/\n{3,}/g,'\n\n').trim()+'\n';
    }
    return md;
  }

  function fallbackCopy(value){
    var input=document.createElement('textarea');input.value=value;input.readOnly=true;input.className='sf-copy-buffer';document.body.appendChild(input);input.select();
    var result=false;try{result=document.execCommand('copy');}finally{input.remove();}if(!result)throw new Error('copy');
  }

  function writeClipboard(text){
    return Promise.resolve().then(function(){
      if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);
      fallbackCopy(text);
    });
  }

  document.addEventListener('input',function(e){
    if(e.target.matches('[data-sf-playlist-search]'))filterPlaylist(e.target.closest('[data-sf-playlist]'));
    if(e.target.matches('[data-sf-tags-search]'))filterTagsPage(e.target);
    if(e.target.matches('[data-sf-series-search]'))filterSeriesPage(e.target);
    if(e.target.matches('[data-sf-thread-search]'))filterSiderThread(e.target);
  });

  function updateRailPreview(target){
    var tick=target&&target.closest&&target.closest('[data-sf-tick-label]');
    if(!tick)return;
    var box=tick.closest('[data-sf-series-rail-box]');
    if(!box)return;
    box.setAttribute('data-previewing','true');
    var shortEl=box.querySelector('.sf-cos-preview-label');
    var cosTitle=box.querySelector('[data-sf-cos-preview-title]');
    var preview=box.querySelector('[data-sf-series-preview]');
    if(shortEl)shortEl.textContent=tick.dataset.sfTickShort||tick.dataset.sfTickLabel||'';
    if(cosTitle)cosTitle.textContent=tick.dataset.sfTickTitle||'';
    if(preview)preview.textContent=tick.dataset.sfTickLabel+' · '+tick.dataset.sfTickTitle;
    var postId=tick.dataset.sfTickPost;
    if(postId){
      document.querySelectorAll('[data-sf-series-preview]').forEach(function(el){
        el.textContent=tick.dataset.sfTickLabel+' · '+tick.dataset.sfTickTitle;
      });
    }
    var hoverIdx=Number(tick.dataset.sfTickIndex);
    if(!Number.isNaN(hoverIdx)){
      box.querySelectorAll('.sf-cos-series-tick[data-sf-tick-index]').forEach(function(t){
        var d=Math.abs(Number(t.dataset.sfTickIndex)-hoverIdx);
        var w=d===0?1.65:d===1?1.3:d===2?1.12:1;
        t.style.setProperty('--wave',String(w));
      });
    }
  }
  function resetRailPreview(target){
    var box=target&&target.closest&&target.closest('[data-sf-series-rail-box]');
    if(!box)return;
    box.removeAttribute('data-previewing');
    var shortEl=box.querySelector('.sf-cos-preview-label');
    var preview=box.querySelector('[data-sf-series-preview]');
    if(!shortEl&&preview&&box.dataset.defaultPreview){
      preview.textContent=box.dataset.defaultPreview;
    }
    box.querySelectorAll('.sf-cos-series-tick[data-sf-tick-index]').forEach(function(t){
      t.style.removeProperty('--wave');
    });
  }
  document.addEventListener('mouseover',function(e){updateRailPreview(e.target);});
  document.addEventListener('focusin',function(e){updateRailPreview(e.target);});
  document.addEventListener('mouseout',function(e){
    var box=e.target&&e.target.closest&&e.target.closest('[data-sf-series-rail-box]');
    if(box&&(!e.relatedTarget||!box.contains(e.relatedTarget)))resetRailPreview(box);
  });
  document.addEventListener('focusout',function(e){
    var box=e.target&&e.target.closest&&e.target.closest('[data-sf-series-rail-box]');
    if(box&&(!e.relatedTarget||!box.contains(e.relatedTarget)))resetRailPreview(box);
  });

  function init(){
    routeFrame=0;cleanup();
    var main=document.querySelector('#main');
    document.body.classList.toggle('sf-hub-page',!!document.querySelector('#post_content > .sf-hub-content'));
    document.body.classList.toggle('sf-reading-page',!!main&&!main.classList.contains('article-list-home'));
    repairContentArtifacts();applyFontScale();improveCode();enhanceHeadings();repairLegacyLinks();bindCatalog();paintRead();
    document.querySelectorAll('[data-sf-playlist]').forEach(filterPlaylist);
    document.querySelectorAll('[data-sf-tags-search]').forEach(filterTagsPage);
    var box=document.querySelector('#leftbar_catalog');
    if(box&&!box.querySelector('a')&&window.MutationObserver){observer=new MutationObserver(function(){if(box.querySelector('a')){observer.disconnect();observer=null;bindCatalog();paintRead();}});observer.observe(box,{childList:true,subtree:true});}
  }
  function route(){cancelAnimationFrame(routeFrame);routeFrame=requestAnimationFrame(init);}

  document.addEventListener('click',function(e){
    var closeTrigger=e.target.closest&&e.target.closest('[data-sf-drawer-close]');
    if(closeTrigger){
      var dr=document.getElementById('sf-mobile-drawer'),db=document.getElementById('sf-mobile-drawer-btn');
      if(dr)dr.hidden=true;if(db)db.setAttribute('aria-expanded','false');return;
    }
    var target=e.target.closest&&e.target.closest('button,a');if(!target)return;
    if(target.id==='sf-mobile-drawer-btn'){
      var drawer=document.getElementById('sf-mobile-drawer');
      if(drawer){
        var open=drawer.hidden;
        drawer.hidden=!open;
        target.setAttribute('aria-expanded',String(open));
        if(open&&scrollHandler)scrollHandler();
      }
      return;
    }
    if(target.closest('#sf-mobile-drawer')&&target.tagName==='A'&&!target.matches('[data-sf-sider-mode]')){
      var d=document.getElementById('sf-mobile-drawer'),b=document.getElementById('sf-mobile-drawer-btn');
      if(d)d.hidden=true;if(b)b.setAttribute('aria-expanded','false');
    }
    if(target.matches('.silk-heading-link[data-toc-row]')){
      var parentItem=target.closest('.heading-tree-item');
      var childBox=parentItem&&parentItem.querySelector(':scope > .silk-heading-children');
      if(childBox){
        childBox.setAttribute('data-open','true');
        if(scrollHandler)requestAnimationFrame(scrollHandler);
      }
    }
    if(target.matches('[data-sf-sider-mode]')){
      var mode=target.dataset.sfSiderMode;
      var segBar=target.closest('.sf-sider-segmented');
      if(segBar){
        segBar.querySelectorAll('[data-sf-sider-mode]').forEach(function(btn){
          var active=btn===target;
          btn.setAttribute('aria-selected',String(active));
          if(active)btn.setAttribute('data-selected','true');
          else btn.removeAttribute('data-selected');
        });
      }
      var inDrawer=target.closest('#sf-mobile-drawer');
      if(inDrawer){
        inDrawer.querySelectorAll('[data-sf-drawer-pane]').forEach(function(pane){
          pane.hidden=pane.getAttribute('data-sf-drawer-pane')!==mode;
        });
      }else{
        var hasToolsBtn=!!(segBar&&segBar.querySelector('[data-sf-sider-mode="tools"]'));
        var tocBox=document.querySelector('#leftbar_catalog');
        var tocTab=document.getElementById('leftbar_tab_catalog');
        var serBox=document.getElementById('sf-sider-series');
        var ovTab=document.getElementById('leftbar_tab_overview');
        var toolsTab=document.getElementById('leftbar_tab_tools');
        if(tocBox)tocBox.hidden=mode!=='toc';
        if(serBox)serBox.hidden=mode!=='series';
        if(tocTab){
          if(mode==='overview'||mode==='tools')tocTab.classList.remove('active','show');
          else tocTab.classList.add('active','show');
        }
        if(ovTab){
          if(mode==='overview'){ovTab.classList.add('active','show');ovTab.hidden=false;}
          else{ovTab.classList.remove('active','show');ovTab.hidden=true;}
        }
        if(toolsTab){
          var showTools=mode==='tools'||(!hasToolsBtn&&mode==='overview');
          if(showTools){toolsTab.classList.add('active','show');toolsTab.hidden=false;}
          else{toolsTab.classList.remove('active','show');toolsTab.hidden=true;}
        }
      }
      if(mode==='toc'&&scrollHandler)requestAnimationFrame(scrollHandler);
    }
    if(target.matches('[data-sf-radio-toggle]')){
      var mpPlay=document.getElementById('mp-play');
      if(mpPlay)mpPlay.click();
      setTimeout(syncToolkitRadioState,60);
    }
    if(target.matches('[data-sf-radio-random]')){
      var rSongs=getSongsFromConfig();
      if(rSongs.length){
        var rPick=rSongs[Math.floor(Math.random()*rSongs.length)];
        if(rPick&&rPick.id){
          document.dispatchEvent(new CustomEvent('sf:play-song',{detail:{id:String(rPick.id)}}));
          setTimeout(syncToolkitRadioState,90);
        }
      }else{
        var mpNext=document.getElementById('mp-next');
        if(mpNext){mpNext.click();setTimeout(syncToolkitRadioState,90);}
      }
    }
    if(target.matches('[data-sf-radio-list]')){
      var mpListBtn=document.getElementById('mp-list-btn');
      if(mpListBtn)mpListBtn.click();
    }
    if(target.matches('[data-sf-sider-random-post]')){
      var sd=resolveSeriesData();
      if(sd&&sd.items&&sd.items.length){
        var candidates=sd.items.filter(function(it){return !it.current&&it.url;});
        var poolItems=candidates.length?candidates:sd.items;
        var chosenPost=poolItems[Math.floor(Math.random()*poolItems.length)];
        if(chosenPost&&chosenPost.url)location.href=chosenPost.url;
      }else{
        location.href='/explore/';
      }
    }
    if(target.matches('[data-sf-toggle-dark]')){
      var argonToggle=document.getElementById('fabtn_toggle_light_dark');
      if(argonToggle){
        argonToggle.click();
      }else{
        document.documentElement.classList.toggle('darkmode');
      }
      setTimeout(syncToolkitRadioState,30);
    }
    if(target.matches('[data-sf-scroll-top]')){
      window.scrollTo({top:0,behavior:'smooth'});
    }
    if(target.matches('[data-sf-read-toggle]')){
      var id=Number(target.dataset.sfReadToggle),i=read.indexOf(id);if(!Number.isSafeInteger(id)||id<=0)return;
      if(i===-1)read.push(id);else read.splice(i,1);read=read.slice(-1000);try{localStorage.setItem(readKey,JSON.stringify(read));}catch(_){}paintRead();
    }
    if(target.matches('[data-sf-song]'))document.dispatchEvent(new CustomEvent('sf:play-song',{detail:{id:target.dataset.sfSong}}));
    if(target.matches('.sf-copy-code')){
      var wrap=target.closest('.sf-code-wrap'),code=wrap.querySelector('pre code')||wrap.querySelector('pre'),value=code.textContent,status=wrap.querySelector('[role="status"]');
      writeClipboard(value).then(function(){target.textContent='已复制 ✓';status.textContent='代码已复制';}).catch(function(){target.textContent='请选择代码复制';status.textContent='自动复制失败，可以手动选择代码复制';}).finally(function(){target.focus({preventScroll:true});clearTimeout(copyTimer);copyTimer=setTimeout(function(){if(target.isConnected)target.textContent='复制代码';},2500);});
    }
    if(target.matches('[data-sf-fold-code]')){
      var cwrap=target.closest('.sf-code-wrap'),collapsed=cwrap.classList.toggle('sf-is-collapsed');
      target.setAttribute('aria-expanded',String(!collapsed));
      target.textContent=collapsed?'展开代码':'收起代码';
    }
    if(target.matches('[data-sf-font]')){
      var act=target.dataset.sfFont;
      if(act==='dec')fontScale=Math.max(85,fontScale-10);
      else if(act==='inc')fontScale=Math.min(130,fontScale+10);
      else fontScale=100;
      try{localStorage.setItem(fontKey,String(fontScale));}catch(_){}
      applyFontScale();
    }
    if(target.matches('[data-sf-copy-md]')){
      var md=extractArticleMarkdown(target.dataset.postTitle),tstatus=document.querySelector('[data-sf-toolbar-status]');
      writeClipboard(md).then(function(){
        target.textContent='已复制 Markdown ✓';if(tstatus)tstatus.textContent='全文 Markdown 已复制到剪贴板';
      }).catch(function(){
        target.textContent='复制失败';
      }).finally(function(){
        clearTimeout(toolTimer);toolTimer=setTimeout(function(){if(target.isConnected)target.textContent='复制 Markdown';},2400);
      });
    }
    if(target.matches('[data-sf-share-post]')){
      var shareText=(target.dataset.postTitle||document.title)+' — '+location.href,sstatus=document.querySelector('[data-sf-toolbar-status]');
      writeClipboard(shareText).then(function(){
        target.textContent='已复制链接 ✓';if(sstatus)sstatus.textContent='文章链接已复制到剪贴板';
      }).catch(function(){
        target.textContent='复制失败';
      }).finally(function(){
        clearTimeout(toolTimer);toolTimer=setTimeout(function(){if(target.isConnected)target.textContent='分享链接';},2400);
      });
    }
    if(target.matches('[data-sf-anchor-copy]')){
      e.preventDefault();
      var anchorId=target.dataset.sfAnchorCopy,url=location.origin+location.pathname+'#'+encodeURIComponent(anchorId);
      if(history.replaceState)history.replaceState(null,'','#'+encodeURIComponent(anchorId));
      writeClipboard(url).then(function(){
        target.textContent='✓';setTimeout(function(){if(target.isConnected)target.textContent='#';},1800);
      }).catch(function(){});
    }
    if(target.matches('[data-sf-watch-filter]')){
      var feature=target.closest('.sf-feature'),filter=target.dataset.sfWatchFilter,n=0;
      feature.querySelectorAll('[data-sf-watch-filter]').forEach(function(b){b.setAttribute('aria-pressed',String(b===target));});
      feature.querySelectorAll('[data-sf-watch-state]').forEach(function(card){card.hidden=filter!=='all'&&card.dataset.sfWatchState!==filter;if(!card.hidden)n++;});
      var empty=feature.querySelector('[data-sf-watch-empty]');if(empty)empty.hidden=n!==0;
    }
    if(target.matches('[data-sf-friend-filter]')){
      var froot=target.closest('.sf-feature'),ffilter=target.dataset.sfFriendFilter;
      froot.querySelectorAll('[data-sf-friend-filter]').forEach(function(b){b.setAttribute('aria-pressed',String(b===target));});
      froot.querySelectorAll('[data-sf-friend-group]').forEach(function(sec){sec.hidden=ffilter!=='all'&&sec.dataset.sfFriendGroup!==ffilter;});
    }
    if(target.matches('[data-sf-random-friend]')){
      var fcards=Array.from(document.querySelectorAll('.sf-friend[href]')).filter(function(a){return !a.closest('[hidden]');});
      if(fcards.length){var pick=fcards[Math.floor(Math.random()*fcards.length)];window.open(pick.href,'_blank','noopener,noreferrer');}
    }
    if(target.matches('[data-sf-random-refresh]')){
      var rbox=target.closest('[data-sf-random-box]'),rlist=rbox&&rbox.querySelector('[data-sf-random-list]');
      if(rbox&&rlist){
        try{
          var pool=JSON.parse(rbox.dataset.sfPostsPool||'[]');
          for(var j=pool.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1)),tmp=pool[j];pool[j]=pool[k];pool[k]=tmp;}
          rlist.replaceChildren();
          pool.slice(0,3).forEach(function(item){
            var li=document.createElement('li'),a=document.createElement('a'),meta=document.createElement('span');
            a.href=item.url;a.textContent=item.title;
            meta.className='sf-discovery-meta';meta.textContent=(item.cat||'文章')+' · '+(item.date||'');
            li.append(a,meta);rlist.appendChild(li);
          });
        }catch(_){}
      }
    }
    if(target.matches('[data-sf-random-jump]')){
      try{
        var jpool=JSON.parse(target.dataset.sfPostsPool||'[]');
        if(jpool.length){var chosen=jpool[Math.floor(Math.random()*jpool.length)];if(chosen&&chosen.url)location.href=chosen.url;}
      }catch(_){}
    }
    if(target.closest('#leftbar_catalog')&&mobileDetails&&narrow.matches)mobileDetails.open=false;
  });

  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'){
      var dr=document.getElementById('sf-mobile-drawer'),db=document.getElementById('sf-mobile-drawer-btn');
      if(dr&&!dr.hidden){dr.hidden=true;if(db){db.setAttribute('aria-expanded','false');db.focus();}}
    }
  });
  document.addEventListener('sf:player-state',function(e){document.querySelectorAll('[data-sf-song]').forEach(function(b){var yes=e.detail&&e.detail.playing&&b.dataset.sfSong===e.detail.id;b.classList.toggle('sf-is-playing',!!yes);b.setAttribute('aria-pressed',String(!!yes));var icon=b.querySelector('.sf-play-icon');if(icon)icon.textContent=yes?'♫':'▶';});syncToolkitRadioState();});
  document.addEventListener('sf:route',route);window.addEventListener('popstate',route);
  window.addEventListener('storage',function(e){if(e.key===readKey){try{var ids=JSON.parse(e.newValue||'[]');read=Array.isArray(ids)?ids.filter(function(x){return Number.isSafeInteger(x)&&x>0;}).slice(-1000):[];paintRead();}catch(_){}}});
  if(narrow.addEventListener)narrow.addEventListener('change',arrangeCatalog);else narrow.addListener(arrangeCatalog);
  if(window.jQuery)window.jQuery(document).on('pjax:beforeReplace.sfFeatures',cleanup);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
