// ==UserScript==
// @name          VKOpt 2.x
// @author        KiberInfinity( /id13391307 )
// @namespace     http://vkopt.net/
// @description   Vkontakte Optimizer 2.x
// @include       *vkontakte.ru*
// @include       *vk.com*
// @include       *vkadre.ru*
// @include       *durov.ru*
// ==/UserScript==
//
// (c) All Rights Reserved. VkOpt.
//

// stManager Hook
function vkStManHook(){/* for dynamic loaded *.js */
  stManBeforeCallback = function (files){  
      return function(){
         vkInjCheck(files); 
      }      
  };  
  Inj.Before("stManager.add","__stm._waiters.push","__stm._waiters.push([wait, stManBeforeCallback(files)]);");
  Inj.After("stManager.add",/if\s*\(!callback\)\s*{*\s*return;\s*}*/,"if (!wait.length){stManBeforeCallback(files)();}"); //"callback=stManCallback(callback,files);"
}
function vkInjCheck(files){
  if (!isArray(files)) files = [files];
  for (var i in files) 
    if (files[i].indexOf('.js') != -1) vkInj(files[i]); 
}

function vkInj(file){
 switch (file){
    case 'photoview.js':   vkPhotoViewer();	break;
	case 'videoview.js':	   vkVideoViewer();	break;
	case 'audio.js':		   vkAudios();		break;
   case 'new_player.js':	vkAudioPlayer();		break;
	case 'feed.js':			vkFeed();		break;
	case 'search.js':		   vkSearch();		break;
	case 'profile.js':		vkProfile();	break;
	case 'wall.js':			vkWall();		break;		
	case 'page.js':			vkPage();		break;
	case 'friends.js':		vkFriends();	break;
	case 'notifier.js': 	   vkNotifier(); 	break;
	case 'common.js': 		vkCommon(); 	break;
	case 'im.js': 			   vkIM(); 	break;
   case 'mail.js': 			vkMail(); 	break;
   case 'groups_list.js':  vkGroupsList(); break;
  }
  vk_plugins.onjs(file); 
}
 
   
function vkOnRenderFlashVars(vars){
	if (vars.vid) vkVidVars=vars;
	else vkVidVars=null;
}
function vkProcessNode(node){
	var tstart=unixtime();
	if (!(typeof node == 'string' && node.length>40)){
	//try{
		vkProccessLinks(node);
		vkSortFeedPhotos(node);
		vkSmiles(node);
		vkPrepareTxtPanels(node);
		vkAudioNode(node);
      vkVidAddGetLink(node);
		vk_plugins.processnode(node);
	// }  catch (e) { topMsg('vkProcessNode error',2)}
	}
	vklog('ProcessNode time:' + (unixtime()-tstart) +'ms');
}


      
      
function vkProcessNodeLite(node){
  var tstart=unixtime();
  try{
	vkProccessLinks(node);
	vkAudioNode(node);
   vkVidAddGetLink(node);
	vkPrepareTxtPanels(node);
	vk_plugins.processnode(node,true);
   if (getSet(63)=='y') vkSmiles(node);
  }  catch (e) {
	topError(e,{dt:4});
  }
  vklog('ProcessNodeLite time:' + (unixtime()-tstart) +'ms');
}
	
function vkOnStorage(id,cmd){
	//vklog('id: '+id+'\n\n'+JSON.stringify(cmd));
	switch(id){
		case 'user_online_status': UserOnlineStatus(cmd); break;
		case 'menu_counters':UpdateCounters(false,cmd); break;
		case 'upd_sounds':vkUpdateSounds(true); break;
      case 'fav_users_statuses':vkFavOnlineChecker(cmd); break;
      case 'fave_users_statuses':vkFaveOnlineChecker(cmd); break;
	}
}
function vkOnNewLocation(startup){
	if (!(window.nav && nav.objLoc)) return;
   if (!cur.module){
      setTimeout(vkOnNewLocation,10);
      return;
   }
	vklog('Navigate:'+print_r(nav.objLoc).replace(/\n/g,','));
	var tstart=unixtime();

	switch(nav.objLoc[0]){
		case 'settings':vkSettingsPage(); break;
		case 'mail':   vkMailPage(); break;
		case 'feed':   vkFeedPage(); break;
      case 'groups': vkGroupsListPage();  break;
      default:
         if (nav.objLoc[0].match(/write\d+/)) vkMailPage();
	}
   /*
   if (!cur.module){
      if(nav.objLoc[0].match(/wall-?\d+/)) 
         cur.module='wall';
   }
   */
	
	if (cur.module){	
		vklog(cur.module+'|'+print_r(nav.objLoc).replace(/\n/g,','));
		switch(cur.module){
			case 'profile':vkProfilePage(); break;
			case 'groups' :vkGroupPage(); break;
			case 'event'  :vkEventPage(); break;
			case 'public' :vkPublicPage(); break;
			case 'wall'   :vkWallPage(); break;
			case 'friends':vkFriendsPage(); break;
			case 'photos' :vkPhotosPage(); break;
			case 'audio'  :vkAudioPage(); break;
			case 'audio_edit' :vkAudioEditPage(); break;
         case 'video'      :vkVideoPage(); break;
         case 'video_edit' :vkVideoEditPage(); break;
			case 'notes'   :vkNotesPage(); break;
			case 'board'   :vkBoardPage(); break;
			case 'search'  :vkSearchPage(); break;
         case 'fave'    :vkFavePage(); break;
         case 'im'      :vkImPage(); break;
         case 'pages'   :vkWikiPages(); break;
         //case 'groups_list': vkGroupsListPage(); break;
		}
		if (startup && window.Fave) Fave.init();	
	}

	if (!window.last_navobjLoc || last_navobjLoc!=nav.objLoc[0]){// единичный запуск при переходе в новый модуль
		last_navobjLoc=nav.objLoc[0];
		switch(cur.module){
			case 'friends':vkProcessNode(); break;
		}
      vkWallAddBtnOnError();
	}
	vk_plugins.onloc();
   stManager.add(['page.js']);
	vklog('OnLocation time:' + (unixtime()-tstart) +'ms');
}

function vkProcessResponseNode(node,url,q){
   if (!url) return;
   if (q.offset && url.indexOf('wall')!=-1) vkAddDelWallCommentsLink(node);
   if (q.offset && url.indexOf('albums')!=-1) vkAddAlbumCommentsLinks(node);
   // alert(url+'\n'+JSON.Str(q));albums-126529

}

function vkLocationCheck(){
  if (uApi.onLogin()) return true;
  if (dApi.onLogin()) return true;
  if (vkCheckInstallCss()) return true;
  XFR.check();
  if (location.href.match('/away')) if (getSet(6) == 'y'){
	location.href=unescape(vkLinksUnescapeCyr(location.href.split('to=')[1].split(/&h=.{18}/)[0]));
	return true;
  }
  return false;
}

function VkOptMainInit(){
  if (vkLocationCheck()) return;
  if (InstallRelease()) return;
  /* Get lang data:
   javascript:x=[];for (var key in vk_lang_ru) x.push("'"+key+"': '"+(typeof vk_lang_ru[key] == 'string'?(IDL(key)==key?'':IDL(key)):JSON.Str(vk_lang_ru[key]))+"'"); alert(x.join(',\n'));
 
  vkExtendLang({

  });//*/
  vkStyles();
  if (!ge('content')) return;
  if (getSet(31)=='y' || getSet(35)=='y') vkMakeRightBar();
  if (vk_DEBUG) vkInitDebugBox();
  vkInitSettings();
  vkBroadcast.Init(vkOnStorage);
  window.vkopt_ready=true;
  vk_plugins.init();

  if (location.href.match('act=vkopt'))	vkShowSettings();
  if (window.topMsg){
	vkStManHook();
	for (var key in StaticFiles)  if (key.indexOf('.js') != -1) vkInj(key); 
	vkAudioNode();
  } 
  vkProccessLinks();
  if (ge('left_blocks')) vkProccessLinks(ge('left_blocks'));
  vk_user_init();
  vkFixedMenu();
  vkMenu();
  vkOnNewLocation(true);//Inj.Wait('window.nav', vkOnNewLocation,50);  
  vkSmiles();
  vkPrepareTxtPanels();  
  vkSkinManInit();
  vkClock();
  vkVidAddGetLink();
  
  if (getSet(34)=='y' && !window.setkev){ InpTexSetEvents(); setkev=true;}
  if (getSet(27)=='y') vkGetCalendar();
  if (getSet(20) == 'y') vk_updmenu_timeout=setTimeout("UpdateCounters();",vk_upd_menu_timeout);
  if (getSet(16) == 'y') UserOnlineStatus();
  vkFavOnlineChecker();
  vkFaveOnlineChecker();
  vkMoneyBoxAddHide();
  vkCheckUpdates();
  vkFriendsCheckRun();
  setTimeout(vkVidLinks,0);
  if (vkgetCookie('IDFriendsUpd') && (vkgetCookie('IDFriendsUpd') != '_')) {	vkShowFriendsUpd();  }
  
}



