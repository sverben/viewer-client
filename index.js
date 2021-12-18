class View {
    constructor(canvas, ip) {
        this.world = {};
        this.requested = {};
        this.position = [0, 0];
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.moving = false;
        this.mousePos = [0, 0];
        this.worldName = "world";
        this.ip = ip;
        this.select = document.getElementById("world");
        this.size = document.getElementById("size");
        this.size.value = 5;
        this.blockSize = 5;

        this.colorindex = [];
        this.indexColorMap();

        var main = this;
        fetch(this.ip + "/getWorlds")
            .then(data => data.json())
            .then(data => {
                main.worlds = data;
                for (let world in main.worlds) {
                    let option = document.createElement("option");
                    option.value = main.worlds[world];
                    option.innerText = main.worlds[world];
                    main.select.append(option);
                }
            })

        main.select.addEventListener("change", () => {
            main.switchWorld(main.select.value);
        })
        this.size.addEventListener("change", () => {
            main.blockSize = main.size.value;
        })
        this.canvas.addEventListener("mousedown", ev => {
            main.moving = true;
            main.mousePos = [ev.layerX, ev.layerY];
            document.body.style.cursor = "grabbing";
        })
        this.canvas.addEventListener("mouseup", ev => {
            main.moving = false;
            document.body.style.cursor = "grab";
        })
        this.canvas.addEventListener("mousemove", ev => {
            if (!main.moving) return;
            main.position[0] += Math.round((main.mousePos[0] - ev.layerX) / main.blockSize);
            main.position[1] += Math.round((main.mousePos[1] - ev.layerY) / main.blockSize);
            main.mousePos = [ev.layerX, ev.layerY];
            this.update();
        })

    }

    async indexColorMap() {
        let response = await fetch("basecolormap.json");
        let data = await response.json();
        var indexed = {};
        for (var category in data) {
            category = data[category]
            for (var block in category["blocks"]) {
                if (typeof indexed[category["blocks"][block]] != "undefined") console.log(category["blocks"][block] + " is a duplicate")
                indexed[category["blocks"][block]] = [category.r, category.g, category.b]
            }
        }

        this.colorindex = indexed;
    }

    updateChunk(chunkX, chunkZ, chunk) {
        if (typeof this.world[chunkX] == "undefined") this.world[chunkX] = {};
        this.world[chunkX][chunkZ] = chunk;
        this.update();
    }

    requestChunk(x, z) {
        if (typeof this.requested[x] == "undefined") this.requested[x] = {};
        if (typeof this.requested[x][z] != "undefined") return;
        let main = this;
        this.requested[x][z] = true;

        fetch(`${this.ip}/getChunk?x=${x}&z=${z}&world=${this.worldName}`)
            .then(response => response.json())
            .then(data => {
                if (data.length == 0) {
                    for (let x = 0; x < 16; x++) {
                        data.push([]);
                        for (let z = 0; z < 16; z++) {
                            data[x].push({block: "BARRIER", y: -100});
                        }
                    }
                }
                main.updateChunk(x, z, data);
            })
    }

    getBlock(x, z) {
        var chunkX = Math.floor(x / 16);
        var chunkZ = Math.floor(z / 16);

        if (typeof this.world[chunkX] == "undefined") {
            this.requestChunk(chunkX, chunkZ);
            return {"block": "BARRIER", "y": -100};
        }
        if (typeof this.world[chunkX][chunkZ] == "undefined") {
            this.requestChunk(chunkX, chunkZ);
            return {"block": "BARRIER", "y": -100};
        }

        return this.world[chunkX][chunkZ][x - chunkX * 16][z - chunkZ * 16];
        try {
            let color = [...this.colorindex[this.world[chunkX][chunkZ][x - chunkX * 16][z - chunkZ * 16].block]];
            color[0] = (color[0] * 180) / 255;
            color[1] = (color[1] * 180) / 255;
            color[2] = (color[2] * 180) / 255;
            return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
        } catch(e) {
            //console.log(e);
            return "black";
        }
    }

    alternateColor(color, value) {
        color[0] = (color[0] * value) / 255;
        color[1] = (color[1] * value) / 255;
        color[2] = (color[2] * value) / 255;
        return color;
    }

    getPixel(x, z) {
        var block = this.getBlock(x, z);
        try {
            let color = [...this.colorindex[block.block]];
            var north = this.getBlock(x, z - 1);
            if (north.y > block.y) color = this.alternateColor(color, 135)
            if (north.y == block.y) color = this.alternateColor(color, 180);
            if (north.y < block.y) color = this.alternateColor(color, 220)
            return "rgb(" + color[0] + ", " + color[1] + ", " + color[2] + ")";
        } catch(e) {
            //console.log(e);
            return "black";
        }
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (var x = 0; x < this.canvas.width / this.blockSize; x++) {
            for (var z = 0; z < this.canvas.height / this.blockSize; z++) {
                this.ctx.fillStyle = this.getPixel(this.position[0] + x, this.position[1] + z);
                this.ctx.fillRect(x * this.blockSize, z * this.blockSize, this.blockSize, this.blockSize);
            }
        }
    }

    switchWorld(worldName) {
        this.worldName = worldName;
        this.world = {};
        this.position = [0, 0];
        this.requested = {};
    }

}

var view;
var ip;

window.addEventListener("load", () => {
    var canvas = document.getElementById("canvas");

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    window.addEventListener("resize", () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    })


    fetch("/servers.json")
        .then(response => response.json())
        .then(data => {
            const queryString = window.location.search;
            const urlParams = new URLSearchParams(queryString);
            for (let server in data) {
                server = data[server];
                if (server.name === urlParams.get("server")) {
                    ip = server.ip;
                    document.getElementById("servername").innerText = server.name;
                }
            }

            view = new View(canvas, ip);
            view.update();
        })
})