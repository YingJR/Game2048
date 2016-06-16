//---------鎖定選取
(function($) {
    $.fn.disableSelection = function() {
        return this
            .attr('unselectable', 'on')
            .css('user-select', 'none')
            .on('selectstart', false);
    };
})(jQuery);
$(document).disableSelection();
//-------------
var Box; //gameveiw container

var colors = {
    2: "#FFFFFF",
    4: "#FFDDDD",
    8: "#FFBBBB",
    16: "#FF9999",
    32: "#FF7777",
    64: "#FF6666",
    128: "#FF5555",
    256: "#FF4444",
    512: "#FF3333",
    1024: "#FF1111",
    2048: "#FF0000",
    4096: "#FF0000",
    8192: "#FF3333",
    16384: "#FF2222",
    32768: "#FF1111",
    65536: "#FF0000"
}

var canMove = false,
    win = false,
    keepgo = false;
//格子陣列grid 瓦片陣列tile
function Container() {
    this.init();
}
//初始化
Container.prototype.init = function() {
    var size = 4, //size:4
        gridArray = [],
        emptyArray = [];

    for (var i = 0; i < size * size; i++) {
        gridArray[i] = 0;
        emptyArray[i] = i;
    }
    this.mc = new Hammer($(document)[0]);
    this.animator = new Animator(this);
    this.gridArray = gridArray;
    this.emptyArray = emptyArray;
    this.hasTile = [];
    this.score = 0;
};

Container.prototype.getNewRand = function() {
    var i = this.emptyArray.length;
    if (i !== 0) {
        i = this.emptyArray[Math.floor((Math.random() * i))];
        this.gridArray[i] = new Tile(Math.random() < 0.9 ? 2 : 4, i);

        this.animator.addTile(this.gridArray[i]);
        //addTile(this.gridArray[i]); //畫面
    }
    updateStatus(this);
};

Container.prototype.moveLeft = function() {
    var tiles = [],
        score = this.score,
        container = this.gridArray,
        animator = this.animator,
        change = false;

    this.hasTile.forEach(function(num) {
        tiles.push(container[num]);
    });

    var merge = false;

    tiles.forEach(function(tile) {
        var from = Number(tile.position);
        var colx = transPos(tile.position)[0];
        var rowy = transPos(tile.position)[1];

        var tileStuck = false;

        //tile開始走,走到卡住或融合
        while (!tileStuck) {
            //大於0
            if (colx > 0) {
                var i = colx - 1;
                //如果左邊不是空的
                if (container[rowy * 4 + i] != 0) {
                    // console.log("左邊不是空的,融合:"+merge);
                    //檢查融合過了沒,沒有才可以繼續
                    if (!merge) {
                        if (tile.value == container[rowy * 4 + i].value) {
                            container[rowy * 4 + i].value *= 2;
                            container[tile.position] = 0;
                            tile.position = rowy * 4 + i;
                            // console.log("融合");
                            tileStuck = true;
                            merge = true;
                            change = true;
                            score += tile.value * 2;

                            break;
                        }
                    }
                    //不相等卡住融合要歸零
                    merge = false;
                    tileStuck = true;
                } else {
                    //如果右邊是空的
                    // console.log("右邊是空的");
                    container[rowy * 4 + i] = tile;
                    container[tile.position] = 0;
                    tile.position = rowy * 4 + i;
                    // console.log(tile);
                    colx--;
                    change = true;
                }
            } else {
                //等於小於0卡住
                //換行之後融合要歸零
                merge = false;
                tileStuck = true;
            }
        }

        var to = Number(tile.position);
        if (to !== from) {
            // console.log(" from:" + from + " to:" + to+"merge:"+merge);
            animator.addAnimate(from, to, merge);
        }
    });
    (score - this.score) > 0 ? $("#plusScore").show().text("+" + (score - this.score)) : "";
    $("#plusScore").delay(1000).fadeOut(500);
    this.score = score;
    updateStatus(this);
    animator.start();
    var obj = this;
    if (change) {
        $(".cell").children().promise().done(function() {
            obj.getNewRand();
            if (typeof(localStorage) !== "undefined") {
                localStorage.setItem("Container", JSON.stringify({
                    tiles: obj.gridArray,
                    score: obj.score
                }));
            }
            checkWin(obj);
            change = false;
        });
    }
};