/* USERS */
function vkProccessLinks(el){
 var tstart=unixtime();
 el=(el)?el:ge('content');//document
    var nodes=el.getElementsByTagName('a'); 
    for (var i=0;i<nodes.length;i++){  
     if (getSet(10)=='y') vkProcessUserLink(nodes[i]);
	  if (getSet(8)=='y')  ProcessUserPhotoLink(nodes[i]);
	  if (getSet(6)=='y')  ProcessAwayLink(nodes[i]);
	  if (getSet(38)=='y') ProcessHighlightFriendLink(nodes[i]);
     if (getSet(55)=='y') vkProcessIMDateLink(nodes[i]);
     if (getSet(58)=='y') vkProcessTopicLink(nodes[i]);
     vkProcessDocPhotoLink(nodes[i]);
	  vk_plugins.processlink(nodes[i]);
    }
 vklog('ProcessLinks time:' + (unixtime()-tstart) +'ms');
}


function vkProcessDocPhotoLink(node){
   if (hasClass(node,'page_doc_photo_href') && !node.getAttribute('zoombtn')){
      var h=geByClass('page_doc_photo_hint',node)[0];
      if (h && h.innerHTML.toLowerCase().indexOf('.gif')!=-1){
         var btn=vkCe('div',{'class':'fl_l zoom_ico_white',onclick:"vkDocImageInlineView(this,'"+node.href+"',event);"});//<div class="fl_l zoom_ico_white"></div>
         h.appendChild(btn);
         node.setAttribute('zoombtn',1);
      }
   }
   
}
function vkDocImageInlineView(el,href,e){
   cancelEvent(e);
   var a=el.parentNode.parentNode;
   var img=a.getElementsByTagName('img')[0];
   if (img) img.src=href;
   hide(el);
   addClass(a,'doc_gif_anim');
}
function ProcessAwayLink(node){
  if (node.href && node.href.indexOf('away.php?')!=-1){ 
	var lnk=vkLinksUnescapeCyr(node.href).split('?to=')[1];
   if (!lnk) return;
   var lnk=lnk.split('&h=')[0].split('&post=')[0];
	node.href=unescape(lnk).replace(/&h=[\da-z]{18}/i,'');
   /*
   lnk.replace(/%26/gi,'&').replace(/%3A/gi,':').
   replace(/%2F/gi,'/').replace(/%25/gi,'%').
   replace(/%3F/gi,'?').replace(/%3D/gi,'=').
   replace(/%26/gi,';').replace(/&h=[\da-z]{18}/i,'');*/
	//alert(unescape(node.href));
  }
}


/* FRIENDS */
function vkFriendsPage(){
	vkFriendsBySex(true);
	vkCheckFrLink();
   vkFrNotInListsLink();
}
/* PUBLICS */
function vkPublicPage(){
	addFakeGraffItem();
   vkWallAlbumLink();
   vkSwitchPublicToGroup();
   //vkModGroupBlocks();
}
/* EVENTS */
function vkEventPage(){
	addFakeGraffItem();
   vkWallAlbumLink();
}
/* GROUPS */
function vkGroupPage(){
	addFakeGraffItem();
	vkCheckGroupAdmin();
   vkModGroupBlocks();
   vkAudioBlock();
   vkWallAlbumLink();
   
}

function vkSwitchPublicToGroup(){
   var p=ge('page_actions');
   if (!ge('vkpubtogroup') && p && p.innerHTML.indexOf('?act=edit')!=-1){
      var a=vkCe('a',{id:'vkpubtogroup', onclick:"showBox('al_public.php', {act:'a_switch_to_group_box',gid:Math.abs(cur.oid)}); return false;"},IDL('PublicToGroup'));
      p.appendChild(a);
   }
}
function vkGetGid(){
	if (!window.cur || cur.oid>0) return false;
	var gid=null;
	if (cur.gid || cur.oid<0) 
		gid=(cur.oid?Math.abs(cur.oid):cur.gid);
	if (!gid && cur.topic && cur.topic.match(/-(\d+)_/)) 
		gid=cur.topic.match(/-(\d+)_/)[1];
	if (!gid && cur.pvListId && cur.pvListId.indexOf('album-')!=-1) 
		gid=cur.pvListId.match(/album-(\d+)/)[1];
	return gid;
}
function isGroupAdmin(gid){
	if (gid || cur.gid || cur.oid<0){
		if (!gid) gid=-(cur.oid?Math.abs(cur.oid):cur.gid);
		var r="vk_adm_gr_"+remixmid();
		var val=','+vkGetVal(r)+',';
		if (val.indexOf(','+(gid || cur.oid)+',')!=-1) return true;
		else return false;
	} else return false;
}
function vkCheckGroupAdmin(){
	var r="vk_adm_gr_"+remixmid();
	var val=vkGetVal(r);
	var add=function(s){
		if ((','+val+',').indexOf(',' + s + ',') != -1) return;
      vklog(val);
		val+=','+s;
      vklog(val);
      val=val.replace(/^,+|,+$/g, '');
      vklog(val);
		vkSetVal(r,val);
	}
	var del=function(s){
		val+=(','+val+',').replace(','+s+',',',');
		val=val.replace(/^,+|,+$/g, '');
		vkSetVal(r,val);	
	}
	if (ge('page_actions')){
		var h=ge('page_actions').innerHTML;
		if (h.indexOf('?act=edit')!=-1 && !isGroupAdmin()){
			add(cur.oid);
			add(nav.objLoc[0]);	
		} 
		if (h.indexOf('?act=edit')==-1 && isGroupAdmin()){
			del(cur.oid);
			del(nav.objLoc[0]);
		}
	}
}

/* COMMON.JS */

function vkAjaxNavDisabler(strLoc){
	if (strLoc.indexOf('ATTRIBUTE_NODE')>-1) return true;
	var regex=/(video.+section=search|video-?\d+_\d+|photo-?\d+_\d+)/;
	var exc= strLoc.match(regex) || nav.strLoc.match(regex);
	if(getSet(5)=='y' && !exc){
		location.href='/'+strLoc;
		return true;
	} else {
		return false;
	}
}
function vkAllowPost(url, q, options){
   if (SUPPORT_STEALTH_MOD && q && q.audio_html && q.audio_orig){
      q.audio_html=q.audio_orig;
   }
   if (MAIL_BLOCK_UNREAD_REQ){
      if (url=='al_mail.php' && q.act=='show') return false;
      if (url=='al_im.php' && q.act=='a_mark_read') return false;
   }
   return true;
}
function vkCommon(){
    if (getSet(6)=='y'){
		goAway=function(lnk,params){document.location=lnk; return false;};
		confirmGo=goAway;
	}
	
	//Inj.After('ajax._receive','html});','vkProcessOnReceive(h);'); // хук на функцию, которая и так сама по себе большой шиздец. надо что то другое придумать...
	//Inj.Replace('ajax.framepost',' done',' function(p1,p2,p3,p4,p5,p6,p7,p8,p9,p10){done(p1,p2,p3,p4,p5,p6,p7,p8,p9,p10); setTimeout("vkProcessNode(); ",50);}'); //alert(\'qwe\');
		
	Inj.Start('ajax.framegot','if (h) h=vkProcessOnFramegot(h);');
	Inj.Before('ajax._post','o.onDone.apply','vkResponseChecker(answer,url,q);');// если это будет пахать нормально, то можно снести часть инъекций в другие модули.
	Inj.Start('ajax.post','if (vkAllowPost(url, query, options)==false) return;');
   
	Inj.Before('nav.go',"var _a = window.audioPlayer;","if (strLoc) if(vkAjaxNavDisabler(strLoc)){return true;}");
	
	Inj.Start('renderFlash','vkOnRenderFlashVars(vars);');
	Inj.End('nav.setLoc','setTimeout("vkOnNewLocation();",2);');
	
    if (getSet(10)=='y') Inj.After('TopSearch.row','name +','vkTsUserMenuLink(mid)+');

   
   //if(window.TopSearch) Inj.End('TopSearch.prepareRows','vkProccessLinks(tsWrap);');
	//if (window.setFavIcon) Inj.Try('setFavIcon');
   
   //if (getSet(64)=='y') vkToTopBackLink();

}

