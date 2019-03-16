const easyvk = require('easyvk');
const path = require("path");
const fs = require("fs");
const dateTime = require('node-datetime');
const asr = require('./asr');
const request = require("request")

// D:/OSPanel/domains/localhost/CodeMasters/Learning/js/node/logging/MyFirstProject-050be69572ad.json

process.env.GOOGLE_APPLICATION_CREDENTIALS="/home/kolan/www/vkbot/vkLogging/MyFirstProject-050be69572ad.json"

let handleAudioPhrase = (audioPhrase, fullMessage, vk) => {
  let dt = dateTime.create();
  let date = dt.format('Y-m-d H:M:S');

  let text = `\n${date}\n---------\nuserId: ${ fullMessage.user_id }, audioMessage: ${ audioPhrase }\n----------`;

  fs.appendFile("logs.txt", text, function(error){
      if(error) throw error; 
  });

  // if(fullMessage.chat_id != 17){
    vk.call('messages.send', {
      user_id: fullMessage.user_id,
      message: audioPhrase
    })
  // }
}


const currentSessionFile = path.join(__dirname, '.vksession')

easyvk({
    reauth: false,
    password: "22808250Xrazik",
    username: "79776625383",
    session_file: currentSessionFile,
    save_session: true
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


      request.get( { uri, encoding: null } ).on('response', async (response) => {
        response.pipe(fs.createWriteStream("audio.mp3"));

        let audioPhrase = await asr();

        handleAudioPhrase(audioPhrase, fullMessage, vk);
      });

      
  
    });
    
    
  
}).catch(error => {
    console.log(error)
});

process.on('unhandledRejection', console.error)