Container.prototype.moveUp = function() {
    var tiles = [],
        score = this.score,
        container = this.gridArray,
        animator = this.animator,
        change = false;

    this.hasTile.sort(SortByrow);

    this.hasTile.forEach(function(num) {
        var colx = transPos(num)[0];
        var rowy = transPos(num)[1];
        tiles.push(container[num]);
    });

    var merge = false;

    //從前面的tile一個一個判斷移動
    tiles.forEach(function(tile) {
        var from = Number(tile.position);
        var colx = transPos(tile.position)[0];
        var rowy = transPos(tile.position)[1];

        var tileStuck = false;

        while (!tileStuck) {
            //大於0
            if (rowy > 0) {
                var i = rowy - 1;
                //如果右邊不是空的
                if (container[i * 4 + colx] != 0) {
                    //檢查融合過了沒,沒有才可以繼續
                    if (!merge) {
                        if (tile.value == container[i * 4 + colx].value) {
                            container[i * 4 + colx].value *= 2;
                            container[tile.position] = 0;
                            tile.position = i * 4 + colx;
                            tileStuck = true;
                            merge = true;
                            change = true;
                            score += tile.value * 2;
                            break;
                        }
                    }
                    //不相等卡住融合要歸零
                    merge = false;
                    tileStuck = true;
                } else {
                    //如果右邊是空的
                    container[i * 4 + colx] = tile;
                    container[tile.position] = 0;
                    tile.position = i * 4 + colx;

                    rowy--;
                    change = true;
                }
            } else {
                //等於小於0卡住
                //換行之後融合要歸零
                merge = false;
                tileStuck = true;
            }
        }
        // this.hasTile.sort(SortByrow);
        var to = Number(tile.position);
        if (to !== from) {
            // console.log(" from:" + from + " to:" + to+"merge:"+merge);
            animator.addAnimate(from, to, merge);
        }
    });
    (score - this.score) > 0 ? $("#plusScore").show().text("+" + (score - this.score)) : "";
    //$("#plusScore").delay(1000).fadeOut(500);
    this.score = score;
    updateStatus(this);
    animator.start();
    var obj = this;
    if (change) {
        $(".cell").children().promise().done(function() {
            obj.getNewRand();
            if (typeof(localStorage) !== "undefined") {
                localStorage.setItem("Container", JSON.stringify({
                    tiles: obj.gridArray,
                    score: obj.score
                }));
            }
            checkWin(obj);
            change = false;
        });
    }
};