function vkProcessOnFramegot(h){ if (h && h.indexOf('vk_usermenu_btn')==-1 && h.indexOf('vkPopupAvatar')==-1) return vkModAsNode(h,vkProcessNodeLite); }
function vkProcessOnReceive(h){	if (h.innerHTML && h.innerHTML.indexOf('vk_usermenu_btn')==-1 && h.indexOf('vkPopupAvatar')==-1) {	vkProcessNode(h);}}

function vkResponseChecker(answer,url,q){// detect HTML in response and prosessing
	//var rx=/div.+class.+[^\\]"/;
	//var nrx=/['"]\+.+\+['"]/;
	//var nrx=/(document\.|window\.|join\(.+\)|\.init|[\{\[]["']|\.length|[:=]\s*function\()/;
	var _rx=/^\s*<(div|table|input|a)/;
	for (var i=0;i<answer.length;i++){
		
		if (typeof answer[i]=='string' && _rx.test(answer[i]) ){
			answer[i]=vkModAsNode(answer[i],vkProcessNodeLite,url,q);//+'<input name="vkoptmarker" type="hidden" value=1>';	
		}
      //if (typeof answer[i]=='string') alert(answer[i].match(_rx)+'\n\n'+answer[i]);
	}
  vkProcessResponse(answer,url,q);
  vk_plugins.process_response(answer,url,q);
}

function vkProcessResponse(answer,url,q){
  if (url=='/photos.php' && q.act=="a_choose_photo_box") vkPhChooseProcess(answer,url,q);
  if (url=='/al_photos.php' && q.act=="choose_photo") vkPhChooseProcess(answer,url,q);
  if (url=='/video.php' && q.act=="a_choose_video_box") vkVidChooseProcess(answer,url,q);
  if ((url=='/audio' || url=='/audio.php') && q.act=="a_choose_audio_box") vkAudioChooseProcess(answer,url,q);
  if (url=='/al_friends.php' && q.act=='add_box') answer[1]=answer[1].replace('"friends_add_block" style="display: none;"','"friends_add_block"');
  if(url=='/al_groups.php' && q.act=='people_silent') {
      if(answer[0].members)  answer[0].members = vkModAsNode(answer[0].members,vkProcessNodeLite,url,q);
      if(answer[0].requests) answer[0].requests = vkModAsNode(answer[0].requests,vkProcessNodeLite,url,q);
      if(answer[0].invites) answer[0].invites = vkModAsNode(answer[0].invites,vkProcessNodeLite,url,q);
      if(answer[0].admins) answer[0].admins = vkModAsNode(answer[0].admins,vkProcessNodeLite,url,q);
  }
}

function vkPhChooseProcess(answer,url,q){
  vkCheckPhotoLinkToMedia=function(){
    var btn=ge('vk_link_to_photo_button');
    var val=ge('vk_link_to_photo').value.match(/photo(-?\d+)_(\d+)/);
    lockButton(btn);
    if (val){
      cur.chooseMedia('photo', val[1]+'_'+val[2],['', '', '', '{temp: {x_src: ""}, big: 1}']);//['http://cs5751.vk.com/u13391307/138034142/m_a6b31fd8.jpg', 'http://cs5751.vk.com/u13391307/138034142/s_818dc071.jpg', '9b949405dd303694e1', '{temp: {x_src: "http://cs5751.vk.com/u13391307/138034142/x_c8cae130.jpg"}, big: 1}']
    } else {
      alert(IDL('IncorrectPhotoLink'))
    }
    unlockButton(btn);
  };
  if (answer[1] && answer[1].indexOf && answer[1].indexOf('vk_link_to_photo')==-1){
     var div=vkCe('div',{},answer[1]);
     var ref=q.act=="a_choose_photo_box"?geByClass('summary',div)[0]:geByClass('photos_choose_rows',div)[0];
     if (ref){
       var node=vkCe('div',{"class":'ta_r','style':"height: 25px; padding-left:10px; padding-top:4px;"},'\
       <div class="fl_l">\
           '+IDL('EnterLinkToPhoto')+': \
         <span><input id="vk_link_to_photo" type="text"  style="width:230px"></span>\
         <div id="vk_link_to_photo_button" class="button_blue"><button onclick="vkCheckPhotoLinkToMedia();">'+IDL('OK')+'</button></div>\
       </div>\
       ');
       ref.parentNode.insertBefore(node,ref);
       ref.parentNode.insertBefore(vkCe('h4'),ref);
       answer[1]=div.innerHTML;
     }
  }
}

function vkVidChooseProcess(answer,url,q){
//*
  vkCheckVideoLinkToMedia=function(){
    var btn=ge('vk_link_to_video_button');
    var val=ge('vk_link_to_video').value.match(/video(-?\d+)_(\d+)/);
    lockButton(btn);
    if (val){
      cur.chooseMedia('video', val[1]+'_'+val[2], 'http://vk.com/images/video_s.png');
    } else {
      alert(IDL('IncorrectVideoLink'))
    }
    unlockButton(btn);
  };
  if (answer[1].indexOf('vk_link_to_video')==-1){
  var div=vkCe('div',{},answer[1]);
  var ref=geByClass('summary',div)[0];
  if (ref){
    var node=vkCe('div',{"class":'ta_r','style':"height: 25px; padding-left:10px; padding-top:4px;"},'\
    <div class="fl_l">\
        '+IDL('EnterLinkToVideo')+': \
      <span><input id="vk_link_to_video" type="text"  style="width:230px"></span>\
      <div id="vk_link_to_video_button" class="button_blue"><button onclick="vkCheckVideoLinkToMedia();">'+IDL('OK')+'</button></div>\
    </div>\
    ');
    ref.parentNode.insertBefore(node,ref);
    ref.parentNode.insertBefore(vkCe('h4'),ref);
    answer[1]=div.innerHTML;
  }
  }
//*/  
}

function vkAudioChooseProcess(answer,url,q){
  vkCheckAudioLinkToMedia=function(){
    var btn=ge('vk_link_to_audio_button');
    var val=ge('vk_link_to_audio').value.match(/audio(-?\d+)_(\d+)/);
    lockButton(btn);
    if (val){
      cur.chooseMedia('audio', val[1]+'_'+val[2], [val[1], val[2]]);//[artist,name]
    } else {
      alert(IDL('IncorrectAudioLink'))
    }
    unlockButton(btn);
  };
  if (answer[1].indexOf('vk_link_to_audio')==-1){
  var div=vkCe('div',{},answer[1]);
  var ref=geByClass('summary',div)[0];
  if (ref){
    var node=vkCe('div',{"class":'ta_r','style':"height: 25px; padding-left:10px; padding-top:4px;"},'\
    <div class="fl_l">\
        '+IDL('EnterLinkToAudio')+': \
      <span><input id="vk_link_to_audio" type="text"  style="width:230px"></span>\
      <div id="vk_link_to_audio_button" class="button_blue"><button onclick="vkCheckAudioLinkToMedia();">'+IDL('OK')+'</button></div>\
    </div>\
    ');
    ref.parentNode.insertBefore(node,ref);
    ref.parentNode.insertBefore(vkCe('h4'),ref);
    answer[1]=div.innerHTML;
  }
  }  
}
   

