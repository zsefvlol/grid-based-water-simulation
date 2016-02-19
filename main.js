/**
 * Created by Mengtian on 2016/2/18.
 */

var gridWater = {

    //grid data, 0 air, 1 wall, 2 water
    grid: [
        [1,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,2,2,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
        [1,2,2,1,2,2,1,0,0,0,0,0,0,0,0,0,0],
        [1,2,2,1,2,2,1,0,0,0,0,0,0,0,0,0,1],
        [1,2,2,2,2,2,1,0,0,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,1],
        [1,1,1,1,1,1,1,1,1,2,2,2,2,2,2,2,1],
        [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
    ],

    connectivity : [],

    showConnectivity : false,
    toggleConnectivity: function(){
        this.showConnectivity = !this.showConnectivity;
        this.render();
    },

    //render grid to divs
    render: function(){
        _self = this;
        var gridDiv = $('#grid');
        gridDiv.html("");
        var gridClass = ['air', 'wall', 'water'];
        var connectivity = this.connectivity;
        $(this.grid).each(function(index,line){
            var lineDom = '';
            for(var i in line){
                var innerText = '';
                if (typeof connectivity[index] != 'undefined'
                    && connectivity[index][i]>-1 && _self.showConnectivity){
                    innerText = connectivity[index][i];
                }
                lineDom += '<div class="g '+ gridClass[line[i]] +'" m="'+index+'" n="'+i+'">'+innerText+'</div>';
            }
            gridDiv.append('<div class="line">' + lineDom + '</div>');
        });

        //click to change the type of grid
        $('.g').on('click',function(){
            var m=$(this).attr('m');
            var n=$(this).attr('n');
            $(this).removeClass(gridClass[_self.grid[m][n]]);
            _self.grid[m][n] ++;
            if(_self.grid[m][n] > 2) _self.grid[m][n] = 0;
            $(this).addClass(gridClass[_self.grid[m][n]]);
            _self.findConnectedBlock();
            _self.render();
        });
        return true;
    },

    //next step
    next: function(){
        var g = this.grid;
        var c = this.connectivity;
        var h = this.grid.length;
        var w = this.grid[0].length;
        var moved = false;

        //find all blocks
        var connectBlockIndex = [];
        c.map(function(row){
            row.map(function(col){
                if(col!=-1 && $.inArray(col, connectBlockIndex)<0) connectBlockIndex.push(col);
            });
        });

        //for each block
        for (var i in connectBlockIndex){
            var blockIndex = connectBlockIndex[i];

            console.log('calculating block index:', blockIndex);
            var topWaterGridsHeight = -1;
            var gridsToMoveTo = {"grid":[], "pressure":0};
            for (var m=0; m<h; m++) {
                for (var n=0; n<w; n++) {
                    if(c[m][n] == blockIndex){
                        //top water grids height
                        if (topWaterGridsHeight == -1) topWaterGridsHeight = m;
                        //if can drop down
                        if(m+1<h && g[m+1][n]==0){
                            if(gridsToMoveTo.pressure == Number.MAX_VALUE)
                                gridsToMoveTo.grid.push([m+1, n]);
                            else{
                                gridsToMoveTo.grid = [[m+1, n]];
                                gridsToMoveTo.pressure = Number.MAX_VALUE;
                            }
                        }
                        //if can drop left
                        else if(n-1>0 && g[m][n-1]==0 && m-topWaterGridsHeight > 0){
                            if(gridsToMoveTo.pressure > m-topWaterGridsHeight){
                                continue;
                            }
                            else if(gridsToMoveTo.pressure == m-topWaterGridsHeight){
                                gridsToMoveTo.grid.push([m, n-1]);
                            }
                            else{
                                gridsToMoveTo.grid = [[m, n-1]];
                                gridsToMoveTo.pressure = m-topWaterGridsHeight;
                            }
                        }
                        //if can drop right
                        else if(n+1<w && g[m][n+1]==0 && m-topWaterGridsHeight > 0){
                            if(gridsToMoveTo.pressure > m-topWaterGridsHeight)
                                continue;
                            else if(gridsToMoveTo.pressure == m-topWaterGridsHeight)
                                gridsToMoveTo.grid.push([m, n+1]);
                            else
                                gridsToMoveTo.grid = [[m, n+1]];
                        }
                        //if can press up, notice move up will lose 1 pressure
                        else if(m-1>0 && g[m-1][n]==0 && m-topWaterGridsHeight-1 > 0){
                            if(gridsToMoveTo.pressure > m-topWaterGridsHeight-1){
                                continue;
                            }
                            else if(gridsToMoveTo.pressure == m-topWaterGridsHeight-1){
                                gridsToMoveTo.grid.push([m-1, n]);
                            }
                            else{
                                gridsToMoveTo.pressure = m-topWaterGridsHeight-1;
                                gridsToMoveTo.grid = [[m-1, n]];
                            }
                        }

                    }
                }
            }
            console.log('grids to move to',gridsToMoveTo);

            //find the top water grid, and remove it
            var findWaterGridToRemove = function(cm, cn){
                for (var m=0; m<h; m++) {
                    //always remove farthest water grid
                    // 212<-remove this
                    // 222
                    // 211
                    // remove this->212
                    //              222
                    //              112
                    var leftFirst=-1;
                    var rightFirst=-1;
                    for (var n=0; n<w; n++) {
                        if(c[m][n] == blockIndex) {
                            if(leftFirst==-1) leftFirst=n;
                            if(rightFirst<n) rightFirst=n;
                        }
                    }
                    if(leftFirst != -1){
                        var nToRemove = cn<(rightFirst+leftFirst)/2?rightFirst:leftFirst;
                        return [m,nToRemove];
                    }
                }
            };

            var gridToRemove;
            gridsToMoveTo.grid.map(function(grid){
                console.log('add water to ' + grid[0] + ',' + grid[1]);
                gridToRemove = findWaterGridToRemove(grid[0],grid[1]);
                //if grid to remove and grid to add are of same height, do not move
                if(gridToRemove[0] == grid[0]) return;
                g[grid[0]][grid[1]] = 2;
                g[gridToRemove[0]][gridToRemove[1]] = 0;
                c[gridToRemove[0]][gridToRemove[1]] = -1;
                console.log('remove water ',gridToRemove);
                moved = true;
            });
        }

        this.findConnectedBlock();
        this.render();
        if(!moved && this.timer) {
            clearInterval(this.timer);
            this.timer = '';
        }
    },

    //find connected blocks
    findConnectedBlock: function(){
        var m = this.grid.length;
        var n = this.grid[0].length;
        this.connectivity = this.buildArray(m, n, -1);
        var blockIndex = 0;

        //update block number, internal use, see usage below
        var update = function(connectivity, oldNum, newNum){
            return connectivity.map(function(row){
                return row.map(function(col){
                    return col == oldNum ? newNum : col;
                });
            });
        };

        //for each grid...
        for (var i in this.grid){
            for (var j in this.grid[i]){
                //if not water grid, continue
                if(this.grid[i][j] < 2) continue;
                //if so
                //test if top grid is water grid.
                if(i>0 && this.grid[i-1][j] == 2){
                    //if so, mark this grid same as top
                    this.connectivity[i][j] = this.connectivity[i-1][j];
                }
                //test if left grid is water grid.
                if(j>0 && this.grid[i][j-1] == 2){
                    //if so
                    //if this grid is not marked
                    if(this.connectivity[i][j] == -1){
                        this.connectivity[i][j] = this.connectivity[i][j-1];
                    }
                    //if this grid is already markd, and not same as left grid
                    else if(this.connectivity[i][j] != this.connectivity[i][j-1]){
                        //update all the mark to connect to two part
                        this.connectivity = update(this.connectivity, this.connectivity[i][j], this.connectivity[i][j-1]);
                    }
                }
                //if not connected to others, mark as a new block
                if(this.connectivity[i][j] == -1) this.connectivity[i][j] = blockIndex++;
            }
        }
    },


    //build array
    buildArray: function(m, n, v){
        var array = [], array_row = [], i = 0;
        for (i=0;i<n;i++) array_row.push(v);
        for (i=0;i<m;i++) array.push(array_row.slice(0));
        return array;
    },

    timer:'',
    play: function(){
        if(!this.timer) this.timer = setInterval("gridWater.next()", '80');
    }

};

gridWater.findConnectedBlock();
gridWater.render();