Container.prototype.moveRight = function() {
    var tiles = [],
        score = this.score,
        container = this.gridArray,
        animator = this.animator,
        change = false;
    this.hasTile.reverse();
    this.hasTile.forEach(function(num) {
        tiles.push(container[num]);
    });

    var merge = false;

    tiles.forEach(function(tile) {
        var from = Number(tile.position);
        var colx = transPos(tile.position)[0];
        var rowy = transPos(tile.position)[1];

        var tileStuck = false;

        //tile開始走,走到卡住或融合
        while (!tileStuck) {
            //大於0
            if (colx < 3) {
                var i = colx + 1;
                //如果左邊不是空的
                if (container[rowy * 4 + i] != 0) {
                    // console.log("左邊不是空的,融合:"+merge);
                    //檢查融合過了沒,沒有才可以繼續
                    if (!merge) {
                        if (tile.value == container[rowy * 4 + i].value) {
                            container[rowy * 4 + i].value *= 2;
                            container[tile.position] = 0;
                            tile.position = rowy * 4 + i;
                            // console.log("融合");
                            tileStuck = true;
                            merge = true;
                            change = true;
                            score += tile.value * 2;
                            break;
                        }
                    }
                    //不相等卡住融合要歸零
                    merge = false;
                    tileStuck = true;
                } else {
                    //如果右邊是空的
                    // console.log("右邊是空的");
                    container[rowy * 4 + i] = tile;
                    container[tile.position] = 0;
                    tile.position = rowy * 4 + i;
                    // console.log(tile);
                    colx++;
                    change = true;
                }
            } else {
                //等於小於0卡住
                //換行之後融合要歸零
                merge = false;
                tileStuck = true;
            }
        }

        var to = Number(tile.position);
        if (to !== from) {
            // console.log(" from:" + from + " to:" + to+"merge:"+merge);
            animator.addAnimate(from, to, merge);
        }
    });
    (score - this.score) > 0 ? $("#plusScore").show().text("+" + (score - this.score)) : "";
    // $("#plusScore").delay(1000).fadeOut(500);
    this.score = score;
    updateStatus(this);
    animator.start();
    var obj = this;
    if (change) {
        $(".cell").children().promise().done(function() {
            obj.getNewRand();
            if (typeof(localStorage) !== "undefined") {
                localStorage.setItem("Container", JSON.stringify({
                    tiles: obj.gridArray,
                    score: obj.score
                }));
            }
            checkWin(obj);
            change = false;
        });
    }
};

Container.prototype.moveDown = function() {
    var tiles = [],
        score = this.score,
        container = this.gridArray,
        animator = this.animator,
        change = false;

    this.hasTile.sort(SortByrow).reverse();

    this.hasTile.forEach(function(num) {
        var colx = transPos(num)[0];
        var rowy = transPos(num)[1];
        tiles.push(container[num]);
    });

    var merge = false;

    //從前面的tile一個一個判斷移動
    tiles.forEach(function(tile) {
        var from = Number(tile.position);
        var colx = transPos(tile.position)[0];
        var rowy = transPos(tile.position)[1];

        var tileStuck = false;

        while (!tileStuck) {
            //大於0
            if (rowy < 3) {
                var i = rowy + 1;
                //如果右邊不是空的
                if (container[i * 4 + colx] != 0) {
                    //檢查融合過了沒,沒有才可以繼續
                    if (!merge) {
                        if (tile.value == container[i * 4 + colx].value) {
                            container[i * 4 + colx].value *= 2;
                            container[tile.position] = 0;
                            tile.position = i * 4 + colx;
                            tileStuck = true;
                            merge = true;
                            change = true;
                            score += tile.value * 2;
                            break;
                        }
                    }
                    //不相等卡住融合要歸零
                    merge = false;
                    tileStuck = true;
                } else {
                    //如果右邊是空的
                    container[i * 4 + colx] = tile;
                    container[tile.position] = 0;
                    tile.position = i * 4 + colx;

                    rowy++;
                    change = true;
                }
            } else {
                //等於小於0卡住
                //換行之後融合要歸零
                merge = false;
                tileStuck = true;
            }
        }
        // this.hasTile.sort(SortByrow);
        var to = Number(tile.position);
        if (to !== from) {
            // console.log(" from:" + from + " to:" + to+"merge:"+merge);
            animator.addAnimate(from, to, merge);
        }
    });
    (score - this.score) > 0 ? $("#plusScore").show().text("+" + (score - this.score)) : "";
    // $("#plusScore").delay(1000).fadeOut(500);
    this.score = score;
    updateStatus(this);
    animator.start();
    var obj = this;
    if (change) {
        $(".cell").children().promise().done(function() {
            obj.getNewRand();
            if (typeof(localStorage) !== "undefined") {
                localStorage.setItem("Container", JSON.stringify({
                    tiles: obj.gridArray,
                    score: obj.score
                }));
            }
            checkWin(obj);
            change = false;
        });
    }
};