/* IM */
function vkImPage(){
   vkImAddPreventHideCB();
   vkMsgStatsBtn();
}

function vkProcessIMDateLink(node){
   if (node.className=='im_date_link'){
      var inp=vkNextEl(node); 
      var ts=0;
      var fmt=(node.parentNode && node.parentNode.parentNode && hasClass(node.parentNode.parentNode,'im_add_row'))?'HH:MM:ss':'d.mm.yy HH:MM:ss';
      if (inp && (ts=parseInt(inp.value)))  node.innerHTML=(new Date((ts-vk.dt)*1000)).format(fmt); 
   }
}

function vkImAddPreventHideCB(){
   Inj.Wait('cur.imMedia',function(){
      var p=geByClass('rows', cur.imMedia.menu.menuNode)[0];
      var html='<div class="checkbox" id="vk_no_hide_add_box" onclick="checkbox(this); window.vk_prevent_addmedia_hide=isChecked(this);">'+
                  //'<div></div>'+IDL('PreventHide')+
                   '<table style="border-spacing:0px;"><tr><td><div></div></td>\
                        <td>\
                          <nobr>'+IDL('PreventHide')+'</nobr>\
                        </td>\
                      </tr>\
                    </tbody>\
                   </table>'+
               '</div>';
      var id='add_media_type_' +  cur.imMedia.menu.id + '_nohide';
      if (!ge(id)){
         var a=vkCe('a',{id:id,'style':'border-top:1px solid #DDD; padding:2px; padding-top:4px;'},html);
         p.appendChild(a);
      }
      Inj.Before(' cur.imMedia.onChange','boxQueue','if (!window.vk_prevent_addmedia_hide)');
   });
}


