(function($){
  'use strict';
  $(function(){
    var picker;
    $('#sf_choose_cover').on('click',function(){
      if(!window.wp||!wp.media)return;
      if(!picker){
        picker=wp.media({title:'选择音乐封面',button:{text:'使用这张封面'},library:{type:'image'},multiple:false});
        picker.on('select',function(){var a=picker.state().get('selection').first().toJSON();$('#sf_music_cover').val(a.id);$('#sf_cover_preview').empty().append($('<img>',{src:a.sizes&&a.sizes.thumbnail?a.sizes.thumbnail.url:a.url,alt:'已选择的封面',width:150}));});
      }
      picker.open();
    });
    $('#sf_clear_cover').on('click',function(){$('#sf_music_cover').val('0');$('#sf_cover_preview').text('未设置时显示唱片图形');});
  });
})(jQuery);
