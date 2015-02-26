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

	var bilistr = JSON.stringify(biliArr);
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
	var fonthalpha = $("#fonthalpha").val();
	var fonthrx = $("#fonthrx").val();
	var fonthry = $("#fonthry").val();
	var fonthstrength = $("#fonthstrength").val();
	var fonthinner = String($("#fonthinner").get(0).checked);
	var shadowhcolor = $("#shadowhcolor").val().substr(1);
	var shadowhalpha = $("#shadowhalpha").val();
	var shadowhrx = $("#shadowhrx").val();
	var shadowhry = $("#shadowhry").val();
	var shadowhstrength = $("#shadowhstrength").val();
	var shadowhinner = String($("#shadowhinner").get(0).checked);
	var styleTemplate="function style0(cmt, shad){var plw=Player.width;var plh=Player.height;var vdw=Player.videoWidth;var vdh=Player.videoHeight;var rate=vdw/1920;var middleX=plw/2;var tarY=Math.floor(0.5*plh+0.5*vdh-rate*"+posnum+");var fontsize=Math.floor("+fontsize+"*rate);if(fontsize<12) fontsize=12;cmt.filters=[$.createGlowFilter(0x"+fonthcolor+","+fonthalpha+","+fonthrx+","+fonthry+","+fonthstrength+",1,"+fonthinner+",false)];shad.filters=[$.createGlowFilter(0x"+shadowhcolor+","+shadowhalpha+","+shadowhrx+","+shadowhry+","+shadowhstrength+",1,"+shadowhinner+",false)];var frt=$.createTextFormat(\""+font+"\",fontsize,0x"+fontcolor+","+fontbold+",false,false,null,null);var fsd=$.createTextFormat(\""+font+"\",fontsize,0x"+shadowcolor+","+fontbold+",false,false,null,null);shad.setTextFormat(fsd);cmt.setTextFormat(frt);var tarX=Math.floor(middleX-(cmt.width)/2);if(tarX<7) tarX=7;shad.x=tarX+2;shad.y=tarY+2;cmt.x=tarX;cmt.y=tarY;}";
	return styleTemplate;
}

function combineScript(lyricStr, stylepart){
	var lyricTemplate="//BiliLRCBuilder\nvar lryic="+lyricStr+";";
	var mainTemplate="var lastTime = 0;var len = lryic.length;function timeMain(){var nowTime = Player.time;for(i=0; i<len; i++){var ts = lryic[i]['start'];var style = lryic[i]['style']?lryic[i]['style']:0;if(lastTime <= ts && nowTime >= ts){var this_ttl=(lryic[i]['end']-nowTime)/1000;dm(lryic[i]['text'],this_ttl,style);}}lastTime=nowTime;}interval(timeMain,200,0);function dm(text, ttl, style){shad=$.createComment(text,{lifeTime: ttl});cmt=$.createComment(text,{lifeTime: ttl});style0(cmt, shad);}";
	var footerTemplate="//==========================================================\n// 本高级弹幕使用BiliLRCBuilder v1.0生成\n// 高级弹幕脚本AutoBiliLyric v1.2 by Zyzsdy\n// 生成时间："+(new Date().toLocaleString())+"\n//==========================================================";
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