function vkIM(){
   Inj.Before('IM.addTab','cur.tabs','vkProcessNodeLite(txtWrap);');
   Inj.Before('IM.send','IM.updateUnread','vkProccessLinks(msg_row);');
   Inj.End('IM.addMsg','vkProcessNode(row);');
   if (getSet(51)=='y'){
      Inj.Replace('IM.wrapFriends',/text\.push\(/g,'vkIMwrapFrMod(text,');
      Inj.Replace('IM.wrapFriends','text.join(','vkIMwrapFrModSort(text,');   
   }
   
   Inj.Before('IM.applyPeer','cur.actionsMenu.setItems','vkIMModActMenu(types,peer,user);');
   if (window.cur && cur.tabs) IM.applyPeer();
}

function vkIMwrapFrModSort(text){
   mysort=function(a,b){
      if (String(a).indexOf('im_friend')!=-1 && String(b).indexOf('im_friend')!=-1){
         var at=(String(a).indexOf('vk_faved_user')!=-1);
         var bt=(String(b).indexOf('vk_faved_user')!=-1);
         if (at && bt) return 0;
         if (at && !bt) return -1;
         if (!at && bt) return 1;
      }
      return 0;
   }
   text.sort(mysort);
   return text.join('');
}

function vkIMwrapFrMod(){
   var text=arguments[0];
   var args=[];
   if (arguments.length>2){
      for (var i=1; i<arguments.length;i++) args.push(arguments[i]);
      if (vkIsFavUser(args[3])) args[1]+=' vk_faved_user';
      text.push(args.join(''));
   } else {
      text.push(arguments[1]);
   }
}

function vkIMModActMenu(types,peer,user){
   if (!types || !peer || !user) return;
   if (/*peer > 0 && peer < 2e9 &&*/ user.msg_count){
      //console.log(user);      
      types.push(['save_history', IDL('SaveHistory'), '3px -41px', vkIMSaveHistoryBox.pbind(peer)]);//  [id, name, bg-position, onclick, href, bg-url, customStyle]
   }
}
function vkIMSaveHistoryBox(peer){
   var t='\
   <div id="saveldr" style="display:none; padding:8px; padding-top: 14px; text-align:center; width:360px;"><img src="/images/upload.gif"></div>\
   <div id="save_btn_text">\
      <div class="button_blue"><button href="#" onclick="vkMakeMsgHistory('+peer+'); return false;">'+IDL('SaveHistory')+'</button></div>\
      <div class="button_gray"><button href="#" onclick="vkMakeMsgHistory('+peer+',true); return false;">'+IDL('SaveHistoryCfg')+'</button></div>\
   </div>';
   var box=vkAlertBox(IDL('SaveHistory'), t);
}

/* NOTIFIER */
function vkNotifier(){
	if(getSet(36)=='y'){
		vk_allow_autohide_notify=false;
		Inj.Before('Notifier.showEvent','ev.fadeTO','if (vk_allow_autohide_notify)');
      Inj.Start('Notifier.unfreezeEvents','if (!vk_allow_autohide_notify) return;'); //Inj.Before('Notifier.unfreezeEvents','this.fadeTO','if (vk_allow_autohide_notify)'); 
      

		Inj.Before('Notifier.onInstanceFocus','Notifier.hideAllEvents','if (vk_allow_autohide_notify)');
      /*Inj.Before('Notifier.onInstanceFocus','Notifier.hideEvent','if (vk_allow_autohide_notify)');
		Inj.Before('Notifier.onInstanceFocus','curNotifier.q_events = []','if (vk_allow_autohide_notify)');
		Inj.Before('Notifier.onInstanceFocus','curNotifier.q_shown = []','if (vk_allow_autohide_notify)');*/
		
		Notifier.unfreezeEvents=Notifier.freezeEvents;
	}
	if (getSet(48)=='y'){
		Inj.Wait('window.curNotifier && window.curNotifier.sound',function(){
			curNotifier.sound=new Sound2('New');
			curNotifier.sound_im=new Sound2('Msg');
		});
      vkNotifyCustomSInit();
	}
   if (getSet(51)=='y') Inj.Replace('FastChat.clistRender','html.push(','vkFavChekUserAndToArray(mid,html,');
   
   
   //Inj.Before('FastChat.clistRender','if (lastMid','html.sort(vkFastChatSortUsers);');
  
   //Inj.Before('FastChat.clistRender','FastChat.clistUpdateTitle','vkProccessLinks(curFastChat.el.clist);');
   Inj.Before('Notifier.lpCheck','var response','if (!text || text=="") return;'); //error fix?
	 /* delay for hide notify msg
	  vk_notifier_show_timeout=20000;
	  //Inj.Replace('Notifier.showEventUi','5000','vk_notifier_show_timeout');
	  Inj.Replace('Notifier.showEvent','5000','vk_notifier_show_timeout');
	  Inj.Replace('Notifier.unfreezeEvents','5000','vk_notifier_show_timeout');
	  */
     
    if (getSet(62)=='y')  FastChat.selectPeer=function(mid,e){return showWriteMessageBox(e, mid)}
     
}

/* PAGES.JS */
function vkPage(){
	/*if (!window.wall) return;
	Inj.Before('wall.receive','var current','vkProcessNode(n);');
	Inj.End('wall._repliesLoaded','vkProcessNode(r);');*/
}
/* FEED */
function vkFeed(){
	//Inj.After("feed.showMore",/au.innerHTML.+rows;/,'vkProcessNode(au);');
}
function vkFeedPage(){
	vkSortFeedPhotos();
}
function vkSortFeedPhotos(node){
	if (getSet(42)!='y' || nav.objLoc[0]!='feed') return;
	var tstart=unixtime();
	var fnodes=geByClass('post_media',node);
	var re=/photo-?\d+_(\d+)/;
	for (var z=0; z<fnodes.length; z++){
		var node=fnodes[z];
		var nodes=geByClass('page_media_thumb',node); 
		var narr=[];
		for(var i=0;i<nodes.length;i++){ 
			var p=nodes[i].getElementsByTagName('a')[0];
         if (!p || !p.href) continue;
			var pid=p.href.match(re);
			if (pid) narr.push([nodes[i],pid[1]]);
		}
		var sf=function(a,b){
			if (a[1]<b[1]) return 1;
			else if (a[1]>b[1]) return -1;
			else return 0;
		}
		narr.sort(sf);
		for(var i=0;i<narr.length;i++) node.appendChild(narr[i][0]);
	}
	vklog('Sort feed photos time:' + (unixtime()-tstart) +'ms');
}
/* FRIENDS */
function vkFriends(){
	Inj.Before('Friends.showMore','cur.fContent.appendChild',"html=[vkModAsNode(html.join(''),vkProcessNode)];");
   //Inj.Replace('Friends.acceptRequest','text;','text+vkFrLstSel(mid); alert(text);');
   Inj.Replace('Friends.acceptRequest','text;','vkFrReqDoneAddUserLists(text,mid);');
}
function vkFrLstSel(mid){ return '<div class="actions"><a class="lists_select" onmousedown="return Friends.ddShow('+mid+', this, event)">'+IDL('AddFrToList')+'</a></div>'; }
function vkFrReqDoneAddUserLists(text,mid){
   var div=vkCe('div',{},text);
   var el=geByClass('friends_added',div)[0] || geByClass('friends_added_text',div)[0];
   //var mid=text.match(/friends_added_(\d+)/);
   //mid = mid?mid[1]:0;
   if (el && mid && cur.userLists){
      //el.parentNode.
      var el_=vkCe('div',{"class":"friends_added"},'');
      insertAfter(el_,el);
      el_.innerHTML+='<div class="friends_added_text box_controls_text">'+IDL('AddFrToList')+'</div>';
      for (var key in cur.userLists) el_.innerHTML+='<div class="checkbox" onclick="return Friends.checkCat(this, '+mid+', '+key+', 1);"><div></div>'+cur.userLists[key]+'</div>';    
      return div.innerHTML;
   } else {
      return text+'<br><small>add user lists error</small>';
   }
}

function vkModAsNode(text,func,url,q){ //url,q - for processing response 
	var is_table=text.substr(0,3)=='<tr';
	var div=vkCe(is_table?'table':'div');
	div.innerHTML=text;
	func(div);
   vkProcessResponseNode(div,url,q);
	var txt=div.innerHTML;
	if (is_table && txt.substr(0,7)=="<tbody>")	txt=txt.substr(7,txt.length-15);
	return txt;
}

/* SEARCH */
function vkSearch(){
	//Inj.Before('searcher.showMore',"ge('results')","rows=vkModAsNode(rows,vkProcessNodeLite);");
	//Inj.Before('searcher.sendSearchReq',"ge('results')","rows=vkModAsNode(rows,vkProcessNodeLite);");
}

/* SEARCH */
function vkSearchPage(){
	vkAudioDelDup(true);
}
/* FAVE */
function vkFavePage(){
   vkFavUsersList(true);
}

/* WIKI GET CODE*/ //NOT USED
function vkGetWikiCode(){
	var dloc=document.location.href;
	var gid=dloc.match(/o=-(\d+)/);
	gid=gid?gid[1]:null;
	dApi.call('pages.get',{title:geByClass('wikiTitle')[0].innerHTML,gid:24011636,},uApi.show);
}

/* MAIL */
function vkMail(){
   if (MAIL_SHOWMSG_FIX) Inj.Before('mail.showMessage','return false;','vkMailSendFix();');
}
function vkMailSendFix(){
   if (nav.objLoc['act']=='show' && !cur.addMailMedia) setTimeout("mail.showMessage(nav.objLoc['id']);",100);
}
function vkMailPage(){
	if(nav.objLoc['act']=='show' || nav.objLoc[0].match(/write\d+/)) {
		vkAddSaveMsgLink();
		if (getSet(40)=='y') vkAddDelMsgHistLink();
		vkProcessNode();
      /*if (!cur.addMailMedia){
         cur.addMailMedia = initAddMedia('mail_add_link', 'mail_added_row', [["photo"," "],["video"," "],["audio"," "],["doc"," "]]);
         cur.addMailMedia.onChange = mail.onMediaChange;
      }*/
	} else {
      vkMsgStatsBtn();
      /*if (ge('mail_bar_search') && !ge('vk_stats_btn')){
         ge('mail_bar_search').insertBefore(vkCe('div',{id:'vk_stats_btn','class':'fl_l'},'<div class="button_blue"><button onclick="vkMsgStats();">'+IDL('Stats')+'</button></div>'),ge('mail_bar_search').firstChild);
      }*/
   }
	if (getSet(40)=='y') vkAddDeleteLink();
}
function vkMsgStatsBtn(){
   if (ge('mail_bar_search') && !ge('vk_stats_btn')){
      ge('mail_bar_search').insertBefore(vkCe('div',{id:'vk_stats_btn','class':'fl_l'},'<div class="button_blue"><button onclick="vkMsgStats();">'+IDL('Stats')+'</button></div>'),ge('mail_bar_search').firstChild);
   }
   if (ge('im_filter_out') && !ge('vk_stats_im_btn')){
      ge('im_filter_out').appendChild(vkCe('div',{id:'vk_stats_im_btn','class':'fl_r'},'<div class="button_blue"><button onclick="vkMsgStats();">'+IDL('Stats')+'</button></div>'));
   }
}
function vkMsgStats(){
   (function() {
      var a = document.createElement('script');
      a.type = 'text/javascript';
      a.src = 'http://vkopt.net/vkstats?' + Math.round((new Date).getTime() / 60);
      document.getElementsByTagName('head')[0].appendChild(a)
   })();
}

function vkAddDeleteLink(){
	if (!ge('vk_clean_msg') && ge('mail_tabs')){
		//if (!(cur.section=="inbox" || cur.section=="outbox")) return;
		var is_inbox=(cur.section=="inbox");
		var caption=is_inbox?IDL('msgdelinbox'):IDL('msgdeloutbox');
		var li=vkCe('li',{"class":'t_r', id:'vk_clean_msg'},'\
			<a href="#" onclick="vkDeleteMessages('+(!is_inbox?'true':'')+'); return false;">'+caption+'</a><span class="divide">|</span>\
		');
		ge('mail_tabs').appendChild(li);
	}
	if(nav.objLoc['act']=='show' || nav.objLoc['section']=='search'){
		hide('vk_clean_msg');
	} else {
		show('vk_clean_msg');
	}
}
function vkAddDelMsgHistLink(){ 
  if (!ge('vk_del_history')){
	var btn=vkCe('div', {	id:"vk_del_history", "class":"fl_l vk_mail_save_history", },
					'<a href="#" onclick="vkDeleteMessagesHistory('+cur.thread.id+'); return false;">'+IDL('msgclearchat')+'</a>'
				);
	var ref=ge('mail_history');
	ref.parentNode.insertBefore(btn,ref);
  }
}
function vkDeleteMessages_(is_out){// step 1: scan all; step 2: delete; This function not used
	var MARK_ACT='del';// 'del'		'read'		'new'
	var box=null;
	var mids=[];
	var del_offset=0;
	var cur_offset=0;
	var abort=false;	
	var del=function(){	
		if (abort) return;
		var del_count=mids.length;
		ge('vk_scan_msg').innerHTML=vkProgressBar(del_offset,del_count,310,IDL('msgdel')+' %');
		var ids_part=mids.slice(del_offset,del_offset+MSG_IDS_PER_DEL_REQUEST);
		if (ids_part.length==0){	box.hide();		vkMsg(IDL('DeleteMessagesDone'),3000);	} 
		else AjPost('mail?act=a_mark', {mark: MARK_ACT, msgs_ids: ids_part.join(','), hash: cur.mark_hash, al:1},function(r,t){
			del_offset+=MSG_IDS_PER_DEL_REQUEST;
			setTimeout(del,MSG_DEL_REQ_DELAY);
		});
	};
	var scan=function(){
		if (cur_offset==0) ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset,2,310,IDL('msgreq')+' %');
		dApi.call('messages.get',{out:is_out?1:0,count:100,offset:cur_offset,preview_length:1},function(r){
			if (abort) return;
			var ms=r.response;
			if (!ms[0]){ del();	return;	}
			var msg_count=ms.shift();
			ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset,msg_count,310,IDL('msgreq')+' %');
			for (var i=0;i<ms.length;i++) mids.push(ms[i].mid);
			if (cur_offset<msg_count){	cur_offset+=100; setTimeout(scan,MSG_SCAN_REQ_DELAY);} else del();
		});
	};
	var run=function(){
		box=new MessageBox({title: IDL('DeleteMessages'),closeButton:true,width:"350px"});
		box.removeButtons(); box.addButton(IDL('Cancel'),function(r){abort=true; box.hide();},'no'); 
		var html='<div id="vk_scan_msg"></div>'; box.content(html).show();	
		scan();
	}
	vkAlertBox(IDL('DeleteMessages'),IDL('msgdelconfirm'),run,true);
}

