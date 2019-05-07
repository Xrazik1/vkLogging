const easyvk = require('easyvk');
const path = require("path");
const fs = require("fs");
const dateTime = require('node-datetime');
const asr = require('./asr');
const request = require("request")

// D:/OSPanel/domains/localhost/CodeMasters/Learning/js/node/logging/MyFirstProject-050be69572ad.json /home/kolan/www/vkbot/vkLogging/

process.env.GOOGLE_APPLICATION_CREDENTIALS = path.dirname(require.main.filename) + "/MyFirstProject-050be69572ad.json"

let handleAudioPhrase = async (audioPhrase, fullMessage, vk) => {
  let dt = dateTime.create();
  let date = dt.format('Y-m-d H:M:S');

  userData = await vk.call('users.get', {
    user_ids: fullMessage.user_id
  })
  
  let text = `\n${date}\n---------\nuserId: ${ fullMessage.user_id }, Name: ${ userData.vkr[0]["first_name"] }, LastName: ${ userData.vkr[0]["last_name"] }, audioMessage: ${ audioPhrase }\n----------`;
  audioPhrase = `${date} | ${userData.vkr[0]["first_name"]} ${userData.vkr[0]["last_name"]}: ${audioPhrase}`

  fs.appendFile("logs.txt", text, function(error){
      if(error) throw error; 
  });

  if(fullMessage.chat_id != 17){
    vk.call('messages.send', {
      user_id: 173283033,
      message: audioPhrase
    })
  }
}


const currentSessionFile = path.join(__dirname, '.vksession')


easyvk({
    reauth: false,
    password: "",
    username: "",
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

        userData = await vk.call('users.get', {
          user_ids: fullMessage.user_id
        })
        userData.vkr[0]["first_name"]


        let dt = dateTime.create();
        let date = dt.format('Y-m-d H:M:S');
        let text = `\n${date}\n---------\nuserId: ${ fullMessage.user_id }, Name: ${ userData.vkr[0]["first_name"] }, LastName: ${ userData.vkr[0]["last_name"] }, message: ${ fullMessage.body }\n----------`;
    
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
