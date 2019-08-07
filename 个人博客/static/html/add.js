var listItems = $('.list-item')
var rightWraps = $('.right-wrap')

listItems.on('click',function(){
    listItems.removeClass('active')
    $(this).addClass('active')
    var tag = $(this).attr('data-wrap') // 
    rightWraps.removeClass('active')
    $('#' + tag).addClass('active')
}) 