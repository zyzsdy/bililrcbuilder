function lyricItem(text, start){
	this.text = text;
	this.start = start;
	this.end = 0;
}

$(function(){
	$("#start").click(function(){
		var lyricStr = startConvert();
		var stylepart = styleBuilder();
		var scriptStr = combineScript(lyricStr, stylepart);
		$("#resultbox").val(scriptStr);
	});
	var preview = $('.lyric-preview');
	$("#font").change(function(){
		preview.css('font-family',$(this).val());
	});
	$("#fontsize").change(function(){
		preview.css('font-size',$(this).val() + 'px');
	});
	$("#fontbold").change(function(){
		if ($(this).is(':checked')){
			preview.css('font-weight','bold');
		}
		else{
			preview.css('font-weight','');
		}
	});
	$('#fontcolor').change(function(){
		preview.css('color',$(this).val());
	});
	$("#shadowcolor,#shadowhalpha,#shadowhrx,#shadowhry,#shadowhstrength").change(function(){
		preview.css('text-shadow',$('#shadowhrx').val() + 'px ' + $('#shadowhry').val() + 'px ' + $('#shadowhstrength').val() + 'px ' + $('#shadowcolor').val());
	});
})

function startConvert(){
	var lrctext=$("#lrcbox").val();
	var lrc = lrctext.split("\n"); //分行
	var len = lrc.length;
	var lyrics = new Array();
	var errorCount = 0;
	var offset = 0;
	for(var i=0;i<len;i++){
		var itemText = lrc[i];
		var timepos;
		if((timepos = taggedPos(itemText))==-1){
			errorCount++;
			continue;
		}
		var timeTagArray = new Array();
		var text = itemText;
		do {
			var timeTag = text.substr(1, timepos-1);
			timeTagArray.push(timeTag);
			text = text.substr(timepos+1);
		}while((timepos = taggedPos(text)) != -1);
		for(var j=0;j<timeTagArray.length;j++){
			var timeShiftArr = timeTagArray[j].split(":");
			if(timeShiftArr.length !=2){
				errorCount++;
				continue;
			}
			if(timeShiftArr[0] == "offset"){
				offset = Number(timeShiftArr[1]);
				continue;
			}
			var min = Number(timeShiftArr[0]);
			if(isNaN(min)){
				continue;
			}
			var time = Number(timeShiftArr[1]);
			var startTime = 1000*(min * 60 + time);
			var lycItem = new lyricItem(text, startTime);
			lyrics.push(lycItem);
		}
	}

	lyrics.sort(sortedByStartTime);
	var lylen = lyrics.length;
	lyrics[0].start += offset;
	for(var i=1;i<lylen;i++){
		lyrics[i].start += offset;
		lyrics[i-1].end = lyrics[i].start;
	}
	lyrics[lylen-1].end = lyrics[lylen-1].start + 10000;
	var biliArr = new Array();
	for(var i=0;i<lylen;i++){
		if(lyrics[i].text!=""){
			biliArr.push(lyrics[i]);
		}
	}
    var bilistr = '[\n';
    for (key in biliArr){
    	bilistr += '			' + JSON.stringify(biliArr[key]) + ',\n';
    }
    bilistr += '\n]';
	return bilistr;
}