function Animator(container) {
    this.container = container;
    this.actlist = [];
};
//開始動畫
Animator.prototype.start = function() {
    this.action();
    var i = this;
    var obj = $(".cell").children().promise();
    obj.done(function() {
        i.refresh();
    });
    // obj.done(function() {
    //     i.container.getNewRand();
    // });
    obj.done(function() {
        //刷新動畫的時候延遲1秒把加分隱藏
        $("#plusScore").delay(1000).fadeOut(500);
        $("#plusScore").promise().done(function() {
            // canMove = true;
        });
        canMove = true;
    });
};
//畫面全部刷新
Animator.prototype.refresh = function() {
    var container = this.container;
    //所有格子裡面刪除再根據資料全部新增
    $('.cell').each(function(index) {
        $("#grid" + index).children().remove();
        var tile = container.gridArray[index];
        // console.log(tile);
        if (tile != 0) {
            $("#grid" + index).append("<div></div>").children().text(tile.value).css("background-color", colors[tile.value]).addClass("tile");
        }
        // console.log($(this).html());
    });
    // console.log(container.score);

    // var oldscore = $("#score").text();
    // if (container.score - oldscore > 0) {
    //     $("#plusScore").text("+" + (container.score - oldscore)).show(400).fadeOut(400);
    //     $("#score").text(container.score);
    // }
    $("#score").text(container.score);
    // console.log(container);
};

Animator.prototype.action = function() {
    if (this.actlist.length != 0) {
        var htm = this;
        var posleft, postop, pos, ani;
        for (var i = 0; i < this.actlist.length; i++) {

            ani = this.actlist[i];
            posleft = $('#grid' + ani.to).offset().left - $('#grid' + ani.from).offset().left;
            postop = $('#grid' + ani.to).offset().top - $('#grid' + ani.from).offset().top;
            pos = {
                left: posleft,
                top: postop
            };
            var s = Math.abs(transPos(ani.to)[0] - transPos(ani.from)[0]) + Math.abs(transPos(ani.to)[1] - transPos(ani.from)[1]);
            $('#grid' + ani.from).children().animate(pos, 100);
        }
        this.actlist = [];
    }
};

Animator.prototype.addAnimate = function(from, to, merge) {
    this.actlist.push({
        from: from,
        to: to,
        merge: merge
    });
    // console.log(this.actlist);
};

Animator.prototype.addTile = function(tile) {
    $("#grid" + tile.position).children().remove();
    $('#grid' + tile.position).append("<div></div>").children().text(tile.value).css("background-color", colors[tile.value]).addClass("tile").hide().fadeIn(100);
};

//檢查是否勝利
function checkWin(container) {
    // var container = container;
    var loser = true;

    if (container.emptyArray.length == 0) {
        container.hasTile.forEach(function(num) {
            var colx = transPos(num)[0];
            var rowy = transPos(num)[1];
            //列檢查
            if (colx > 0) {
                if (container.gridArray[rowy * 4 + (colx - 1)].value == container.gridArray[num].value) {
                    loser = false;
                    //判斷橫列相鄰有沒有重複
                    // console.log("ok" + num);
                }
            }
            //行檢查
            if (rowy > 0) {
                if (container.gridArray[(rowy - 1) * 4 + colx].value == container.gridArray[num].value) {
                    loser = false;
                    //判斷直行相鄰有沒有重複
                    // console.log("Rowok" + num);
                }
            }
        });
    } else {
        loser = false;
    }

    if (loser) {
        if (typeof(localStorage) !== "undefined") {
            localStorage.removeItem("Container");
        }
        // console.log("you loser");
        $('#End-Massage').show().children().remove();
        $('#End-Massage').removeClass("win").addClass("lose");
        $('#End-Massage').append("<div>Game Over!</div>").children()
            .css({
                "padding": "20px",
                "margin-top": "190px",
                "font-size": "2em"
            }).hide().slideDown();
    }


    // console.log("判斷" + win);
    //如果贏了
    if (!(keepgo)) {
        container.hasTile.forEach(function(num) {
            if (container.gridArray[num].value >= 64) {
                win = true;
                console.log(win);
            }
        });
        if (win) {
            // console.log("you win");
            $('#End-Massage').show().children().remove();
            $('#End-Massage').removeClass("lose").addClass("win");
            $('#End-Massage').append("<div>YOU WIN!!</div>").children()
                .css({
                    "padding": "20px",
                    "margin-top": "190px",
                    "font-size": "2em"
                }).hide().slideDown();
            $('#End-Massage').append("<div id='keep-on'>Keep going</div>");
            $('#keep-on').on("click", function() {
                console.log("you win");
                addKeydownlistener(container);
                addswipelistener(container);
                $('#End-Massage').hide();
                keepgo = true;
                console.log(win);
            });
            $(document).off("keydown");
            container.mc.off('swipeup').off('swiperight').off('swipedown').off('swipeleft');
            // console.log(container.mc);
        }
    }

}

