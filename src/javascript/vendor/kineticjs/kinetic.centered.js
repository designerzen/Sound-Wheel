// http://jsfiddle.net/sEtzy/
(function() {
    Kinetic.CenteredTextPath = function(config) {
        this._initCenteredTextPath(config);
    };

    Kinetic.CenteredTextPath.prototype = {
        _initCenteredTextPath: function(config) {
            Kinetic.TextPath.call(this, config);
            },
            _setTextData: function() {
            	this.attrs.text = ' '+this.attrs.text;
                var that = this;
                var size = this._getTextSize(this.attrs.text);
                this.textWidth = size.width;
                this.textHeight = size.height;

                this.glyphInfo = [];
               
                var charArr = this.attrs.text.split('');

                var p0, p1, pathCmd;
                
                

                var pIndex = -1;
                var currentT = 0;
                var startPos = 0;
                
                // http://stackoverflow.com/questions/16010275/how-to-center-text-along-kinetic-textpath-with-kineticjs
                // get the length of the path and subtract the text lenght and divide by 2 to get the center
                var plen = 0;
                for(var i = 0; i < that.dataArray.length; i++) {
                	plen += that.dataArray[i].pathLength;
                }
                startPos = Math.round((plen-that.textWidth)/2);
                
                var getNextPathSegment = function() {
                    currentT = 0;
                    var pathData = that.dataArray;
                    
                    for(var i = pIndex + 1; i < pathData.length; i++) {
                        if(pathData[i].pathLength > 0) {
                            pIndex = i;

                            return pathData[i];
                        }
                        else if(pathData[i].command == 'M') {
                            p0 = {
                                x: pathData[i].points[0],
                                y: pathData[i].points[1]
                            };
                          
                        }
                    }

                    return {};
                };
                
                //http://stackoverflow.com/questions/16010275/how-to-center-text-along-kinetic-textpath-with-kineticjs
                // use before to determine glyph width
                var findSegmentToFitCharacter = function(c, before) {
                	var glyphWidth = that._getTextSize(c).width+before;
                	if(before) {
                		glyphWidth = 1;
                	}
                   
                    var currLen = 0;
                    var attempts = 0;
                    var needNextSegment = false;
                    p1 = undefined;
                    while(Math.abs(glyphWidth - currLen) / glyphWidth > 0.01 && attempts < 25) {
                        attempts++;
                        var cumulativePathLength = currLen;
                        while(pathCmd === undefined) {
                            pathCmd = getNextPathSegment();

                            if(pathCmd && cumulativePathLength + pathCmd.pathLength < glyphWidth) {
                                cumulativePathLength += pathCmd.pathLength;
                                pathCmd = undefined;
                            }
                        }

                        if(pathCmd === {} || p0 === undefined)
                            return undefined;

                        var needNewSegment = false;

                        switch (pathCmd.command) {
                            case 'L':
                                if(Kinetic.Path.getLineLength(p0.x, p0.y, pathCmd.points[0], pathCmd.points[1]) > glyphWidth) {
                                    p1 = Kinetic.Path.getPointOnLine(glyphWidth, p0.x, p0.y, pathCmd.points[0], pathCmd.points[1], p0.x, p0.y);
                                }
                                else
                                    pathCmd = undefined;
                                break;
                            case 'A':

                                var start = pathCmd.points[4];
                                // 4 = theta
                                var dTheta = pathCmd.points[5];
                                // 5 = dTheta
                                var end = pathCmd.points[4] + dTheta;

                                if(currentT === 0)
                                    currentT = start + 0.00000001;
                                // Just in case start is 0
                                else if(glyphWidth > currLen)
                                    currentT += (Math.PI / 180.0) * dTheta / Math.abs(dTheta);
                                else
                                    currentT -= Math.PI / 360.0 * dTheta / Math.abs(dTheta);

                                if(Math.abs(currentT) > Math.abs(end)) {
                                    currentT = end;
                                    needNewSegment = true;
                                }
                                p1 = Kinetic.Path.getPointOnEllipticalArc(pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], currentT, pathCmd.points[6]);
                                break;
                            case 'C':
                                if(currentT === 0) {
                                    if(glyphWidth > pathCmd.pathLength)
                                        currentT = 0.00000001;
                                    else
                                        currentT = glyphWidth / pathCmd.pathLength;
                                }
                                else if(glyphWidth > currLen)
                                    currentT += (glyphWidth - currLen) / pathCmd.pathLength;
                                else
                                    currentT -= (currLen - glyphWidth) / pathCmd.pathLength;

                                if(currentT > 1.0) {
                                    currentT = 1.0;
                                    needNewSegment = true;
                                }
                                p1 = Kinetic.Path.getPointOnCubicBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3], pathCmd.points[4], pathCmd.points[5]);
                                break;
                            case 'Q':
                                if(currentT === 0)
                                    currentT = glyphWidth / pathCmd.pathLength;
                                else if(glyphWidth > currLen)
                                    currentT += (glyphWidth - currLen) / pathCmd.pathLength;
                                else
                                    currentT -= (currLen - glyphWidth) / pathCmd.pathLength;

                                if(currentT > 1.0) {
                                    currentT = 1.0;
                                    needNewSegment = true;
                                }
                                p1 = Kinetic.Path.getPointOnQuadraticBezier(currentT, pathCmd.start.x, pathCmd.start.y, pathCmd.points[0], pathCmd.points[1], pathCmd.points[2], pathCmd.points[3]);
                                break;

                        }

                        if(p1 !== undefined) {
                            currLen = Kinetic.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);
                        }

                        if(needNewSegment) {
                            needNewSegment = false;
                            pathCmd = undefined;
                        }
                    }
                };
                
                //http://stackoverflow.com/questions/16010275/how-to-center-text-along-kinetic-textpath-with-kineticjs
                // probably not really efficient but pad the charArr with spaces
                for(var i=0; i<startPos; i++) {
                	charArr.unshift(' ');
                }
                
                for(var i = 0; i < charArr.length; i++) {
                	
                    // Find p1 such that line segment between p0 and p1 is approx. width of glyph
                    //http://stackoverflow.com/questions/16010275/how-to-center-text-along-kinetic-textpath-with-kineticjs
                    // set before to true if less than startPos, this will result in glyph width of 1px
                    findSegmentToFitCharacter(charArr[i],i<startPos);

                    if(p0 === undefined || p1 === undefined) break;

                    var width = Kinetic.Path.getLineLength(p0.x, p0.y, p1.x, p1.y);

                    // Note: Since glyphs are rendered one at a time, any kerning pair data built into the font will not be used.
                    // Can foresee having a rough pair table built in that the developer can override as needed.

                    var kern = 0;
                    // placeholder for future implementation

                    var midpoint = Kinetic.Path.getPointOnLine(kern + width / 2.0, p0.x, p0.y, p1.x, p1.y);

                    var rotation = Math.atan2((p1.y - p0.y), (p1.x - p0.x));
                    this.glyphInfo.push({
                        transposeX: midpoint.x,
                        transposeY: midpoint.y,
                        text: charArr[i],
                        rotation: rotation,
                        p0: p0,
                        p1: p1
                    });
                    p0 = p1;
                }
            }
    };

  Kinetic.Util.extend(Kinetic.CenteredTextPath, Kinetic.TextPath);
})();