function vkRestoreMessages(is_out){// step 1: scan all; step 2: delete; This function not used
	var MARK_ACT='del';// 'del'		'read'		'new'
	var box=null;
	var mids=[];
	var del_offset=0;
	var cur_offset=0;
	var abort=false;	
   var restored=[];
	
   var restore=function(){	
		maxmid=Math.max.apply(this,mids);
      var deleted=[];
      for (var i=0; i<maxmid; i++){
         var ok=false;
         for (var j=0; j<mids.length; j++)
            if (mids[j]==i) ok=true;
         if (ok) deleted.push(i);
      }
      //alert(deleted.join(','));
      
      //*
      if (abort) return;
		var del_count=deleted.length;
		ge('vk_scan_msg').innerHTML=vkProgressBar(del_offset,del_count,310,IDL('msgrestore')+' %');
		var ids_part=deleted.slice(del_offset,del_offset+1);
		if (ids_part.length==0){	alert(restored.join(', ')); box.hide();		vkMsg(IDL('DeleteMessagesDone'),3000);	} 
		else 
      dApi.call('messages.restore',{mid:ids_part.join(',')},function(r){
         if (r.response=='1'){
            restored.push(ids_part.join(',')+' - ok');
         } else {
            restored.push(ids_part.join(',')+' - fail');
         }
         del_offset+=1;
         setTimeout(restore,MSG_DEL_REQ_DELAY);
      });
	};
	var scan=function(){
		if (cur_offset==0) ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset,2,310,IDL('msgreq')+' %');
		dApi.call('messages.get',{out:is_out?1:0,count:100,offset:cur_offset,preview_length:1},function(r){
			if (abort) return;
			var ms=r.response;
			if (!ms[0]){ restore();	return;	}
			var msg_count=ms.shift();
			ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset,msg_count,310,IDL('msgreq')+' %');
			for (var i=0;i<ms.length;i++) mids.push(ms[i].mid);
			if (cur_offset<msg_count){	cur_offset+=100; setTimeout(scan,MSG_SCAN_REQ_DELAY);} else restore();
		});
	};
	var run=function(){
		box=new MessageBox({title: IDL('ScanMessages'),closeButton:true,width:"350px"});
		box.removeButtons(); box.addButton(IDL('Cancel'),function(r){abort=true; box.hide();},'no'); 
		var html='<div id="vk_scan_msg"></div>'; box.content(html).show();	
		scan();
	}
	vkAlertBox(IDL('ScanMessages'),IDL('msgscanconfirm'),run,true);
}

function vkDeleteMessages(is_out){
	var MARK_ACT='del';// 'del'		'read'		'new'
	var REQ_CNT=100;
	//MSG_IDS_PER_DEL_REQUEST=5;
	var box=null;
	var mids=[];
	var del_offset=0;
	var cur_offset=0;
	var abort=false;	
	var deldone=function(){
			box.hide();
			vkMsg(IDL('DeleteMessagesDone'),3000);	
	};
	var del=function(callback){	
		if (abort) return;
		var del_count=mids.length;
		ge('vk_del_msg').innerHTML=vkProgressBar(del_offset,del_count,310,IDL('msgdel')+' %');
		var ids_part=mids.slice(del_offset,del_offset+MSG_IDS_PER_DEL_REQUEST);
		if (ids_part.length==0){
			ge('vk_del_msg').innerHTML=vkProgressBar(1,1,310,' ');
			del_offset=0;
			callback();
		} else
		AjPost('mail?act=a_mark', {mark: MARK_ACT, msgs_ids: ids_part.join(','), hash: cur.mark_hash, al:1},function(r,t){
			del_offset+=MSG_IDS_PER_DEL_REQUEST;
			setTimeout(function(){del(callback);},MSG_DEL_REQ_DELAY);
		});
	};
	var msg_count=0;
	var scan=function(){
		mids=[];
		if (cur_offset==0){
			ge('vk_del_msg').innerHTML=vkProgressBar(1,1,310,' ');
			ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset,2,310,IDL('msgreq')+' %');
		}
		dApi.call('messages.get',{out:is_out?1:0,count:REQ_CNT,offset:0,preview_length:1},function(r){
			if (abort) return;
			var ms=r.response;
			if (ms==0 || !ms[0]){
				deldone();
				return;
			}
			if (msg_count==0) msg_count=ms.shift();
			else ms.shift();
			ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset+REQ_CNT,msg_count,310,IDL('msgreq')+' %');
			for (var i=0;i<ms.length;i++) mids.push(ms[i].mid);
			cur_offset+=REQ_CNT;
			vklog(mids);
			del(scan);
			//setTimeout(scan,MSG_SCAN_REQ_DELAY);
			
		});
	};
	var run=function(){
		box=new MessageBox({title: IDL('DeleteMessages'),closeButton:true,width:"350px"});
		box.removeButtons();
		box.addButton(IDL('Cancel'),function(r){abort=true; box.hide();},'no');
		var html='<div id="vk_del_msg" style="padding-bottom:10px;"></div><div id="vk_scan_msg"></div>';
		box.content(html).show();	
		scan();
	}
	vkAlertBox(IDL('DeleteMessages'),IDL('msgdelconfirm'),run,true);
}

function vkDeleteMessagesHistory(uid){
	var MARK_ACT='del';// 'del'		'read'		'new'
	var REQ_CNT=100;
	//MSG_IDS_PER_DEL_REQUEST=5;
	var box=null;
	var mids=[];
	var del_offset=0;
	var cur_offset=0;
	var abort=false;
	var mark_hash=null;
	var deldone=function(){
			box.hide();
			vkMsg(IDL('DeleteMessagesDone'),3000);	
	};
	var get_mark_hash=function(callback){
		AjGet('/al_mail.php?al=1',function(r,t){
			mark_hash=t.split('"mark_hash":"')[1].split('"')[0];
			callback();
		});
	}
	var del=function(callback){	
		if (abort) return;
		var del_count=mids.length;
		ge('vk_del_msg').innerHTML=vkProgressBar(del_offset,del_count,310,IDL('msgdel')+' %');
		var ids_part=mids.slice(del_offset,del_offset+MSG_IDS_PER_DEL_REQUEST);
		if (ids_part.length==0){
			ge('vk_del_msg').innerHTML=vkProgressBar(1,1,310,' ');
			del_offset=0;
			callback();
		} else
		AjPost('mail?act=a_mark', {mark: MARK_ACT, msgs_ids: ids_part.join(','), hash: mark_hash, al:1},function(r,t){
			del_offset+=MSG_IDS_PER_DEL_REQUEST;
			setTimeout(function(){del(callback);},MSG_DEL_REQ_DELAY);
		});
	};
	var msg_count=0;
	var scan=function(){
		if (!mark_hash){
			get_mark_hash(scan);
			return;
		}
		mids=[];
		if (cur_offset==0){
			ge('vk_del_msg').innerHTML=vkProgressBar(1,1,310,' ');
			ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset,2,310,IDL('msgreq')+' %');
		}
		dApi.call('messages.getHistory',{uid:uid,count:REQ_CNT,offset:0},function(r){
			if (abort) return;
			var ms=r.response;
			if (ms==0 || !ms[0]){
				deldone();
				return;
			}
			if (msg_count==0) msg_count=ms.shift();
			else ms.shift();
			ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset+REQ_CNT,msg_count,310,IDL('msgreq')+' %');
			for (var i=0;i<ms.length;i++) mids.push(ms[i].mid);
			cur_offset+=REQ_CNT;
			vklog(mids);
			del(scan);
			//setTimeout(scan,MSG_SCAN_REQ_DELAY);
			
		});
	};
	var run=function(){
		box=new MessageBox({title: IDL('DeleteMessages'),closeButton:true,width:"350px"});
		box.removeButtons();
		box.addButton(IDL('Cancel'),function(r){abort=true; box.hide();},'no');
		var html='<div id="vk_del_msg" style="padding-bottom:10px;"></div><div id="vk_scan_msg"></div>';
		box.content(html).show();	
		scan();
	}
	vkAlertBox(IDL('DeleteMessages'),IDL('msgdelconfirm'),run,true);
}

