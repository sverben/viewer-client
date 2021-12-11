fetch("/servers.json")
    .then(response => response.json())
    .then(data => {
        let servers = document.getElementById("view");
        for (let item in data) {
            item = data[item];
            let server = document.createElement("div");
            server.classList.add("server");
            let title = document.createElement("h2");
            title.innerText = item.name;
            server.append(title);
            servers.append(server);

            server.addEventListener("click", () => {
                let a = document.createElement("a");
                a.href = `/view.html?server=${item.name}`;
                a.click();
            })
        }
    })