function styleBuilder(){
	var posnum = $("#posnum").val();
	var font = $("#font").val();
	var fontsize = $("#fontsize").val();
	var fontbold = String($("#fontbold").get(0).checked);
	var fontcolor = $("#fontcolor").val().substr(1);
	var shadowcolor = $("#shadowcolor").val().substr(1);
	var fonthcolor = $("#fonthcolor").val().substr(1);
	var fonthalpha = $("#fonthalpha").val() || 0;
	var fonthrx = $("#fonthrx").val() || 0;
	var fonthry = $("#fonthry").val() || 0;
	var fonthstrength = $("#fonthstrength").val() || 0;
	var fonthinner = String($("#fonthinner").get(0).checked);
	var shadowhcolor = $("#shadowhcolor").val().substr(1);
	var shadowhalpha = $("#shadowhalpha").val() || 0;
	var shadowhrx = $("#shadowhrx").val() || 0;
	var shadowhry = $("#shadowhry").val() || 0;
	var shadowhstrength = $("#shadowhstrength").val() || 0;
	var shadowhinner = String($("#shadowhinner").get(0).checked);
	var styleTemplate="\
	function style0(cmt, shad){\n\
		var plw=Player.width;\n\
		var plh=Player.height;\n\
		var vdw=Player.videoWidth;\n\
		var vdh=Player.videoHeight;\n\
		var rate=vdw/1920;\n\
		var middleX=plw/2;\n\
		var tarY=Math.floor(0.5*plh+0.5*vdh-rate*" + posnum + ");\n\
		var fontsize=Math.floor(" + fontsize + "*rate);\n\
		if(fontsize<12) fontsize=12;\n\
		cmt.filters=[$.createGlowFilter(0x" + fonthcolor + "," + fonthalpha + "," + fonthrx + "," + fonthry + "," + fonthstrength + ",1," + fonthinner + ",false)];\n\
		shad.filters=[$.createGlowFilter(0x" + shadowhcolor + "," + shadowhalpha + "," + shadowhrx + "," + shadowhry + "," + shadowhstrength + ",1," + shadowhinner + ",false)];\n\
		var frt=$.createTextFormat(\"" + font + "\",fontsize,0x" + fontcolor + "," + fontbold + ",false,false,null,null);\n\
		var fsd=$.createTextFormat(\"" + font + "\",fontsize,0x" + shadowcolor + "," + fontbold + ",false,false,null,null);\n\
		shad.setTextFormat(fsd);\n\
		cmt.setTextFormat(frt);\n\
		var tarX=Math.floor(middleX-(cmt.width)/2);\n\
		if(tarX<7) tarX=7;shad.x=tarX+2;shad.y=tarY+2;cmt.x=tarX;cmt.y=tarY;\n\
	}";
	return styleTemplate;
}

function combineScript(lyricStr, stylepart){
	var fadetime = $('#fadetime').val();
	var lyricTemplate="\
	//BiliLRCBuilder\n\
	var lryic="+lyricStr+";\n";
	var mainTemplate="\
	var lastTime = 0;\n\
	var len = lryic.length;\n\
	function timeMain(){var nowTime = Player.time;\n\
		for(i=0; i<len; i++){\n\
			var ts = lryic[i]['start'];\n\
			var style = lryic[i]['style']?lryic[i]['style']:0;\n\
			if(lastTime <= ts && nowTime >= ts){\n\
				var this_ttl=(lryic[i]['end']-nowTime)/1000;\n\
				dm(lryic[i]['text'],this_ttl,style);\n\
			}\n\
		}\n\
		lastTime=nowTime;\n\
	}\n\
	interval(timeMain,200,0);\n\
	function dm(text, ttl, style){\n\
		shad=$.createComment(text,{\n\
			lifeTime: ttl,\n\
			alpha : 0, \n\
			motionGroup : [ \n\
				{\n\
					alpha : { fromValue : 0 , toValue : 1 , lifeTime : " + fadetime + " }\n\
				}, \n\
				{\n\
					alpha : { fromValue : 1 , toValue : 1 , lifeTime : ttl - " + fadetime*2 + " } \n\
				}, \n\
				{\n\
					alpha : { fromValue : 1 , toValue : 0 , lifeTime : " + fadetime + "  } \n\
				}\n\
			]\n\
		});\n\
		cmt=$.createComment(text,{\n\
			lifeTime: ttl,\n\
			alpha : 0, \n\
			motionGroup : [ \n\
				{\n\
					alpha : { fromValue : 0 , toValue : 1 , lifeTime : " + fadetime + " }\n\
				}, \n\
				{\n\
					alpha : { fromValue : 1 , toValue : 1 , lifeTime : ttl - " + fadetime*2 + " } \n\
				}, \n\
				{\n\
					alpha : { fromValue : 1 , toValue : 0 , lifeTime : " + fadetime + "  } \n\
				}\n\
			]\n\
		});\n\
		style0(cmt, shad);\n\
	}";
	var footerTemplate="\
	//==========================================================\n\
	// 本高级弹幕使用BiliLRCBuilder v1.2生成\n\
	// 高级弹幕脚本AutoBiliLyric v1.3 by Zyzsdy\n\
	// https://github.com/zyzsdy/bililrcbuilder \n\
	//==========================================================";
	return lyricTemplate+"\n"+mainTemplate+"\n"+stylepart+"\n"+footerTemplate;
}

function taggedPos(text){
	if(text[0]!='['){
		return -1;
	}
	return text.indexOf(']');
}
function sortedByStartTime(lyricItemA, lyricItemB){
	return lyricItemA.start - lyricItemB.start;
}