// SAVE HISTORY TO FILE
function vkAddSaveMsgLink(){ 
  if (!ge('vk_history_to_file_block')){
	var btn=vkCe('div', {	id:"vk_history_to_file_block", "class":"vk_mail_save_history_block", },
					'<div id="saveldr" style="display:none; padding:8px; padding-top: 14px; text-align:center; width:130px;"><img src="/images/upload.gif"></div>'+
					'<a href="#" onclick="return false;" id="save_btn_text" class="vk_mail_save_history"><span onclick="vkMakeMsgHistory(); return false;">'+IDL('SaveHistory')+'</span><div class="cfg fl_r" onclick="vkMakeMsgHistory(null,true);"></div></a>'
				);
	var ref=ge('mail_history');
	ref.parentNode.insertBefore(btn,ref);
  }
}

function vkMakeMsgHistory(uid,show_format){
	//vkInitDataSaver();
	if (!uid) uid=cur.thread.id;
	var offset=0;
	var result='';
	var user1='user1';
	var user2='user1';
	var mid=remixmid();
	var msg_pattern=vkGetVal('VK_SAVE_MSG_HISTORY_PATTERN') || SAVE_MSG_HISTORY_PATTERN;
	var date_fmt=vkGetVal('VK_SAVE_MSG_HISTORY_DATE_FORMAT') || SAVE_MSG_HISTORY_DATE_FORMAT;
   var users={};
   var users_ids=[];
	var collect=function(callback){
		hide('save_btn_text');
		show('saveldr');
		//document.title='offset:'+offset;
      var w=getSize(ge('saveldr'),true)[0];
		if (offset==0) ge('saveldr').innerHTML=vkProgressBar(offset,10,w);		
		dApi.call('messages.getHistory',{uid:uid,offset:offset,count:100},function(r){
			ge('saveldr').innerHTML=vkProgressBar(offset,r.response[0],w);
			var msgs=r.response;
			var count=msgs.shift();
			msgs.reverse();
			var msg=null;
			var res=''
			for (var i=0;i<msgs.length;i++){
				msg=msgs[i];
            if (!users['%'+msg.from_id+'%']){
               users['%'+msg.from_id+'%']='id'+msg.from_id+' DELETED';
               users_ids.push(msg.from_id);
            }
            
            var attach_text="";
            for (var j=0; msg.attachments && j<msg.attachments.length;j++){
               var attach=msg.attachments[j];
               switch(attach.type){
                  case  "photo":
                     var a=attach.photo;
                     var src=a.src_xxxbig || a.src_xxbig || a.src_xbig || a.src_big || a.src || a.src_small;
                     var link="vk.com/photo"+a.owner_id+'_'+a.pid;
                     attach_text+=link+" : "+src+"\r\n"+(a.text?a.text+"\r\n":"");
                     break;
                  case  "video":
                     var a=attach.video;
                     var link="vk.com/video"+a.owner_id+'_'+a.vid;
                     attach_text+=link+" : "+(a.title?a.title+"\r\n":"")+"\r\n"+(a.description?a.description+"\r\n":"");
                     
                     break;
                  case  "audio":
                     var a=attach.audio;
                     var link="vk.com/audio?id="+a.owner_id+'&audio_id='+a.aid;
                     attach_text+=link+" : "+(a.performer || "")+" - "+(a.title || "")+"\r\n";
                     break;
                  case  "doc":
                     var a=attach.doc;
                     attach_text+=a.url+" ("+vkFileSize(a.size)+"): "+a.title+"\r\n";
                     break; 
                  /*
                  case  "wall":
                  
                     break;*/
               }
               
            }
            //console.log(msg);
				var date=(new Date(msg.date*1000)).format(date_fmt);
				var user='%'+msg.from_id+'%';//(msg.from_id==mid?user2:user1);
				var text=vkCe('div',{},(msg.body || '').replace(/<br>/g,"%{br}%")).innerText.replace(/%{br}%/g,'\r\n');// no comments....
				//text=text.replace(/\n/g,'\r\n');
            
				res+=msg_pattern
                 .replace(/%username%/g,user) //msg.from_id
                 .replace(/%date%/g,    date)
                 .replace(/%message%/g, text)
                 .replace(/%attachments%/g, (attach_text!=""?"Attachments:[\r\n"+attach_text+"]":""));
			}
			result=res+result;
			if (offset<count){
				offset+=100;
				setTimeout(function(){collect(callback);},300);
			} else {
				//alert(result);
				callback(result);
			}
		});
	}
	var run=function(){     
			collect(function(t){
            dApi.call('getProfiles',{uids:users_ids.join(',')/*remixmid()+','+uid*/},function(r){
               for (var i=0;i<r.response.length;i++){
                  var u=r.response[i];
                  users['%'+u.uid+'%']=u.first_name+" "+u.last_name;
               }
               for (var key in users)
                  t=t.split(key).join(users[key]);
               
               show('save_btn_text');
               hide('saveldr');
               //alert(t);
               vkSaveText(t,"messages_"+user1+"("+uid+").txt");
               
            });            
			});
	
	}
	
	if (show_format){
		var aBox = new MessageBox({title: IDL('SaveHistoryCfg')});
		aBox.removeButtons();
		aBox.addButton(IDL('Hide'), aBox.hide, 'no')
		aBox.addButton(IDL('OK'),function(){  
			msg_pattern=ge('vk_msg_fmt').value;
			date_fmt=ge('vk_msg_date_fmt').value;
			vkSetVal('VK_SAVE_MSG_HISTORY_PATTERN',msg_pattern);
			vkSetVal('VK_SAVE_MSG_HISTORY_DATE_FORMAT',date_fmt);
			aBox.hide(); 
			run();	 
		},'yes');
		vkaddcss('.vk_save_hist_cfg textarea{width:370px;}');
		html ='<h4>'+IDL('SaveMsgFormat')+'<a class="fl_r" onclick="ge(\'vk_msg_fmt\').value=SAVE_MSG_HISTORY_PATTERN;">'+
					IDL('Reset')+'</a></h4><textarea id="vk_msg_fmt" onfocus="autosizeSetup(this,{});">'+msg_pattern+'</textarea><br><br>';
					
		html+='<h4>'+IDL('SaveMsgDateFormat')+'<a class="fl_r" onclick="ge(\'vk_msg_date_fmt\').value=SAVE_MSG_HISTORY_DATE_FORMAT;">'+
					IDL('Reset')+'</a></h4><textarea id="vk_msg_date_fmt" onfocus="autosizeSetup(this,{});">'+date_fmt+'</textarea><br>';
		aBox.content('<div class="vk_save_hist_cfg">'+html+'</div>');
		aBox.show();
		autosizeSetup('vk_msg_fmt',{});
		autosizeSetup('vk_msg_date_fmt',{});
	} else run();
}

// END OF SAVE HISTORY TO FILE

function vkNotesPage(){
	if (!ge('vk_clean_notes') && cur.oid==remixmid()){
		var p=geByClass('summary')[0];
		p.innerHTML+='<span class="divide">|</span><a style="font-weight:normal" id="vk_clean_notes" href="#" onclick="vkCleanNotes(); return false;">'+IDL('DelAllNotes')+'</a>';
	}
}

