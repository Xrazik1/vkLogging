const easyvk = require('easyvk');
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const fs = require("fs");
const dateTime = require('node-datetime');


const app = express();
// Parsers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended : false }));

app.use(express.static(path.join(__dirname, 'client')));

// Serve index.html from client folder
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/index.html'));
});

// Set Port
const port = process.env.PORT || '3001';
app.set('port', port)

// Create an HTTP server
const server = http.createServer(app);

server.listen(port, () => console.log(`Server is up and running on localhost;port: ${port}`));

easyvk({
    password: "22808250Xrazik",
    username: "79776625383"
  }).then(vk => {
    const session = vk.session;

    const lpSettings = {
        forGetLongPollServer: {
            lp_version: "3", //Изменяем версию LongPoll, в EasyVK используется версия 2
            need_pts: "1"
        },
        forLongPollServer: {
            wait: "15" //Ждем ответа 15 секунд
        }
    }
    
    function longPollDebugger({type, data}) {
        // Конвертируем JSON в объект
        if (type == "pollResponse"){
            let json = JSON.parse(data);

            if (typeof json.updates == "undefined"){
                console.log("Отсутствует объект updates")
                return;
            }

            if (!(0 in json.updates)){
                console.log("Ошибка в проверке наличия кода ответа")
                return;
            }


            let resCode = json.updates[0][0];

            if(resCode == 4){
                let dt = dateTime.create();
                let date = dt.format('Y-m-d H:M:S');

                let text = `\n${date}\n---------\n${json.updates}\n----------`;
            
                fs.appendFile("logs.txt", text, function(error){
                    if(error) throw error; 
                });
            }
        }
    }
      
      vk.longpoll.connect()
      .then(({connection: lpcon}) => {
      
        lpcon.debug(longPollDebugger);

        
      })
  
});