//This will sort your array
function SortByrow(a, b) {
    var cola = transPos(a)[0];
    var rowa = transPos(a)[1];
    var colb = transPos(b)[0];
    var rowb = transPos(b)[1];
    // if(cola<colb){
    //     return -1;
    // }else{
    //     if(cola==colb){
    //         if(rowa<rowb){
    //             return -1;
    //         }
    //     }
    //     return 1;           
    // }
    return (cola < colb) ? -1 : ((cola == colb) ? ((rowa < rowb) ? -1 : 1) : 1);
}
//瓦片
function Tile(value, seat) {
    this.value = value;
    this.position = seat;
}

//更新狀態
function updateStatus(container) {
    container.emptyArray = [];
    container.hasTile = [];
    container.gridArray.forEach(function(item, index) {
        if (item == 0) {
            container.emptyArray.push(index);
        } else {
            container.hasTile.push(index);
        }
    });
    // console.log(container);
};

//把pos:0~15轉換xy座標[col X,row Y]
function transPos(intPos) {
    return [intPos % 4, Math.floor(intPos / 4)];
}

function addKeydownlistener(Box) {
    $(document).keydown(function(event) {
        if (canMove) {
            if (event.which == 37) {
                canMove = false;
                Box.moveLeft();
            } else if (event.which == 38) {
                canMove = false;
                Box.moveUp();
            } else if (event.which == 39) {
                canMove = false;
                Box.moveRight();
            } else if (event.which == 40) {
                canMove = false;
                Box.moveDown();
            }

        }
    });
}

function addswipelistener(Box) {
    // mc = new Hammer(htmlelement[0]);
    Box.mc.get('swipe').set({
        direction: Hammer.DIRECTION_ALL
    });

    Box.mc.on('swipeleft', function() {
        if (canMove) {
            canMove = false;
            Box.moveLeft();
        }
    }).on('swipeup', function() {
        if (canMove) {
            canMove = false;
            Box.moveUp();
        }
    }).on('swiperight', function() {
        if (canMove) {
            canMove = false;
            Box.moveRight();
        }
    }).on('swipedown', function() {
        if (canMove) {
            canMove = false;
            Box.moveDown();
        }
    });
}





$(document).ready(function() {
    GameInit();

    $('#ctrlBtn').click(function() {
        if (typeof(localStorage) !== "undefined") {
            localStorage.removeItem("Container");
        }
        location.reload();
    });
});

function GameInit() {
    Box = new Container();
    //localStorage存檔
    if (typeof(localStorage) !== "undefined") {
        if (localStorage.getItem("Container") == null) {
            Box.getNewRand();
            Box.getNewRand();
        } else {
            var thisobj = JSON.parse(localStorage.getItem("Container"));
            Box.gridArray = thisobj.tiles;
            Box.score = thisobj.score;
        }
        updateStatus(Box);
        Box.animator.refresh();
        addKeydownlistener(Box);
        addswipelistener(Box);
        canMove = true;
    } else {
        alert("你的瀏覽器不支援存檔");
        Box.getNewRand();
        Box.getNewRand();
        updateStatus(Box);
        Box.animator.refresh();
        addKeydownlistener(Box);
        addswipelistener(Box);
        canMove = true;
        console.log("Sorry, your browser does not support Web Storage...");
    }
}
