const easyvk = require('easyvk');
const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const fs = require("fs");
const dateTime = require('node-datetime');
const asr = require('./asr');
const request = require('request-promise')



easyvk({
    password: "22808250Xrazik",
    username: "79776625383",
    reauth: true
  }).then(async (vk) => {
      
    console.log("Vk logging is up and writing in logs.txt");

    async function getMessage (msgArray = []) {
      const MESSAGE_ID__INDEX = 1;
    
      return vk.call('messages.getById', {
        message_ids: msgArray[MESSAGE_ID__INDEX]
      })
    }
    


    let { connection } = await (vk.longpoll.connect());

    connection.on("message", async (msg) => {
  
      let {vkr: fullMessage} = (await(getMessage(msg)));


      fullMessage = fullMessage.items[0];

      
      if( fullMessage.body != "" ){
        let dt = dateTime.create();
        let date = dt.format('Y-m-d H:M:S');

        let text = `\n${date}\n---------\nuserId: ${ fullMessage.user_id }, message: ${ fullMessage.body }\n----------`;
    
        fs.appendFile("logs.txt", text, function(error){
            if(error) throw error; 
        });
      }


      try {
        const uri = fullMessage["attachments"][0]["doc"]["preview"]["audio_msg"]["link_mp3"];
      }catch(e){
        return;
      }

      const uri = fullMessage["attachments"][0]["doc"]["preview"]["audio_msg"]["link_mp3"];

      const audio = await request.get({ uri, encoding: null });
      let audioPhrase;
      
      try {
        audioPhrase = await asr(audio)
      }
      catch (e) {
        console.error('asr error', e)
        throw ('сбой в распознавании речи');
      }

      if(audioPhrase){
        let dt = dateTime.create();
        let date = dt.format('Y-m-d H:M:S');

        let text = `\n${date}\n---------\nuserId: ${ fullMessage.user_id }, audioMessage: ${ audioPhrase }\n----------`;
    
        fs.appendFile("logs.txt", text, function(error){
            if(error) throw error; 
        });

        if(fullMessage.chat_id != 17){
          vk.call('messages.send', {
            user_id: fullMessage.user_id,
            message: audioPhrase
          })
        }


      }
      
  
    });
    
    



    // const session = vk.session;

    // const lpSettings = {
    //     forGetLongPollServer: {
    //         lp_version: "3", //Изменяем версию LongPoll, в EasyVK используется версия 2
    //         need_pts: "1"
    //     },
    //     forLongPollServer: {
    //         wait: "15" //Ждем ответа 15 секунд
    //     }
    // }
    
    // function longPollDebugger({type, data}) {
    //     // Конвертируем JSON в объект
    //     if (type == "pollResponse"){
    //         let json = JSON.parse(data);

    //         console.log(json.updates[0]);

    //         if (typeof json.updates == "undefined"){
    //             return;
    //         }

    //         if (!(0 in json.updates)){
    //             return;
    //         }


    //         let resCode = json.updates[0][0];

    //         if(resCode == 4){
    //             let dt = dateTime.create();
    //             let date = dt.format('Y-m-d H:M:S');

    //             let text = `\n${date}\n---------\n${json.updates}\n----------`;
            
    //             fs.appendFile("logs.txt", text, function(error){
    //                 if(error) throw error; 
    //             });
    //         }
    //     }
    // }
      
    //   vk.longpoll.connect()
    //   .then(({connection: lpcon}) => {
      
    //     lpcon.debug(longPollDebugger);

        
    //   })
  
}).catch(error => {
    console.log(error);
});