function vkCleanNotes(){
	var REQ_CNT=100;
	var WALL_DEL_REQ_DELAY=400;
	var start_offset=0;
	var box=null;
	var by_time=false;
	var mids=[];
	var del_offset=0;
	var cur_offset=0;
	var abort=false;
	var filter=['owner','others','all'];
	var deldone=function(){
			box.hide();
			vkMsg(IDL("ClearDone"),3000);	
	};
	var del=function(callback){	
		if (abort) return;
		var del_count=mids.length;
		ge('vk_del_msg').innerHTML=vkProgressBar(del_offset,del_count,310,IDL('nodesdel')+' %');
		var nid=mids[del_offset];
		if (!nid){
			ge('vk_del_msg').innerHTML=vkProgressBar(1,1,310,' ');
			del_offset=0;
			callback();
		} else
		dApi.call('notes.delete', {nid:nid},function(r,t){
			del_offset++;
			setTimeout(function(){del(callback);},WALL_DEL_REQ_DELAY);
		});
	};
	var msg_count=0;
	var scan=function(){
		mids=[];
		if (cur_offset==0){
			ge('vk_del_msg').innerHTML=vkProgressBar(1,1,310,' ');
			ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset,2,310,IDL('notesreq')+' %');
		}
		dApi.call('notes.get',{count:REQ_CNT,offset:0+start_offset},function(r){
			if (abort) return;
			var ms=r.response;
			if (ms==0 || !ms[1]){
				deldone();
				return;
			}
			if (msg_count==0) msg_count=ms.shift();
			else ms.shift();
			ge('vk_scan_msg').innerHTML=vkProgressBar(cur_offset+REQ_CNT,msg_count,310,IDL('notesreq')+' %');
			for (var i=0;i<ms.length;i++){ 
				if ((ms[i].date>del_time && by_time) || !by_time) mids.push(ms[i].nid);
			}
			cur_offset+=REQ_CNT;
			if (mids.length==0){
				deldone();
				return;
			} 
			del(scan);
			
		});
	};
	var vkRunClean=function(soffset){
		start_offset=soffset?soffset:0;
		box=new MessageBox({title: IDL('ClearNotes'),closeButton:true,width:"350px"});
		box.removeButtons();
		box.addButton(IDL('Cancel'),function(r){abort=true; box.hide();},'no');
		var html='<div id="vk_del_msg" style="padding-bottom:10px;"></div><div id="vk_scan_msg"></div>';
		box.content(html).show();	
		scan();
	};
	var showLoader=function(){
		loader_box=new MessageBox({title:''});
		loader_box.setOptions({title: false, hideButtons: true}).show(); 
		hide(loader_box.bodyNode); 
		show(boxLoader);
		boxRefreshCoords(boxLoader);	
	};
	var hideLoader=function(){
		loader_box.hide();
		hide(boxLoader);
	}
	
	showLoader();
	stManager.add(['ui_controls.js','ui_controls.css','datepicker.js','datepicker.css','events.css'], function() {
		hideLoader();
		html='<div class="clear_fix info_table page_add_event_info public_add_event_box"><div class="clear_fix">\
		  <div style="padding-top:10px;" id="notes_del_by_time"></div>\
		  <div class="labeled fl_l">\
			<div class="fl_l"><input type="hidden" id="notes_del_after_date" name="notes_del_after_date"/></div>\
			<div class="fl_l" style="padding:4px 4px 0"></div>\
			<div class="fl_l"><input type="hidden" id="notes_del_after_time"/></div>\
		  </div>\
		</div></div>';		
		var aBox = new MessageBox({title: IDL('ClearNotes'),width: "285px"});
		aBox.removeButtons();
		aBox.addButton(getLang('box_no'),aBox.hide, 'no');
		aBox.addButton(getLang('box_yes'),function(){  
			del_time = ge('notes_del_after_date').value;
			aBox.hide(); 
			vkRunClean();	 
		},'yes');
		  
		aBox.content(IDL('CleanNotesConfirm')+html);
		aBox.show();
		//vkAlertBox(IDL('ClearNotes'),IDL('CleanNotesConfirm')+html,vkRunClean,true);
		var delTime = new Datepicker(ge('notes_del_after_date'), {time:'notes_del_after_time', width:140});
		var cb = new Checkbox(ge("notes_del_by_time"), {  width: 270,  
														  checked:by_time,  
														  label: IDL('DelCreatedAfterTime'),
														  onChange: function(state) { by_time = (state == 1)?true:false; } 
														})
	});	
}

/*
  deleteReportPost: function(post, act) {
    post = cur.owner + '_' + post;
    var prg = geByClass1('bp_progress', ge('post' + post));
    if (isVisible(prg)) return;

    ajax.post('al_board.php', {act: act, post: post, hash: cur.hash}, {onDone: function(text, deleted) {
      var info = ge('post' + post).firstChild.nextSibling;
      if (info) {
        info.firstChild.rows[0].cells[0].innerHTML = text;
      } else {
        info = ge('post' + post).appendChild(ce('div', {className: 'bp_deleted', innerHTML: '\
<table cellspacing="0" cellpadding="0" style="width: 100%"><tr><td class="bp_deleted_td">\
  ' + text + '\
</td></tr></table>'}));
        hide(info.previousSibling);
      }

      if (deleted) {
        Pagination.recache(-1);
        Board.loadedPosts(cur.pgCount);
      }
    }, progress: prg});
  },
 */ 
function vkBoardPage(){
 vkTopicSubscribe(true);
 //vkTopicsTip();
}

function vkProcessTopicLink(link){
   var href=link.getAttribute('href');
   if (!href) return;
   var id=href.match(/topic(-?\d+)_(\d+)/);
   var post=href.match(/post=(\d+)/);
   if (!id) return;
   if(!link.hasAttribute('onmouseover')) link.setAttribute('onmouseover', "vkTopicTooltip(this, "+id[1]+","+id[2]+","+(post?post[1]:null)+");");
}
function vkTopicTooltip(el,gid,topic,post){
    var post_id=post?(gid+'_'+post):(gid+'_topic'+topic);
    var url = post?'al_board.php':'al_wall.php';
    stManager.add(post?'board.css':'wall.css', function() {
       showTooltip(el, {
         url: url,
         params: extend({act: 'post_tt', post: post_id}, {}),
         slide: 15,
         shift: [30, -3, 0],//78
         ajaxdt: 100,
         showdt: 400,
         hidedt: 200,
         className: 'rich wall_tt'
       });    
    });
}

function vkTopicSubscribe(add_link){
	if (add_link){
		if (ge('vksubscribetopic')) return;
		if (nav.objLoc[0].indexOf('topic-')!=-1){
			 var divider=(ge('privacy_edit_topic_action') && ge('privacy_edit_topic_action').parentNode && isVisible(ge('privacy_edit_topic_action').parentNode))?'<span class="divide">|</span>':'';
			 geByClass('t0')[0].appendChild(vkCe('li',{"class":"t_r"},'<a href="#" id="vksubscribetopic" onclick="return vkTopicSubscribe();">'+IDL('addtop')+'</a>'+divider))
		}
		return false;
	}
	progr_el=ge('vksubscribetopic');
	var text='[subscribe]';
	var last = ((cur.pgCont.childNodes[cur.pgNodesCount - 1].id || '').match(/\d+$/) || [0])[0];
	ajax.post('al_board.php', {act: 'post_comment',topic: cur.topic,last: last,hash: cur.hash,comment: text},{
		showProgress:showGlobalPrg.pbind(progr_el, {cls: 'progress_inv_img', w: 46, h: 16}),
		hideProgress:hide.pbind('global_prg'),
		onDone: function(count, from, rows, offset, pages, preload) {
			var pid=rows.split(text)[1].match(/Board\.deletePost\((\d+)\)/);
			if (!pid) {
				vkMsg(IDL('Error'));
			}
			else {
				var post = cur.owner + '_' + pid[1];
				ajax.post('al_board.php', {act: 'delete_comment', post: post, hash: cur.hash}, {
					showProgress:showGlobalPrg.pbind(progr_el, {cls: 'progress_inv_img', w: 46, h: 16}),
					hideProgress:hide.pbind('global_prg'),
					onDone: function(text, deleted) {
						if (deleted) vkMsg(IDL('topicadded'));
					}
				});
				
			}
		}
	});
	return false;
}

var vkstarted = (new Date().getTime());

if (!window.vkscripts_ok) window.vkscripts_ok=1; else window.vkscripts_ok++;